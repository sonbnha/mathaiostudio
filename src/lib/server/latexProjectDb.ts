import { getDb } from '@/lib/db';

export interface CloudLatexProject {
  id: string;
  ownerId: string;
  title: string;
  templateId: string;
  mainDocument: string;
  compilerEngine: string;
  revision: number;
  files: Array<{ name: string; content: string; path?: string }>;
  images?: Array<{ name: string; url?: string; dataUrl?: string }>;
  metadata?: Record<string, any>;
  settings?: Record<string, any>;
  isStarred?: boolean;
  isTrashed?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  userRole?: 'owner' | 'editor' | 'reviewer' | 'viewer';
}

let isInitialized = false;

export async function ensureLatexTables(sqlClient?: any) {
  if (isInitialized) return;
  const sql = sqlClient || getDb();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS latex_projects (
        id VARCHAR(100) PRIMARY KEY,
        owner_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        template_id VARCHAR(100) DEFAULT 'blank',
        main_document VARCHAR(255) DEFAULT 'main.tex',
        compiler_engine VARCHAR(50) DEFAULT 'xelatex',
        revision INT DEFAULT 1,
        files JSONB NOT NULL DEFAULT '[]'::jsonb,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_starred BOOLEAN DEFAULT FALSE,
        is_trashed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS latex_project_members (
        id VARCHAR(100) PRIMARY KEY,
        project_id VARCHAR(100) NOT NULL REFERENCES latex_projects(id) ON DELETE CASCADE,
        user_id VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'editor',
        invite_token VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );
    `;

    // Index for speed
    await sql`
      CREATE INDEX IF NOT EXISTS idx_latex_projects_owner ON latex_projects(owner_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_latex_members_user ON latex_project_members(user_id);
    `;

    isInitialized = true;
  } catch (err) {
    console.error('Lỗi khởi tạo bảng latex_projects:', err);
  }
}

export async function getProjectWithAccess(
  projectId: string,
  userId?: string | null,
  shareToken?: string | null
): Promise<{ project: CloudLatexProject; role: 'owner' | 'editor' | 'reviewer' | 'viewer' } | null> {
  const sql = getDb();
  await ensureLatexTables(sql);

  const rows = await sql`
    SELECT * FROM latex_projects
    WHERE id = ${projectId} AND is_trashed = FALSE
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) return null;
  const p = rows[0] as any;

  let userRole: 'owner' | 'editor' | 'reviewer' | 'viewer' | null = null;

  if (userId) {
    if (p.owner_id === String(userId)) {
      userRole = 'owner';
    } else {
      const memberRows = await sql`
        SELECT role FROM latex_project_members
        WHERE project_id = ${projectId} AND user_id = ${String(userId)}
        LIMIT 1;
      `;
      if (memberRows && memberRows.length > 0) {
        userRole = memberRows[0].role as any;
      }
    }
  }

  // Token access fallback
  if (!userRole && shareToken) {
    if (shareToken.startsWith('token_view_') || shareToken.includes('view')) {
      userRole = 'viewer';
    } else if (shareToken.startsWith('token_edit_') || shareToken.includes('edit')) {
      userRole = 'editor';
    }
  }

  if (!userRole) {
    return null;
  }

  const project: CloudLatexProject = {
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    templateId: p.template_id || 'blank',
    mainDocument: p.main_document || 'main.tex',
    compilerEngine: p.compiler_engine || 'xelatex',
    revision: Number(p.revision || 1),
    files: typeof p.files === 'string' ? JSON.parse(p.files) : p.files || [],
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
    metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata || {},
    settings: typeof p.settings === 'string' ? JSON.parse(p.settings) : p.settings || {},
    isStarred: Boolean(p.is_starred),
    isTrashed: Boolean(p.is_trashed),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    userRole,
  };

  return { project, role: userRole };
}

export async function listUserCloudProjects(userId: string): Promise<CloudLatexProject[]> {
  const sql = getDb();
  await ensureLatexTables(sql);

  const rows = await sql`
    SELECT 
      p.*,
      CASE 
        WHEN p.owner_id = ${String(userId)} THEN 'owner'
        ELSE COALESCE(m.role, 'viewer')
      END AS user_role
    FROM latex_projects p
    LEFT JOIN latex_project_members m ON p.id = m.project_id AND m.user_id = ${String(userId)}
    WHERE (p.owner_id = ${String(userId)} OR m.user_id = ${String(userId)})
      AND p.is_trashed = FALSE
    ORDER BY p.updated_at DESC;
  `;

  return (rows || []).map((p: any) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    templateId: p.template_id || 'blank',
    mainDocument: p.main_document || 'main.tex',
    compilerEngine: p.compiler_engine || 'xelatex',
    revision: Number(p.revision || 1),
    files: typeof p.files === 'string' ? JSON.parse(p.files) : p.files || [],
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
    metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata || {},
    settings: typeof p.settings === 'string' ? JSON.parse(p.settings) : p.settings || {},
    isStarred: Boolean(p.is_starred),
    isTrashed: Boolean(p.is_trashed),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    userRole: p.user_role as any,
  }));
}

export async function saveCloudProject(
  data: Partial<CloudLatexProject> & { id: string },
  userId: string,
  clientRevision?: number
): Promise<{ success: boolean; project?: CloudLatexProject; conflict?: boolean; error?: string }> {
  const sql = getDb();
  await ensureLatexTables(sql);

  // Check if exists
  const existingRows = await sql`
    SELECT id, owner_id, revision FROM latex_projects
    WHERE id = ${data.id}
    LIMIT 1;
  `;

  if (!existingRows || existingRows.length === 0) {
    // Insert new project
    const newRevision = 1;
    const filesJson = JSON.stringify(data.files || [{ name: 'main.tex', content: '' }]);
    const imagesJson = JSON.stringify(data.images || []);
    const metaJson = JSON.stringify(data.metadata || {});
    const settingsJson = JSON.stringify(data.settings || {});

    await sql`
      INSERT INTO latex_projects (
        id, owner_id, title, template_id, main_document, compiler_engine,
        revision, files, images, metadata, settings, is_starred, is_trashed,
        created_at, updated_at
      ) VALUES (
        ${data.id}, ${String(userId)}, ${data.title || 'Tai_lieu_chua_dat_ten.tex'},
        ${data.templateId || 'blank'}, ${data.mainDocument || 'main.tex'},
        ${data.compilerEngine || 'xelatex'}, ${newRevision},
        ${filesJson}::jsonb, ${imagesJson}::jsonb, ${metaJson}::jsonb, ${settingsJson}::jsonb,
        ${Boolean(data.isStarred)}, FALSE, NOW(), NOW()
      );
    `;

    const created = await getProjectWithAccess(data.id, userId);
    return { success: true, project: created?.project };
  }

  const existing = existingRows[0];
  const currentRevision = Number(existing.revision || 1);

  // Permission check
  const access = await getProjectWithAccess(data.id, userId);
  if (!access || (access.role !== 'owner' && access.role !== 'editor')) {
    return { success: false, error: 'Bạn không có quyền chỉnh sửa dự án này.' };
  }

  // Conflict detection: if client provides revision and server revision is ahead
  if (clientRevision !== undefined && clientRevision < currentRevision) {
    return {
      success: false,
      conflict: true,
      error: 'Dữ liệu trên máy chủ đã được cập nhật từ một phiên khác. Vui lòng tải lại hoặc hợp nhất.',
      project: access.project,
    };
  }

  const nextRevision = currentRevision + 1;
  const filesJson = JSON.stringify(data.files !== undefined ? data.files : access.project.files);
  const imagesJson = JSON.stringify(data.images !== undefined ? data.images : access.project.images || []);
  const metaJson = JSON.stringify(data.metadata !== undefined ? data.metadata : access.project.metadata || {});
  const settingsJson = JSON.stringify(data.settings !== undefined ? data.settings : access.project.settings || {});

  await sql`
    UPDATE latex_projects
    SET 
      title = COALESCE(${data.title}, title),
      template_id = COALESCE(${data.templateId}, template_id),
      main_document = COALESCE(${data.mainDocument}, main_document),
      compiler_engine = COALESCE(${data.compilerEngine}, compiler_engine),
      revision = ${nextRevision},
      files = ${filesJson}::jsonb,
      images = ${imagesJson}::jsonb,
      metadata = ${metaJson}::jsonb,
      settings = ${settingsJson}::jsonb,
      is_starred = COALESCE(${data.isStarred}, is_starred),
      updated_at = NOW()
    WHERE id = ${data.id};
  `;

  const updated = await getProjectWithAccess(data.id, userId);
  return { success: true, project: updated?.project };
}

export async function deleteCloudProject(projectId: string, userId: string): Promise<boolean> {
  const sql = getDb();
  await ensureLatexTables(sql);

  const access = await getProjectWithAccess(projectId, userId);
  if (!access || access.role !== 'owner') {
    return false;
  }

  await sql`
    UPDATE latex_projects
    SET is_trashed = TRUE, updated_at = NOW()
    WHERE id = ${projectId};
  `;
  return true;
}
