// npm run publish
// 1. Copies images the posts embed (![[image.png]]) from the Obsidian vault into
//    src/posts/images, since pasted images land in the vault's Attachments folder.
// 2. Builds the blog, so a broken post fails here instead of on Cloudflare.
// 3. Commits the posts folder and pushes; Cloudflare Pages rebuilds from the push.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BLOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(BLOG_DIR, "src", "posts");
const IMAGES_DIR = path.join(POSTS_DIR, "images");
const VAULT_DIR = process.env.BLOG_VAULT || path.join(os.homedir(), "Documents", "The SleepyBase");
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: BLOG_DIR, encoding: "utf8", stdio: opts.stdio || "pipe", shell: process.platform === "win32" && cmd === "npx" });
const git = (...args) => run("git", args);
const fail = (msg) => { console.error("\n✗ " + msg); process.exit(1); };

// Posts: every .md in the folder except notes starting with "_" (the guide, etc.).
const posts = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
const isDraft = (text) => /^---[\s\S]*?^draft:\s*true\s*$[\s\S]*?^---/m.test(text);

// ---- 1. Images ----
// Index the vault once by file name (skipping Obsidian config and this blog's own folder).
function indexVault(dir, found = new Map()) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink() || full === path.join(VAULT_DIR, "Personal", "Blog")) continue;
    if (entry.isDirectory()) indexVault(full, found);
    else if (IMAGE_EXT.test(entry.name) && !found.has(entry.name)) found.set(entry.name, full);
  }
  return found;
}

// name -> true if any published (non-draft) post needs it
const wanted = new Map();
for (const file of posts) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  // Embeds shown as examples in code blocks or `inline code` aren't real embeds.
  const text = raw.replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]+`/g, "");
  for (const m of text.matchAll(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/g)) {
    const name = m[1].split("/").pop().trim();
    if (IMAGE_EXT.test(name)) wanted.set(name, wanted.get(name) || !isDraft(raw));
  }
}

fs.mkdirSync(IMAGES_DIR, { recursive: true });
const missing = [...wanted.keys()].filter((name) => !fs.existsSync(path.join(IMAGES_DIR, name)));
if (missing.length) {
  if (!fs.existsSync(VAULT_DIR)) fail(`Vault not found at ${VAULT_DIR} (set BLOG_VAULT to its path).`);
  const vault = indexVault(VAULT_DIR);
  const notFound = [];
  for (const name of missing) {
    const src = vault.get(name);
    if (src) {
      fs.copyFileSync(src, path.join(IMAGES_DIR, name));
      console.log(`  copied image  ${name}  (from ${path.relative(VAULT_DIR, src)})`);
    } else notFound.push(name);
  }
  const blocking = notFound.filter((name) => wanted.get(name));
  const draftOnly = notFound.filter((name) => !wanted.get(name));
  if (draftOnly.length) console.log(`  ! Images only drafts use, not found in the vault (not blocking): ${draftOnly.join(", ")}`);
  if (blocking.length) fail(`These embedded images weren't found anywhere in the vault:\n  ${blocking.join("\n  ")}`);
}

// ---- 2. Build ----
console.log("Building…");
try {
  run("npx", ["@11ty/eleventy", "--quiet"]);
} catch (err) {
  fail("The blog failed to build, so nothing was published.\n" + (err.stderr || err.stdout || err.message));
}

// ---- 3. Commit + push ----
if (process.argv.includes("--dry-run")) {
  const pending = git("status", "--porcelain", "--untracked-files=all", "--", "src/posts").trim();
  console.log(pending ? `Dry run: would publish these changes:\n${pending}` : "Dry run: nothing new to publish.");
  process.exit(0);
}
git("add", "--", "src/posts");
const changed = git("diff", "--cached", "--name-status", "--", "src/posts").trim();
if (!changed) {
  console.log("✓ Nothing new to publish. Posts on GitHub already match this folder.");
  process.exit(0);
}

const names = changed.split("\n").map((line) => path.basename(line.split("\t").pop()));
const titles = names.filter((n) => n.endsWith(".md")).map((n) => n.replace(/\.md$/, ""));
const message = titles.length ? `Publish blog: ${titles.join(", ")}` : "Publish blog: update images";
git("commit", "-m", message, "--", "src/posts");
console.log(`Committed: ${message}`);

console.log("Pushing…");
try {
  run("git", ["push"], { stdio: "inherit" });
} catch {
  fail("Push failed (see above). The commit is saved locally; run `git push` once it's sorted.");
}

const drafts = posts.filter((f) => isDraft(fs.readFileSync(path.join(POSTS_DIR, f), "utf8")));
console.log("\n✓ Published. Cloudflare Pages will rebuild; the blog updates in a minute or two.");
if (drafts.length) console.log(`  Still drafts (not on the live site): ${drafts.map((d) => d.replace(/\.md$/, "")).join(", ")}`);
