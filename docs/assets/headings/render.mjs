// Usage: write `## Text` headings in README.md, add them to the list below, run `node docs/assets/headings/render.mjs`
import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const headings = [
  "Guardian AI", "What this is", "The problem", "How it works", "The Living Claim Ledger",
  "Features", "Responsible by design", "Product in pictures", "Orbit X1 scenario",
  "Tech stack", "Try it now", "Run it locally", "Setup", "Repository layout",
  "Scope and limitations", "Roadmap", "Team", "License",
];
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

for (const text of headings) {
  const big = text === "Guardian AI";
  const h = big ? 96 : 56;
  const size = big ? 60 : 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 ${h}" width="880" height="${h}" font-family="Segoe UI, Helvetica, Arial, sans-serif">
  <rect width="880" height="${h}" rx="12" fill="#0d0d0d"/>
  <rect width="10" height="${h}" rx="5" fill="#dc143c"/>
  <text x="32" y="${h / 2 + size / 3}" fill="#ffffff" font-size="${size}" font-weight="800">${esc(text)}</text>
  <rect x="${big ? 32 : 32}" y="${h - 8}" width="${big ? 140 : 60}" height="4" rx="2" fill="#dc143c"/>
</svg>`;
  writeFileSync(`${dir}/${slug(text)}.svg`, svg);
}
console.log(`Rendered ${headings.length} headings`);
