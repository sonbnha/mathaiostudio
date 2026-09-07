import React from 'react';
import ChangelogEditorForm from '@/components/admin/ChangelogEditorForm';

export const dynamic = 'force-dynamic';

export default function AdminChangelogNewPage() {
  return <ChangelogEditorForm isNew={true} />;
}
