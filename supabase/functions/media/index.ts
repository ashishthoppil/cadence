// Describes an uploaded photo so the writer can match photos to slides.
import { admin, workspaceFromRequest } from "../_shared/db.ts";
import { HttpError, json, serve } from "../_shared/http.ts";
import { describeImage } from "../_shared/openai.ts";

serve(async (req) => {
  const w = await workspaceFromRequest(req);
  const { asset_id } = await req.json().catch(() => ({}));
  const { data: asset } = await admin()
    .from("media_assets")
    .select("id, url, description")
    .eq("id", String(asset_id ?? ""))
    .eq("workspace_id", w.id)
    .maybeSingle();
  if (!asset) throw new HttpError(404, "Photo not found");
  const description = await describeImage(asset.url);
  await admin().from("media_assets").update({ description }).eq("id", asset.id);
  return json({ description });
});
