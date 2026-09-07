import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { initDb } from '@/lib/init-db';

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

// Middleware check for ADMIN role
async function checkAdmin(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);
  if (!user || (user.role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return user;
}

// GET /api/admin/users: List all users (Supports search by email/name, returns saved diagrams count)
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: 'Page not found' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const source = searchParams.get('source');

  // Trường hợp quản lý nhân sự License Key (Prisma)
  if (source === 'staff') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          maxCredits: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { keys: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, users });
    } catch (error: any) {
      console.error('Error fetching staff users:', error);
      return NextResponse.json({ error: 'Lỗi khi tải danh sách nhân sự.' }, { status: 500 });
    }
  }

  // Mặc định: Lấy danh sách toàn bộ người dùng từ Neon Database
  try {
    await initDb();
    const sql = getDb();

    let rows;
    if (search) {
      const pattern = `%${search}%`;
      rows = await sql`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.username,
          u.role, 
          COALESCE(u.status, 'active') AS status,
          COALESCE(u.is_active, true) AS is_active, 
          u.api_key,
          u.cuid,
          u.created_at,
          COALESCE(u.key_quota, 50) AS key_quota,
          COALESCE(u.is_vip, false) AS is_vip,
          COALESCE(u.is_trial, NOT COALESCE(u.is_vip, false)) AS is_trial,
          u.vip_expires_at,
          u.remaining_quota,
          u.max_quota,
          COALESCE(u.lifetime_quota, 0) AS lifetime_quota,
          COALESCE(u.subscription_quota, 0) AS subscription_quota,
          u.subscription_expires_at,
          COALESCE(u.monthly_allowance, 0) AS monthly_allowance,
          COALESCE(u.monthly_credits, 0) AS monthly_credits,
          u.next_credit_reset_at,
          u.plan_expires_at,
          COALESCE(u.lifetime_credits, 0) AS lifetime_credits,
          u.avatar,
          (
            SELECT json_build_object('key', lk.key, 'used_at', lk.used_at)
            FROM license_keys lk
            WHERE lk.used_by = u.id
            ORDER BY lk.used_at DESC NULLS LAST, lk.created_at DESC
            LIMIT 1
          ) AS last_activated_key,
          COUNT(DISTINCT d.id)::int AS saved_diagrams_count,
          COUNT(DISTINCT lk.id)::int AS created_keys_count
        FROM users u
        LEFT JOIN saved_diagrams d ON d.user_id = u.id
        LEFT JOIN "LicenseKey" lk ON (lk."createdById" = u.id::text OR (u.cuid IS NOT NULL AND lk."createdById" = u.cuid))
        WHERE u.name ILIKE ${pattern} OR u.email ILIKE ${pattern} OR (u.username IS NOT NULL AND u.username ILIKE ${pattern})
        GROUP BY u.id, u.name, u.email, u.username, u.role, u.status, u.is_active, u.api_key, u.cuid, u.created_at, 
                 u.key_quota, u.is_vip, u.is_trial, u.vip_expires_at, u.remaining_quota, u.max_quota, 
                 u.lifetime_quota, u.subscription_quota, u.subscription_expires_at,
                 u.monthly_allowance, u.monthly_credits, u.next_credit_reset_at, u.plan_expires_at, u.lifetime_credits, u.avatar
        ORDER BY u.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.username,
          u.role, 
          COALESCE(u.status, 'active') AS status,
          COALESCE(u.is_active, true) AS is_active, 
          u.api_key,
          u.cuid,
          u.created_at,
          COALESCE(u.key_quota, 50) AS key_quota,
          COALESCE(u.is_vip, false) AS is_vip,
          COALESCE(u.is_trial, NOT COALESCE(u.is_vip, false)) AS is_trial,
          u.vip_expires_at,
          u.remaining_quota,
          u.max_quota,
          COALESCE(u.lifetime_quota, 0) AS lifetime_quota,
          COALESCE(u.subscription_quota, 0) AS subscription_quota,
          u.subscription_expires_at,
          COALESCE(u.monthly_allowance, 0) AS monthly_allowance,
          COALESCE(u.monthly_credits, 0) AS monthly_credits,
          u.next_credit_reset_at,
          u.plan_expires_at,
          COALESCE(u.lifetime_credits, 0) AS lifetime_credits,
          u.avatar,
          (
            SELECT json_build_object('key', lk.key, 'used_at', lk.used_at)
            FROM license_keys lk
            WHERE lk.used_by = u.id
            ORDER BY lk.used_at DESC NULLS LAST, lk.created_at DESC
            LIMIT 1
          ) AS last_activated_key,
          COUNT(DISTINCT d.id)::int AS saved_diagrams_count,
          COUNT(DISTINCT lk.id)::int AS created_keys_count
        FROM users u
        LEFT JOIN saved_diagrams d ON d.user_id = u.id
        LEFT JOIN "LicenseKey" lk ON (lk."createdById" = u.id::text OR (u.cuid IS NOT NULL AND lk."createdById" = u.cuid))
        GROUP BY u.id, u.name, u.email, u.username, u.role, u.status, u.is_active, u.api_key, u.cuid, u.created_at, 
                 u.key_quota, u.is_vip, u.is_trial, u.vip_expires_at, u.remaining_quota, u.max_quota, 
                 u.lifetime_quota, u.subscription_quota, u.subscription_expires_at,
                 u.monthly_allowance, u.monthly_credits, u.next_credit_reset_at, u.plan_expires_at, u.lifetime_credits, u.avatar
        ORDER BY u.created_at DESC
      `;
    }

    const users = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.username || r.email,
      email: r.email,
      username: r.username || r.email,
      avatar: r.avatar || null,
      avatar_url: r.avatar || null,
      photo_url: r.avatar || null,
      role: r.role || 'user',
      status: r.status || 'active',
      is_active: r.status === 'active',
      isActive: r.status === 'active',
      is_vip: Boolean(r.is_vip),
      isVip: Boolean(r.is_vip),
      is_trial: Boolean(r.is_trial),
      isTrial: Boolean(r.is_trial),
      vip_expires_at: r.plan_expires_at || r.vip_expires_at,
      vipExpiresAt: r.plan_expires_at || r.vip_expires_at,
      remaining_quota: r.remaining_quota !== null && r.remaining_quota !== undefined ? Number(r.remaining_quota) : null,
      remainingQuota: r.remaining_quota !== null && r.remaining_quota !== undefined ? Number(r.remaining_quota) : null,
      max_quota: r.max_quota !== null && r.max_quota !== undefined ? Number(r.max_quota) : null,
      maxQuota: r.max_quota !== null && r.max_quota !== undefined ? Number(r.max_quota) : null,
      lifetime_quota: Number(r.lifetime_credits ?? r.lifetime_quota ?? 0),
      lifetimeQuota: Number(r.lifetime_credits ?? r.lifetime_quota ?? 0),
      subscription_quota: Number(r.monthly_credits ?? r.subscription_quota ?? 0),
      subscriptionQuota: Number(r.monthly_credits ?? r.subscription_quota ?? 0),
      subscription_expires_at: r.plan_expires_at || r.subscription_expires_at || null,
      subscriptionExpiresAt: r.plan_expires_at || r.subscription_expires_at || null,
      monthly_allowance: Number(r.monthly_allowance ?? 0),
      monthlyAllowance: Number(r.monthly_allowance ?? 0),
      monthly_credits: Number(r.monthly_credits ?? 0),
      monthlyCredits: Number(r.monthly_credits ?? 0),
      next_credit_reset_at: r.next_credit_reset_at || null,
      nextCreditResetAt: r.next_credit_reset_at || null,
      plan_expires_at: r.plan_expires_at || r.subscription_expires_at || null,
      planExpiresAt: r.plan_expires_at || r.subscription_expires_at || null,
      lifetime_credits: Number(r.lifetime_credits ?? r.lifetime_quota ?? 0),
      lifetimeCredits: Number(r.lifetime_credits ?? r.lifetime_quota ?? 0),
      last_activated_key: r.last_activated_key || null,
      lastActivatedKey: r.last_activated_key || null,
      api_key: r.api_key,
      apiKey: r.api_key,
      cuid: r.cuid,
      created_at: r.created_at,
      createdAt: r.created_at,
      saved_diagrams_count: Number(r.saved_diagrams_count || 0),
      savedDiagramsCount: Number(r.saved_diagrams_count || 0),
      key_quota: r.role === 'admin' ? -1 : Number(r.key_quota ?? 50),
      keyQuota: r.role === 'admin' ? -1 : Number(r.key_quota ?? 50),
      maxCredits: r.role === 'admin' ? -1 : Number(r.key_quota ?? 50),
      _count: {
        keys: Number(r.created_keys_count || 0),
      },
    }));

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error fetching users from Neon:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi khi tải danh sách người dùng.' }, { status: 500 });
  }
}

// POST /api/admin/users: Create new account
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: 'Page not found' },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const {
      email,
      username,
      password,
      name,
      full_name,
      role = 'user',
      source = 'neon',
      maxCredits = 50,
      key_quota,
      tier,
      plan_type,
      monthly_credits,
      credits,
      duration_days,
    } = body;

    const cleanName = (full_name || name || '').trim();
    const rawEmail = (email || '').trim().toLowerCase();
    const rawUsername = (username || '').trim().toLowerCase();

    if (!cleanName || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Họ tên và Mật khẩu.' },
        { status: 400 }
      );
    }

    if (!rawEmail && !rawUsername) {
      return NextResponse.json(
        { error: 'Vui lòng nhập Email hoặc Tên đăng nhập.' },
        { status: 400 }
      );
    }

    const cleanUsername = rawUsername || (rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail);
    const cleanEmail = rawEmail || `${cleanUsername}@mathaio.local`;

    // 1. Tạo trên Neon
    if (source === 'neon' || cleanEmail || role) {
      await initDb();
      const sql = getDb();

      const existing = await sql`SELECT id, email, username FROM users WHERE LOWER(email) = ${cleanEmail} OR (username IS NOT NULL AND LOWER(username) = ${cleanUsername}) LIMIT 1`;
      if (existing && existing.length > 0) {
        const isEmailMatch = existing[0].email?.toLowerCase() === cleanEmail;
        return NextResponse.json(
          { error: isEmailMatch ? `Email "${cleanEmail}" đã được sử dụng.` : `Tên đăng nhập "${cleanUsername}" đã được sử dụng.` },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const normalizedRole = ['admin', 'ctv', 'staff', 'user'].includes(role.toLowerCase())
        ? (role.toLowerCase() === 'staff' ? 'ctv' : role.toLowerCase())
        : 'user';

      let isVip = false;
      let isTrial = true;
      let lifetimeQuota = 10;
      let lifetimeCredits = 10;
      let subscriptionQuota = 0;
      let monthlyAllowance = 0;
      let monthlyCredits = 0;
      let subscriptionExpiresAt: Date | null = null;
      let planExpiresAt: Date | null = null;
      let vipExpiresAt: Date | null = null;
      let nextCreditResetAt: Date | null = null;
      let remainingQuota = 10;
      let maxQuota = 10;
      let effectiveKeyQuota = 0;

      if (normalizedRole === 'admin') {
        isVip = true;
        isTrial = false;
        lifetimeQuota = 999999;
        lifetimeCredits = 999999;
        remainingQuota = 999999;
        maxQuota = 999999;
        effectiveKeyQuota = -1;
      } else {
        if (normalizedRole === 'ctv') {
          effectiveKeyQuota = key_quota !== undefined
            ? Number(key_quota)
            : (maxCredits !== undefined ? Number(maxCredits) : 50);
        } else {
          effectiveKeyQuota = 0;
        }

        const rawOmega = monthly_credits !== undefined
          ? Number(monthly_credits)
          : (credits !== undefined ? Number(credits) : 50);

        const isUnlimitedOmega = rawOmega === -1 || rawOmega >= 999999;
        const omegaGranted = isUnlimitedOmega ? 999999 : Math.max(0, rawOmega);

        const isLifetime = plan_type === 'lifetime' || duration_days === 0 || duration_days === -1 || duration_days === null;

        if (isLifetime) {
          lifetimeQuota = omegaGranted;
          lifetimeCredits = omegaGranted;
          subscriptionQuota = 0;
          monthlyAllowance = 0;
          monthlyCredits = 0;
          remainingQuota = omegaGranted;
          maxQuota = omegaGranted;
          isVip = isUnlimitedOmega || omegaGranted > 10 || tier === 'VIP';
          isTrial = !isVip;
        } else {
          const durDays = Number(duration_days) > 0 ? Number(duration_days) : 30;
          const now = new Date();
          planExpiresAt = new Date(now.getTime() + durDays * 24 * 60 * 60 * 1000);
          subscriptionExpiresAt = planExpiresAt;
          vipExpiresAt = planExpiresAt;
          nextCreditResetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          monthlyAllowance = omegaGranted;
          monthlyCredits = omegaGranted;
          subscriptionQuota = omegaGranted;
          lifetimeQuota = 0;
          lifetimeCredits = 0;
          remainingQuota = omegaGranted;
          maxQuota = omegaGranted;
          isVip = true;
          isTrial = false;
        }
      }

      const inserted = await sql`
        INSERT INTO users (
          email, 
          username, 
          password_hash, 
          name, 
          role, 
          status,
          is_active, 
          key_quota,
          lifetime_quota,
          lifetime_credits,
          subscription_quota,
          subscription_expires_at,
          monthly_allowance,
          monthly_credits,
          next_credit_reset_at,
          plan_expires_at,
          vip_expires_at,
          remaining_quota,
          max_quota,
          is_vip,
          is_trial
        )
        VALUES (
          ${cleanEmail}, 
          ${cleanUsername}, 
          ${passwordHash}, 
          ${cleanName}, 
          ${normalizedRole}, 
          'active',
          true, 
          ${effectiveKeyQuota},
          ${lifetimeQuota},
          ${lifetimeCredits},
          ${subscriptionQuota},
          ${subscriptionExpiresAt},
          ${monthlyAllowance},
          ${monthlyCredits},
          ${nextCreditResetAt},
          ${planExpiresAt},
          ${vipExpiresAt},
          ${remainingQuota},
          ${maxQuota},
          ${isVip},
          ${isTrial}
        )
        RETURNING id, name, email, username, role, is_active, key_quota, created_at, is_vip, remaining_quota, max_quota, lifetime_quota, subscription_quota, plan_expires_at
      `;

      const u = inserted[0] as any;

      try {
        if (normalizedRole === 'admin' || normalizedRole === 'ctv') {
          const prismaRole = normalizedRole === 'admin' ? 'ADMIN' : 'STAFF';
          const pUser = await prisma.user.create({
            data: {
              id: u.id,
              username: cleanUsername,
              passwordHash,
              name: cleanName,
              role: prismaRole,
              maxCredits: effectiveKeyQuota,
              isActive: true,
            },
          });
          await sql`UPDATE users SET cuid = ${pUser.id} WHERE id = ${u.id}::uuid;`;
        }
      } catch (err) {
        console.error('Prisma user sync notice:', err);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role,
          is_active: u.is_active,
          isActive: u.is_active,
          is_vip: u.is_vip,
          isVip: u.is_vip,
          key_quota: u.key_quota,
          keyQuota: u.key_quota,
          maxCredits: u.key_quota,
          remaining_quota: u.remaining_quota,
          remainingQuota: u.remaining_quota,
          created_at: u.created_at,
          createdAt: u.created_at,
          savedDiagramsCount: 0,
        },
      }, { status: 201 });
    }

    // 2. Tạo trên Prisma cho Staff License Key
    const existingPrisma = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingPrisma) {
      return NextResponse.json(
        { error: `Tên đăng nhập "${cleanUsername}" đã tồn tại.` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        name: cleanName,
        role: role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STAFF',
        maxCredits: role.toUpperCase() === 'ADMIN' ? -1 : (typeof maxCredits === 'number' ? maxCredits : Number(maxCredits) || 50),
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        maxCredits: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error?.message || 'Không thể tạo tài khoản người dùng.' }, { status: 500 });
  }
}

// Handler cập nhật
async function handleUpdate(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Quyền truy cập bị từ chối.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, isActive, is_active, status, maxCredits, password, name, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID người dùng cần cập nhật.' }, { status: 400 });
    }

    if (isUuid(id)) {
      await initDb();
      const sql = getDb();

      if (role) {
        const normalizedRole = role.toLowerCase();
        const validRole = ['admin', 'ctv', 'user'].includes(normalizedRole) ? normalizedRole : 'user';
        await sql`UPDATE users SET role = ${validRole} WHERE id = ${id}::uuid`;
      }

      let normalizedStatus: string | undefined = undefined;
      if (status && (status === 'active' || status === 'banned')) {
        normalizedStatus = status;
      } else if (typeof is_active === 'boolean') {
        normalizedStatus = is_active ? 'active' : 'banned';
      } else if (typeof isActive === 'boolean') {
        normalizedStatus = isActive ? 'active' : 'banned';
      }

      if (normalizedStatus) {
        const activeBool = normalizedStatus === 'active';
        await sql`UPDATE users SET status = ${normalizedStatus}, is_active = ${activeBool} WHERE id = ${id}::uuid`;
      }

      if (password && password.trim()) {
        const passwordHash = await bcrypt.hash(password.trim(), 10);
        await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}::uuid`;
      }

      if (name && name.trim()) {
        await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${id}::uuid`;
      }

      const rows = await sql`
        SELECT u.id, u.name, u.email, u.role, COALESCE(u.status, 'active') as status,
               COALESCE(u.is_active, true) as is_active, u.created_at,
               COUNT(d.id)::int as saved_diagrams_count
        FROM users u
        LEFT JOIN saved_diagrams d ON d.user_id = u.id
        WHERE u.id = ${id}::uuid
        GROUP BY u.id, u.name, u.email, u.role, u.status, u.is_active, u.created_at
      `;

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
      }

      const u = rows[0] as any;
      return NextResponse.json({
        success: true,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status || 'active',
          is_active: u.status === 'active',
          isActive: u.status === 'active',
          created_at: u.created_at,
          createdAt: u.created_at,
          saved_diagrams_count: Number(u.saved_diagrams_count || 0),
          savedDiagramsCount: Number(u.saved_diagrams_count || 0),
        },
      });
    }

    // Prisma User
    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof is_active === 'boolean') updateData.isActive = is_active;
    if (typeof maxCredits === 'number') updateData.maxCredits = maxCredits;
    if (name) updateData.name = name.trim();
    if (role && (role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'STAFF')) {
      updateData.role = role.toUpperCase();
    }
    if (password && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        maxCredits: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error?.message || 'Không thể cập nhật thông tin người dùng.' }, { status: 500 });
  }
}

// PATCH /api/admin/users
export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

// PUT /api/admin/users
export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

// DELETE /api/admin/users: Delete user by query param ?id=...
export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: 'Quyền truy cập bị từ chối. Chỉ Administrator mới có quyền xóa.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID người dùng cần xóa.' }, { status: 400 });
    }

    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Không thể tự xóa tài khoản của chính bạn.' },
        { status: 400 }
      );
    }

    const action = searchParams.get('action');
    if (action === 'clear_diagrams') {
      if (isUuid(id)) {
        await initDb();
        const sql = getDb();
        await sql`DELETE FROM saved_diagrams WHERE user_id = ${id}::uuid`;
        return NextResponse.json({
          success: true,
          message: 'Đã dọn sạch toàn bộ hình vẽ trong bộ sưu tập của người dùng.',
        });
      }
    }

    if (isUuid(id)) {
      await initDb();
      const sql = getDb();
      await sql`DELETE FROM users WHERE id = ${id}::uuid`;
      return NextResponse.json({ success: true, message: 'Đã xóa tài khoản người dùng thành công.' });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa tài khoản thành công.' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi khi xóa người dùng.' }, { status: 500 });
  }
}
