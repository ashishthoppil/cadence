// Renders one slide to JPEG and stores it. Generation fans out one call per slide so each
// render gets its own CPU budget (Edge Functions cap CPU time per request).
import { admin, MEDIA_BUCKET } from "../_shared/db.ts";
import { assertInternal, HttpError, json, serve } from "../_shared/http.ts";
import { inlineLogo, renderSlideJpeg } from "../_shared/render.ts";

serve(async (req) => {
  assertInternal(req);
  const { slide, index, total, brand, path } = await req.json();
  if (!slide || typeof path !== "string") throw new HttpError(400, "slide and path are required");

  const jpg = await renderSlideJpeg(slide, index ?? 0, total ?? 1, await inlineLogo(brand));
  const { error } = await admin().storage.from(MEDIA_BUCKET).upload(path, jpg, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return json({ path, bytes: jpg.length });
});
