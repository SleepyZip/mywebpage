// 11ty config for the trevordemelo.com blog.
// Posts are written in Obsidian (the vault's Personal/Blog folder is linked to
// src/posts), so this translates Obsidian-flavoured Markdown on the way in.
// Built on Cloudflare Pages and served at trevordemelo.com/blog by the Worker.
// The Worker serves this build under /blog, but Pages hosts it at its own root, so
// 11ty keeps the default path prefix and blog-internal links add BASE explicitly.
// (Links to the main site, like /projects and /assets/site.css, must stay as-is.)
const BASE = "/blog";
const PATH_PREFIX = BASE + "/";
const SITE_URL = "https://trevordemelo.com";

// "My First Post" -> "my-first-post" (matches 11ty's default page slugs).
const slugify = (s) => s.toLowerCase().trim()
  .replace(/['’]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Apply fn only to prose, leaving fenced code blocks and inline code untouched.
const outsideCode = (text, fn) =>
  text.split(/(^```[\s\S]*?^```|`[^`\n]+`)/m).map((part, i) => (i % 2 ? part : fn(part))).join("");

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

function obsidianToMarkdown(content) {
  return outsideCode(content, (text) => text
    // %% Obsidian comments %% are private notes; never publish them.
    .replace(/%%[\s\S]*?%%/g, "")
    // ![[image.png]] or ![[image.png|300]] -> image from src/posts/images
    .replace(/!\[\[([^\]|]+?)(?:\|(\d+)(?:x\d+)?)?\]\]/g, (m, file, width) => {
      const name = file.split("/").pop().trim();
      if (!IMAGE_EXT.test(name)) return m;
      const src = PATH_PREFIX + "images/" + encodeURI(name);
      return width
        ? `<img src="${src}" alt="" width="${width}" loading="lazy">`
        : `![](${src})`;
    })
    // [[Other Post]] / [[Other Post|label]] / [[Other Post#Heading]] -> post link
    .replace(/(?<!!)\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g, (m, target, heading, label) => {
      const href = PATH_PREFIX + "posts/" + slugify(target.split("/").pop()) + "/" + (heading ? "#" + slugify(heading) : "");
      return `[${label || target.split("/").pop()}](${href})`;
    })
    // ==highlight== -> <mark>
    .replace(/==([^=\n]+)==/g, "<mark>$1</mark>"));
}

// Obsidian callouts: > [!note] Optional title  ->  <aside class="callout callout-note">
function calloutPlugin(md) {
  md.core.ruler.after("block", "obsidian-callouts", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") continue;
      const inline = tokens[i + 2];
      if (!inline || inline.type !== "inline") continue;
      const m = inline.content.match(/^\[!(\w+)\][+-]?[ \t]*([^\n]*)\n?/);
      if (!m) continue;
      const type = m[1].toLowerCase();
      const title = m[2] || type.charAt(0).toUpperCase() + type.slice(1);
      // Inline parsing runs after this rule, so trimming the content is enough.
      inline.content = inline.content.slice(m[0].length);
      tokens[i].type = "callout_open";
      tokens[i].meta = { type, title };
      let depth = 0;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === "blockquote_open") depth++;
        if (tokens[j].type === "blockquote_close") {
          if (depth === 0) { tokens[j].type = "callout_close"; break; }
          depth--;
        }
      }
      // A title-only callout leaves an empty first paragraph; drop it.
      if (!inline.content.trim()) tokens[i + 1].hidden = tokens[i + 3].hidden = true;
    }
  });
  md.renderer.rules.callout_open = (tokens, idx) => {
    const { type, title } = tokens[idx].meta;
    return `<aside class="callout callout-${escapeHtml(type)}"><p class="callout-title">${escapeHtml(title)}</p>\n`;
  };
  md.renderer.rules.callout_close = () => "</aside>\n";
}

export { slugify };

export default function (eleventyConfig) {
  eleventyConfig.addGlobalData("base", BASE);
  eleventyConfig.addGlobalData("siteUrl", SITE_URL);

  // Local preview only: the real site's pages and shared /assets come from the
  // Worker source (../worker.js), so `npm start` shows the blog inside the site.
  eleventyConfig.setServerOptions({
    middleware: [
      async (req, res, next) => {
        // /blog/* is this build (mirroring the Worker's proxy, which strips /blog).
        if (req.url === BASE || req.url.startsWith(PATH_PREFIX)) {
          req.url = req.url.slice(BASE.length) || "/";
          return next();
        }
        try {
          const worker = (await import("../worker.js?t=" + Date.now())).default;
          const r = await worker.fetch(new Request("http://localhost" + req.url), {}, {});
          // Never cache in preview, so style edits to worker.js show on reload.
          res.writeHead(r.status, { ...Object.fromEntries(r.headers), "cache-control": "no-store" });
          res.end(Buffer.from(await r.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      },
    ],
  });

  // Obsidian syntax is converted before Markdown rendering.
  eleventyConfig.addPreprocessor("obsidian", "md", (data, content) => obsidianToMarkdown(content));
  eleventyConfig.amendLibrary("md", (md) => md.use(calloutPlugin));

  // Drafts (draft: true) show in local previews but never in the published build.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build" && !process.env.BLOG_SHOW_DRAFTS) return false;
  });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md").sort((a, b) => b.date - a.date));

  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }));
  // Feed readers need absolute URLs: "/blog/x" -> "https://trevordemelo.com/blog/x".
  eleventyConfig.addFilter("absoluteLinks", (html) => String(html).replace(/(href|src)="\/(?!\/)/g, `$1="${SITE_URL}/`));
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("readingTime", (html) =>
    Math.max(1, Math.round(String(html).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 225)) + " min read");

  eleventyConfig.addPassthroughCopy({ "src/posts/images": "images" });
  // Notes starting with "_" (like the guide) stay in Obsidian and are never published.
  eleventyConfig.ignores.add("src/posts/_*.md");
  eleventyConfig.ignores.add("src/posts/.obsidian/**");

  return {
    dir: { input: "src", output: "_site", includes: "_includes" },
    markdownTemplateEngine: false, // posts are plain Markdown; {{ }} in a post stays literal
  };
}
