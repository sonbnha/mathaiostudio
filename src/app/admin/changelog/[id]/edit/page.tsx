import React from 'react';
import ChangelogEditorForm from '@/components/admin/ChangelogEditorForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminChangelogEditPage({ params }: PageProps) {
  const { id } = await params;
  return <ChangelogEditorForm initialId={id} isNew={false} />;
}
