import { type NextRequest, NextResponse } from "next/server";

// Country of the visitor (from Vercel's edge headers), used to show prices in ₹ or $.
export function GET(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? null;
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
