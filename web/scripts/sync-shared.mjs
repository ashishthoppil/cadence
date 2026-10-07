// Copies the slide templates shared with the Supabase renderer into the web app.
// Run from web/: `npm run sync:shared`. A missing source (e.g. web/ deployed alone) is not an error.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const source = new URL("../../supabase/functions/_shared/slide-templates.ts", import.meta.url);
const target = new URL("../lib/slide-templates.ts", import.meta.url);

if (!existsSync(source)) {
  console.log("sync:shared — source not found, keeping the committed copy");
  process.exit(0);
}
copyFileSync(source, target);
const banner = "// GENERATED from supabase/functions/_shared/slide-templates.ts — edit that file, then run `npm run sync:shared`.\n";
writeFileSync(target, banner + readFileSync(target, "utf8").replace(/^\s*\/\/ deno-lint-ignore.*\n/gm, ""));
console.log("sync:shared — slide templates copied");
