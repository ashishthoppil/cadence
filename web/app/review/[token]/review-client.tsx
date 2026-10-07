"use client";

import { Inbox, Link2Off, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { SlideStrip, StatusBadge } from "@/components/post-bits";
import { CaptionPanel, DownloadList } from "@/components/post-content";
import { Button, Card, Spinner, Textarea } from "@/components/ui";
import { invoke } from "@/lib/supabase/client";
import type { ReviewView } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function Centered({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-md py-16 text-center"
    >
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">{icon}</div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-2 text-sm leading-relaxed text-ink-mute">{children}</div>
    </motion.div>
  );
}

export function ReviewClient() {
  const { token } = useParams<{ token: string }>();
  const params = useSearchParams();
  const [view, setView] = useState<ReviewView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showRegenerate, setShowRegenerate] = useState(params.get("action") === "regenerate");
  const started = useRef(false);

  const call = useCallback(
    (action: string, extra: Record<string, unknown> = {}) => invoke<ReviewView>("review", { token, action, ...extra }),
    [token],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    call("get")
      .then(setView)
      .catch((err) => setError(err instanceof Error ? err.message : "This link isn't valid."));
  }, [call]);

  async function regenerate() {
    setBusy(true);
    try {
      setView(await call("regenerate", { feedback }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Centered icon={<Link2Off className="size-6 text-ink-mute" />} title="This link has expired">
        {error}
        <div className="mt-6">
          <Link href="/dashboard" className="text-brand-soft hover:text-white">
            Open your dashboard →
          </Link>
        </div>
      </Centered>
    );
  }

  if (!view) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (view.status === "superseded") {
    return (
      <Centered icon={<Inbox className="size-6 text-brand-soft" />} title="A fresh version is on its way">
        A new version of this post is being created{feedback ? " with your feedback" : ""}. It will land in your inbox in
        about a minute.
      </Centered>
    );
  }

  const canRegenerate = view.status === "ready" || view.status === "failed";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-mute">
            {view.theme && (
              <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand-soft">{view.theme}</span>
            )}
            {formatDate(view.post_date, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight md:text-3xl">{view.title}</h1>
        </div>
        <StatusBadge status={view.status} className="mt-1" />
      </div>

      {view.error && (
        <div className="flex gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] px-5 py-4 text-sm text-rose-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {view.error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          <SlideStrip images={view.images} alt={view.alt_text} />
          <DownloadList slides={view.downloads.slides} pdf={view.downloads.pdf} />
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <CaptionPanel
              value={{
                linkedin: { caption: view.linkedin.caption ?? "", hashtags: view.linkedin.hashtags ?? [] },
                instagram: { caption: view.instagram.caption ?? "", hashtags: view.instagram.hashtags ?? [] },
              }}
            />
          </Card>

          {canRegenerate && (
            <Card className="space-y-4 p-5">
              {showRegenerate ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Not quite right? Make a new version.</p>
                  <Textarea
                    autoFocus
                    className="min-h-20"
                    placeholder="What should change? e.g. “Shorter hook, more practical examples.” (optional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowRegenerate(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" loading={busy} onClick={regenerate}>
                      <Sparkles className="size-3.5" /> Create a new version
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setShowRegenerate(true)}>
                  <RefreshCw className="size-4" /> Regenerate
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="size-6" />
      <span className="font-semibold tracking-tight">Cadence</span>
      <span className="text-ink-mute">/ Today&apos;s post</span>
    </div>
  );
}
