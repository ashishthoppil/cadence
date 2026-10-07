import type { Metadata } from "next";
import { Suspense } from "react";
import { PostDetail } from "./post-detail";

export const metadata: Metadata = { title: "Post" };

export default function PostPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[600px] rounded-2xl" />}>
      <PostDetail />
    </Suspense>
  );
}
