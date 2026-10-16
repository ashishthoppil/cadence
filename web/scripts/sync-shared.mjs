// Copies code shared with the Supabase Edge Functions into the web app.
// Run from web/: `npm run sync:shared`. A missing source (e.g. web/ deployed alone) is not an error.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILES = ["slide-templates.ts", "plans.ts"];

for (const file of FILES) {
  const source = new URL(`../../supabase/functions/_shared/${file}`, import.meta.url);
  const target = new URL(`../lib/${file}`, import.meta.url);
  if (!existsSync(source)) {
    console.log(`sync:shared — ${file} not found, keeping the committed copy`);
    continue;
  }
  const banner = `// GENERATED from supabase/functions/_shared/${file} — edit that file, then run \`npm run sync:shared\`.\n`;
  writeFileSync(target, banner + readFileSync(source, "utf8").replace(/^\s*\/\/ deno-lint-ignore.*\n/gm, ""));
  console.log(`sync:shared — ${file} copied`);
}
