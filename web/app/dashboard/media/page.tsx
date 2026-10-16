"use client";

import Link from "next/link";
import { MediaLibrary } from "@/components/media-library";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, SectionHeading } from "@/components/ui";
import { TEMPLATES } from "@/lib/slide-templates";

export default function MediaPage() {
  const { workspace } = useWorkspace();
  const usingUploads = workspace?.visual_source === "uploads";
  const photoTemplate = workspace ? TEMPLATES[workspace.template]?.kind === "photo" : false;

  return (
    <div className="space-y-6">
      <SectionHeading title="Photos" description="Product and brand photos your posts are designed around." />
      {(!usingUploads || !photoTemplate) && (
        <Card className="px-5 py-4 text-sm text-ink-soft">
          {usingUploads
            ? "Your current template doesn't show photos. Pick a template with photos in "
            : `Your posts currently use ${workspace?.visual_source === "stock" ? "stock photos" : "text-first designs"}. To design posts around these photos, choose “My own photos” in `}
          <Link href="/dashboard/brand" className="font-medium text-brand-soft underline underline-offset-2">
            Brand & design
          </Link>
          .
        </Card>
      )}
      <MediaLibrary workspaceId={workspace?.id} />
    </div>
  );
}
