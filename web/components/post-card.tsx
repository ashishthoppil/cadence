"use client";

import { Images, Sparkles } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/post-bits";
import { brandFromWorkspace, SlidePreview } from "@/components/slide-preview";
import { postImages } from "@/lib/posts";
import type { Post, Workspace } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function PostThumb({ post, workspace, className }: { post: Post; workspace: Workspace; className?: string }) {
  const images = postImages(post);
  if (images[0]) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={images[0]} alt={post.title ?? ""} className={cn("aspect-[4/5] w-full object-cover", className)} />;
  }
  if (post.slides?.[0]) {
    return (
      <SlidePreview
        slide={post.slides[0]}
        total={post.slides.length}
        brand={brandFromWorkspace(workspace)}
        className={className}
      />
    );
  }
  return (
    <div className={cn("grid aspect-[4/5] w-full place-items-center bg-white/[0.02]", className)}>
      {post.status === "generating" ? (
        <div className="flex flex-col items-center gap-2 text-xs text-ink-mute">
          <Sparkles className="size-5 animate-pulse text-brand-soft" />
          Writing…
        </div>
      ) : (
        <Images className="size-6 text-ink-mute" />
      )}
    </div>
  );
}

export function PostCard({ post, workspace }: { post: Post; workspace: Workspace }) {
  return (
    <Link
      href={`/dashboard/posts/${post.id}`}
      className="group overflow-hidden rounded-2xl border border-line bg-panel/60 transition hover:-translate-y-0.5 hover:border-line-strong"
    >
      <div className="relative overflow-hidden border-b border-line">
        <PostThumb post={post} workspace={workspace} className="transition duration-500 group-hover:scale-[1.02]" />
        {post.format === "carousel" && post.image_paths.length > 1 && (
          <span className="absolute top-2.5 right-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            1/{post.image_paths.length}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-ink-mute">
            {formatDate(post.post_date)} · {post.theme ?? "Post"}
          </span>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-snug font-medium">{post.title ?? "Generating…"}</p>
        <StatusBadge status={post.status} />
      </div>
    </Link>
  );
}
