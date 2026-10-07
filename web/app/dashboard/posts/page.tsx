"use client";

import { useState } from "react";
import { PostCard } from "@/components/post-card";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, SectionHeading, Segmented } from "@/components/ui";
import { usePosts } from "@/lib/posts";
import type { Post } from "@/lib/types";

type Filter = "all" | "ready" | "other";

const MATCH: Record<Filter, (p: Post) => boolean> = {
  all: (p) => p.status !== "superseded",
  ready: (p) => p.status === "ready" || p.status === "generating",
  other: (p) => p.status === "failed" || p.status === "superseded",
};

export default function PostsPage() {
  const { workspace } = useWorkspace();
  const { posts, loading } = usePosts(workspace?.id, 200);
  const [filter, setFilter] = useState<Filter>("all");
  const shown = posts.filter(MATCH[filter]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Posts"
        description="Every post Cadence has generated, newest first."
        action={
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "ready", label: "Ready" },
              { value: "other", label: "Replaced & failed" },
            ]}
          />
        }
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton aspect-[4/6] rounded-2xl" />
          ))}
        </div>
      ) : shown.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => <PostCard key={p.id} post={p} workspace={workspace!} />)}
        </div>
      ) : (
        <Card className="px-6 py-16 text-center text-sm text-ink-mute">Nothing here yet.</Card>
      )}
    </div>
  );
}
