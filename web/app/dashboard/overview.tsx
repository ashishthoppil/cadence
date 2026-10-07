"use client";

import { ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { nextRun } from "@/components/forms/schedule-form";
import { StatusBadge } from "@/components/post-bits";
import { PostCard, PostThumb } from "@/components/post-card";
import { useWorkspace } from "@/components/workspace-provider";
import { Button, ButtonLink, Card } from "@/components/ui";
import { generateNow, usePosts } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { cn, formatClock, formatDate, WEEKDAYS, zonedNow } from "@/lib/utils";

function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Overview() {
  const router = useRouter();
  const params = useSearchParams();
  const { workspace, slots } = useWorkspace();
  const { posts, loading } = usePosts(workspace?.id);
  const [generating, setGenerating] = useState(false);
  const now = useNow();

  useEffect(() => {
    if (params.get("welcome")) {
      toast.success("You're all set! Your first post arrives at the next scheduled time.", { id: "welcome" });
      router.replace("/dashboard");
    }
  }, [params, router]);

  const tz = workspace!.timezone;
  const today = zonedNow(tz, new Date(now));
  const at = workspace!.generate_at.slice(0, 5);
  const upcoming = nextRun(tz, at, slots);

  // Active (non-replaced) post per date
  const byDate = useMemo(() => {
    const map = new Map<string, Post>();
    for (const p of posts) if (p.status !== "superseded" && !map.has(p.post_date)) map.set(p.post_date, p);
    return map;
  }, [posts]);

  const todayPost = byDate.get(today.date);
  const monday = addDays(today.date, 1 - today.weekday);
  const week = Array.from({ length: 7 }, (_, i) => ({ date: addDays(monday, i), slot: slots[i] }));
  const readyThisWeek = posts.filter((p) => p.status === "ready" && p.post_date >= monday).length;
  const plannedPerWeek = slots.filter((s) => s.format !== "none").length;

  async function generate() {
    setGenerating(true);
    try {
      const { post_id } = await generateNow();
      toast.success("Generating a fresh post — it'll land in your inbox in about a minute.");
      router.push(`/dashboard/posts/${post_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start generation");
      setGenerating(false);
    }
  }

  const countdown = upcoming && !workspace!.paused
    ? (() => {
      const mins = upcoming.minutesUntil;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h ? `${h}h ${m}m` : `${m}m`;
    })()
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-mute">
            {formatDate(today.date, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{workspace!.brand_name} autopilot</h1>
        </div>
        <Button onClick={generate} loading={generating}>
          <Wand2 className="size-4" /> Generate a post now
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Today */}
        <Card className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row">
            {todayPost ? (
              <>
                <Link
                  href={`/dashboard/posts/${todayPost.id}`}
                  className="w-full shrink-0 overflow-hidden rounded-xl border border-white/10 sm:w-44"
                >
                  <PostThumb post={todayPost} workspace={workspace!} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-brand-soft uppercase">Today</span>
                    <StatusBadge status={todayPost.status} />
                  </div>
                  <h2 className="mt-3 text-xl leading-snug font-semibold">{todayPost.title ?? "Writing today's post…"}</h2>
                  <p className="mt-1.5 text-sm text-ink-mute">
                    {todayPost.theme} · {todayPost.format === "carousel" ? "Carousel" : "Single image"}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <ButtonLink href={`/dashboard/posts/${todayPost.id}`} size="sm">
                      {todayPost.status === "ready" ? "Download & copy captions" : "Open post"}
                      <ArrowRight className="size-3.5" />
                    </ButtonLink>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-semibold tracking-wider text-brand-soft uppercase">Next post</span>
                {workspace!.paused ? (
                  <p className="mt-3 text-xl font-semibold">Schedule paused</p>
                ) : upcoming ? (
                  <>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{countdown}</p>
                    <p className="mt-1 text-sm text-ink-mute">{upcoming.label}</p>
                    <div className="mt-5 rounded-xl border border-line bg-white/[0.02] p-4">
                      <p className="text-sm font-medium">{upcoming.slot.theme || "Untitled pillar"}</p>
                      <p className="mt-0.5 text-sm text-ink-mute">{upcoming.slot.brief || "No brief"}</p>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-ink-soft">No days are planned. Add some to your calendar.</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Card className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{readyThisWeek}</p>
              <p className="text-xs text-ink-mute">Posts ready this week</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-sky-500/10">
              <CalendarDays className="size-5 text-sky-300" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{plannedPerWeek}</p>
              <p className="text-xs text-ink-mute">Posts planned per week</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-brand/15">
              <CalendarClock className="size-5 text-brand-soft" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatClock(at)}</p>
              <p className="text-xs text-ink-mute">Daily · {tz.replace(/_/g, " ")}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* This week */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">This week</h2>
          <Link href="/dashboard/calendar" className="text-sm text-ink-mute hover:text-ink">
            Edit calendar
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-7 md:px-0">
          {week.map(({ date, slot }, i) => {
            const post = byDate.get(date);
            const isToday = date === today.date;
            const rest = slot?.format === "none";
            return (
              <Link
                key={date}
                href={post ? `/dashboard/posts/${post.id}` : "/dashboard/calendar"}
                className={cn(
                  "flex w-36 shrink-0 flex-col rounded-2xl border p-3.5 transition md:w-auto",
                  isToday ? "border-brand/50 bg-brand/[0.07]" : "border-line bg-panel/60 hover:border-line-strong",
                  rest && !post && "border-dashed opacity-60",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold">{WEEKDAYS[i].slice(0, 3)}</span>
                  <span className="text-[11px] text-ink-mute">{Number(date.slice(8))}</span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-snug text-ink-soft">
                  {rest ? "Rest day" : slot?.theme || "—"}
                </p>
                <div className="mt-3">
                  {post ? (
                    <StatusBadge status={post.status} className="text-[10px]" />
                  ) : (
                    <span className="text-[11px] text-ink-mute">
                      {rest ? "" : date < today.date ? "Not generated" : slot?.format === "image" ? "Image" : "Carousel"}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent posts</h2>
          <Link href="/dashboard/posts" className="text-sm text-ink-mute hover:text-ink">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton aspect-[4/6] rounded-2xl" />
            ))}
          </div>
        ) : posts.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {posts
              .filter((p) => p.status !== "superseded")
              .slice(0, 8)
              .map((p) => <PostCard key={p.id} post={p} workspace={workspace!} />)}
          </div>
        ) : (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-brand/15">
              <Sparkles className="size-5 text-brand-soft" />
            </div>
            <p className="mt-4 font-semibold">No posts yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink-mute">
              Your first post will be generated {upcoming ? upcoming.label.toLowerCase() : "soon"}. Can&apos;t wait?
            </p>
            <Button className="mt-5" onClick={generate} loading={generating}>
              <Wand2 className="size-4" /> Generate one now
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}
