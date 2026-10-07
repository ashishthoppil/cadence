"use client";

import { useEffect, useState } from "react";
import { invoke, mediaUrl, supabase } from "./supabase/client";
import type { Post, ReviewView } from "./types";

/** Posts for the signed-in workspace, kept live with Supabase Realtime. */
export function usePosts(workspaceId: string | undefined, limit = 60) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    const load = () =>
      supabase()
        .from("posts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("post_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit)
        .then(({ data }) => {
          if (!active) return;
          setPosts((data ?? []) as Post[]);
          setLoading(false);
        });
    load();
    const channel = supabase()
      .channel(`posts-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `workspace_id=eq.${workspaceId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase().removeChannel(channel);
    };
  }, [workspaceId, limit]);

  return { posts, loading };
}

export function usePost(id: string | undefined) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = () =>
      supabase()
        .from("posts")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (!active) return;
          setPost(data as Post | null);
          setLoading(false);
        });
    load();
    // Realtime UPDATE payloads can omit large unchanged columns (slides, captions), so treat
    // them only as a signal and re-read the full row.
    const channel = supabase()
      .channel(`post-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${id}` }, () =>
        load())
      .subscribe();
    return () => {
      active = false;
      supabase().removeChannel(channel);
    };
  }, [id]);

  // Realtime normally drives updates; poll as a fallback while the post is being made.
  const inFlight = post?.status === "generating";
  useEffect(() => {
    if (!id || !inFlight) return;
    const timer = setInterval(() => {
      supabase()
        .from("posts")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => data && setPost(data as Post));
    }, 4000);
    return () => clearInterval(timer);
  }, [id, inFlight]);

  return { post, loading, setPost };
}

export const postImages = (post: Pick<Post, "image_paths">) => post.image_paths.map(mediaUrl);

export type ReviewAction = "get" | "regenerate" | "resend";

export function reviewPost(postId: string, action: ReviewAction, extra: Record<string, unknown> = {}) {
  return invoke<ReviewView>("review", { post_id: postId, action, ...extra });
}

export function generateNow(feedback?: string) {
  return invoke<{ post_id: string }>("generate", { feedback });
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "post";
}

/** Forced-download links (same file names as the email attachments). */
export function postDownloads(post: Pick<Post, "image_paths" | "pdf_path" | "post_date">, brandName: string) {
  const base = `${slug(brandName)}-${post.post_date}`;
  const link = (path: string, name: string) => ({ name, url: `${mediaUrl(path)}?download=${encodeURIComponent(name)}` });
  const many = post.image_paths.length > 1;
  return {
    slides: post.image_paths.map((p, i) => link(p, many ? `${base}-slide-${String(i + 1).padStart(2, "0")}.jpg` : `${base}.jpg`)),
    pdf: post.pdf_path ? link(post.pdf_path, `${base}-linkedin-carousel.pdf`) : null,
  };
}
