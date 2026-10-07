"use client";

import { ArrowLeft, Check, MailPlus, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SlideStrip, StatusBadge } from "@/components/post-bits";
import { CaptionPanel, DownloadList } from "@/components/post-content";
import { brandFromWorkspace, SlidePreview } from "@/components/slide-preview";
import { useWorkspace } from "@/components/workspace-provider";
import { Button, ButtonLink, Card, Textarea } from "@/components/ui";
import { postDownloads, postImages, type ReviewAction, reviewPost, usePost } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";

function GeneratingPanel({ post }: { post: Post }) {
  const steps = [
    { label: "Writing the copy", done: !!post.title },
    { label: "Designing the slides", done: post.image_paths.length > 0 },
    { label: "Emailing it to you", done: false },
  ];
  const brand = brandFromWorkspace(useWorkspace().workspace ?? {});
  return (
    <Card className="grid gap-8 p-6 md:grid-cols-[280px_1fr] md:p-8">
      <div className="overflow-hidden rounded-xl border border-white/10">
        {post.slides?.[0] ? (
          <SlidePreview slide={post.slides[0]} total={post.slides.length} brand={brand} />
        ) : (
          <div className="skeleton aspect-[4/5]" />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <Sparkles className="size-6 animate-pulse text-brand-soft" />
        <h2 className="mt-4 text-xl font-semibold">Creating {post.theme ?? "your post"}…</h2>
        <p className="mt-1 text-sm text-ink-mute">This usually takes under a minute. You can leave this page.</p>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => {
            const active = !s.done && (i === 0 || steps[i - 1].done);
            return (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid size-6 place-items-center rounded-full border ${
                    s.done
                      ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                      : active
                      ? "border-brand/50 text-brand-soft"
                      : "border-line text-ink-mute"
                  }`}
                >
                  {s.done ? <Check className="size-3.5" /> : active ? <span className="size-1.5 animate-ping rounded-full bg-current" /> : i + 1}
                </span>
                <span className={s.done ? "text-ink-soft" : active ? "text-ink" : "text-ink-mute"}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { post, loading } = usePost(id);
  const [busy, setBusy] = useState<ReviewAction | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (loading) return <div className="skeleton h-[600px] rounded-2xl" />;
  if (!post) {
    return (
      <Card className="p-10 text-center">
        <p className="font-semibold">Post not found</p>
        <ButtonLink href="/dashboard/posts" variant="secondary" size="sm" className="mt-4">
          Back to posts
        </ButtonLink>
      </Card>
    );
  }

  const images = postImages(post);
  const downloads = postDownloads(post, workspace?.brand_name ?? "post");
  const canRegenerate = post.status === "ready" || post.status === "failed";

  async function act(action: ReviewAction, extra: Record<string, unknown> = {}, success?: string) {
    setBusy(action);
    try {
      const view = await reviewPost(post!.id, action, extra);
      if (success) toast.success(success);
      return view;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/posts" className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink">
        <ArrowLeft className="size-4" /> Posts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-mute">
            {post.theme && (
              <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand-soft">
                {post.theme}
              </span>
            )}
            {formatDate(post.post_date, { weekday: "long", day: "numeric", month: "long" })}
            <span>·</span>
            {post.format === "carousel" ? `${post.slides?.length || "…"} slides` : "Single image"}
          </div>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight md:text-3xl">
            {post.title ?? "Generating…"}
          </h1>
        </div>
        <StatusBadge status={post.status} className="mt-1" />
      </div>

      {post.status === "superseded" && post.replaced_by && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/[0.03] px-5 py-3 text-sm">
          A newer version of this post replaced it.
          <ButtonLink href={`/dashboard/posts/${post.replaced_by}`} size="sm" variant="secondary">
            Open new version
          </ButtonLink>
        </div>
      )}

      {post.error && post.status !== "generating" && (
        <div className="flex gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] px-5 py-4 text-sm text-rose-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">{post.error}</p>
        </div>
      )}

      {post.status === "generating" ? (
        <GeneratingPanel post={post} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <SlideStrip images={images} alt={post.alt_text} />
            <DownloadList slides={downloads.slides} pdf={downloads.pdf} />
          </div>

          <div className="space-y-5">
            <Card className="p-5">
              <CaptionPanel
                value={{
                  linkedin: { caption: post.linkedin_caption ?? "", hashtags: post.linkedin_hashtags ?? [] },
                  instagram: { caption: post.instagram_caption ?? "", hashtags: post.instagram_hashtags ?? [] },
                }}
              />
            </Card>

            {canRegenerate && (
              <Card className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setShowFeedback((v) => !v)}>
                    <RefreshCw className="size-4" /> Regenerate
                  </Button>
                  {post.status === "ready" && (
                    <Button
                      variant="ghost"
                      loading={busy === "resend"}
                      onClick={() => act("resend", {}, "Email sent again")}
                    >
                      <MailPlus className="size-4" /> Email it again
                    </Button>
                  )}
                </div>
                {showFeedback && (
                  <div className="space-y-3 rounded-xl border border-line bg-white/[0.02] p-4">
                    <Textarea
                      className="min-h-20"
                      placeholder="What should change? e.g. “Make the hook punchier and focus on graduates.” (optional)"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        loading={busy === "regenerate"}
                        onClick={async () => {
                          const view = await act("regenerate", { feedback }, "Regenerating — a new version is on its way.");
                          if (view?.replaced_by) router.push(`/dashboard/posts/${view.replaced_by}`);
                        }}
                      >
                        <Sparkles className="size-3.5" /> Create new version
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Created", relativeTime(post.created_at)],
                ["Emailed", post.emailed_at ? relativeTime(post.emailed_at) : "—"],
                ["Model", post.model ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-ink-mute">{k}</dt>
                  <dd className="mt-0.5 text-ink-soft">{v}</dd>
                </div>
              ))}
              {post.feedback && (
                <div className="col-span-2">
                  <dt className="text-xs text-ink-mute">Your feedback</dt>
                  <dd className="mt-0.5 text-ink-soft">“{post.feedback}”</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
