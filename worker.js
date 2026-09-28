export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Admin portal lives on the tailnet; /admin forwards tailnet devices there.
    const ADMIN_TARGET = "https://zebra.tail4b53d8.ts.net";

    // Cloudflare Pages project that hosts the 11ty blog (proxied at /blog).
    const BLOG_ORIGIN = "https://trevordemelo-blog.pages.dev";

    // Pixel duck (original art, Solarized cyan): favicon, served at /assets/duck.svg.
    const DUCK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 20" shape-rendering="crispEdges"><path fill="#2aa198" d="M6 1h2v1h-2zM7 2h1v1h-1zM3 4h2v1h-2zM7 4h4v1h-4zM2 5h2v1h-2zM5 5h7v1h-7zM1 6h12v1h-12zM1 7h2v1h-2zM5 7h4v1h-4zM11 7h2v1h-2zM1 8h2v1h-2zM5 8h4v1h-4zM11 8h2v1h-2zM3 9h1v1h-1zM10 9h1v1h-1zM1 10h3v1h-3zM10 10h3v1h-3zM2 11h3v1h-3zM9 11h3v1h-3zM4 12h6v1h-6zM2 13h1v1h-1zM4 13h6v1h-6zM11 13h1v1h-1zM1 14h2v1h-2zM4 14h2v1h-2zM8 14h2v1h-2zM11 14h2v1h-2zM3 15h8v1h-8zM4 16h6v1h-6z"/><path fill="#7fd6cc" d="M5 4h2v1h-2zM4 5h1v1h-1zM6 14h2v1h-2z"/><path fill="#1d7a73" d="M3 16h1v1h-1zM10 16h1v1h-1z"/><path fill="#f0a830" d="M4 9h6v1h-6zM3 18h3v1h-3zM8 18h3v1h-3z"/><path fill="#d9822b" d="M5 10h4v1h-4z"/><path fill="#f49ac1" d="M1 9h2v1h-2zM11 9h2v1h-2z"/><path fill="#ffffff" d="M3 7h1v1h-1zM9 7h1v1h-1z"/><path fill="#001f27" d="M6 0h2v1h-2zM5 1h1v1h-1zM8 1h1v1h-1zM6 2h1v1h-1zM8 2h1v1h-1zM3 3h8v1h-8zM2 4h1v1h-1zM11 4h1v1h-1zM1 5h1v1h-1zM12 5h1v1h-1zM0 6h1v1h-1zM13 6h1v1h-1zM0 7h1v1h-1zM4 7h1v1h-1zM10 7h1v1h-1zM13 7h1v1h-1zM0 8h1v1h-1zM3 8h2v1h-2zM9 8h2v1h-2zM13 8h1v1h-1zM0 9h1v1h-1zM13 9h1v1h-1zM0 10h1v1h-1zM4 10h1v1h-1zM9 10h1v1h-1zM13 10h1v1h-1zM1 11h1v1h-1zM5 11h4v1h-4zM12 11h1v1h-1zM2 12h2v1h-2zM10 12h2v1h-2zM1 13h1v1h-1zM3 13h1v1h-1zM10 13h1v1h-1zM12 13h1v1h-1zM0 14h1v1h-1zM3 14h1v1h-1zM10 14h1v1h-1zM13 14h1v1h-1zM1 15h2v1h-2zM11 15h2v1h-2zM2 16h1v1h-1zM11 16h1v1h-1zM3 17h8v1h-8zM2 18h1v1h-1zM6 18h2v1h-2zM11 18h1v1h-1zM2 19h5v1h-5zM8 19h4v1h-4z"/></svg>';

    // Solarized palette (ethanschoonover.com/solarized): dark by default,
    // light when the visitor's system prefers it. Accents are identical in both.
    const css = `
      :root {
        --base03: #002b36; --base02: #073642; --base01: #586e75; --base00: #657b83;
        --base0: #839496;  --base1: #93a1a1;  --base2: #eee8d5;  --base3: #fdf6e3;
        --yellow: #b58900; --orange: #cb4b16; --red: #dc322f; --magenta: #d33682;
        --violet: #6c71c4; --blue: #268bd2; --cyan: #2aa198; --green: #859900;

        /* Dark (default) */
        --bg: #00212b; --panel: var(--base03); --bg-alt: var(--base02);
        --text: var(--base0); --text-emph: var(--base1); --muted: var(--base01);
        --border: var(--base01); --rule: var(--base02);
        --shadow: rgba(38, 139, 210, 0.22);
        --accent: var(--blue); --accent-2: var(--cyan);
        color-scheme: dark;
      }
      /* Light theme: opt-in via the nav toggle (dark stays the default). */
      :root[data-theme="light"] {
        --bg: var(--base2); --panel: var(--base3); --bg-alt: var(--base2);
        --text: var(--base00); --text-emph: var(--base02); --muted: var(--base1);
        --border: var(--base1); --rule: var(--base2);
        --shadow: rgba(38, 139, 210, 0.18);
        color-scheme: light;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace; font-size: 15px; background: var(--bg); color: var(--text); padding: 3rem 1rem; display: flex; justify-content: center; }

      /* The panel: bordered card with the offset shadow block behind it */
      .container { background: var(--panel); border: 2px solid var(--border); padding: 1.5rem 2.25rem 2.25rem; width: 100%; max-width: 820px; box-shadow: 10px 10px 0 var(--shadow); }
      a { color: var(--accent); }
      code { color: var(--accent-2); background: var(--bg-alt); padding: 1px 5px; }

      nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; border-bottom: 2px solid var(--rule); padding-bottom: 26px; padding-right: 3rem; }
      nav a { color: var(--text-emph); text-decoration: none; margin-right: 0.5rem; padding: 3px 8px; font-weight: bold; letter-spacing: 0.05em; font-size: 0.9rem; }
      nav > div:first-child a:first-child { margin-left: -8px; }
      nav a:hover { background: var(--accent); color: var(--panel); }
      /* Icon buttons (theme toggle on top, Admin Portal below) stacked in the panel's
         top-right corner, the same 12px in from the top and right edges. They sit
         outside the nav's flow; the nav's bottom padding puts the divider 12px below the
         stack, and the links sit level with the middle of the stack. */
      .nav-right { position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
      /* Square icon buttons at the right end of the nav (Admin Portal, theme toggle).
         20px squares, stacked in .nav-right. */
      nav a { line-height: 18px; }
      nav a.nav-icon-btn, .nav-icon-btn { width: 20px; height: 20px; margin: 0; padding: 0; display: grid; place-items: center; background: var(--panel); border: 1px solid var(--border); box-shadow: 2px 2px 0 var(--shadow); cursor: pointer; }
      nav a.nav-icon-btn:hover, .nav-icon-btn:hover { background: var(--panel); border-color: var(--accent); }
      .nav-icon-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      .nav-icon-btn svg { width: 12px; height: 12px; display: block; }
      /* Admin Portal: a boxed [A] that slides open to read "Admin Portal" on hover/focus */
      nav a.portal-link { width: auto; min-width: 20px; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; font-size: 0.8rem; line-height: 1; }
      .portal-a { color: var(--accent); font-weight: bold; }
      .portal-rest { max-width: 0; overflow: hidden; white-space: nowrap; color: var(--text-emph); transition: max-width 0.25s ease; }
      nav a.portal-link:hover .portal-rest, nav a.portal-link:focus-visible .portal-rest { max-width: 8em; }
      @media (prefers-reduced-motion: reduce) { .portal-rest { transition: none; } }
      /* Theme toggle: shows the current theme (moon in dark mode, sun in light mode) */
      .nav-icon-btn.theme-toggle { width: auto; min-width: 20px; display: inline-flex; align-items: center; justify-content: center; padding: 0 3px; font: inherit; font-size: 0.8rem; font-weight: bold; line-height: 1; }
      /* Slides open on hover/focus to "Light/Dark", with the current theme highlighted */
      .theme-rest { display: inline-flex; align-items: center; max-width: 0; overflow: hidden; white-space: nowrap; transition: max-width 0.25s ease, margin 0.25s ease; }
      .theme-toggle:hover .theme-rest, .theme-toggle:focus-visible .theme-rest { max-width: 8em; margin-left: 6px; }
      .theme-word { color: var(--muted); padding: 1px 3px; transition: background 0.15s ease, color 0.15s ease; }
      .theme-sep { color: var(--muted); padding: 0 1px; }
      :root:not([data-theme="light"]) .theme-word-dark, :root[data-theme="light"] .theme-word-light { background: var(--accent); color: var(--panel); }
      @media (prefers-reduced-motion: reduce) { .theme-rest, .theme-word { transition: none; } }
      .theme-toggle .icon-sun { fill: var(--yellow); stroke: var(--yellow); stroke-width: 1.4; stroke-linecap: round; display: none; }
      .theme-toggle .icon-moon { fill: var(--violet); }
      :root[data-theme="light"] .theme-toggle .icon-sun { display: block; }
      :root[data-theme="light"] .theme-toggle .icon-moon { display: none; }

      h1 { font-size: 1.7rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-emph); }
      h2 { font-size: 1.5rem; color: var(--text-emph); margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; color: var(--text-emph); }
      p { margin-bottom: 1.5rem; line-height: 1.7; }

      /* HOME: bio + framed portrait */
      .intro-section { display: grid; grid-template-columns: 1fr 230px; gap: 2.5rem; align-items: start; }
      .bio-portrait-frame { border: 2px solid var(--border); background: var(--bg-alt); padding: 6px; box-shadow: 6px 6px 0 var(--shadow); }
      .portrait-container { overflow: hidden; display: flex; justify-content: center; align-items: center; }
      .portrait-container img { width: 100%; height: auto; display: block; }

      .section-divider { border: none; border-top: 2px dashed var(--rule); margin: 2.5rem 0; width: 100%; }
      .contact-section h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; color: var(--muted); }
      .contact-grid { border: 1px solid var(--border); background: var(--bg-alt); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
      .contact-item { display: flex; gap: 1rem; align-items: center; }
      .contact-item .label { color: var(--muted); font-weight: bold; width: 85px; display: inline-block; }

      /* Action links: highlight block on hover, like the nav */
      .contact-link, .back-link { color: var(--accent); text-decoration: none; font-weight: bold; padding: 2px 6px; display: inline-flex; align-items: center; gap: 6px; }
      .contact-link svg { fill: currentColor; display: block; }
      .contact-link:hover, .back-link:hover { background: var(--accent); color: var(--panel); }

      /* PROJECTS: cards lift onto their own shadow block on hover */
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
      .card { border: 2px solid var(--border); background: var(--panel); padding: 1rem; text-decoration: none; color: var(--text); display: block; transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease; }
      .card:hover { border-color: var(--accent); transform: translate(-3px, -3px); box-shadow: 6px 6px 0 var(--shadow); }
      .card h3 { color: var(--text-emph); }
      .card p { margin-bottom: 0; font-size: 0.9rem; color: var(--muted); }
      .card img { width: 100%; height: 120px; object-fit: cover; border: 1px solid var(--border); margin-bottom: 1rem; }
      .live-environment { width: 100%; height: 600px; border: 2px solid var(--border); background: #000; margin-bottom: 1.5rem; box-shadow: 6px 6px 0 var(--shadow); }
      iframe { width: 100%; height: 100%; border: none; }

      /* Project detail tables (inline borders use var(--border)) */
      table { font-size: 0.9rem; }
      thead tr { background: var(--bg-alt); color: var(--text-emph); }

      /* SKILL TAGS (project stack lists) */
      .skills-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .skill-tag { border: 1px solid var(--border); background: var(--bg-alt); padding: 3px 9px; font-size: 0.8rem; color: var(--accent-2); }

      @media (max-width: 680px) {
        body { padding: 1rem 0.75rem; }
        .container { padding: 1.5rem 1.25rem 1.25rem; box-shadow: 6px 6px 0 var(--shadow); }
        .intro-section { grid-template-columns: 1fr; gap: 1.5rem; }
        .bio-portrait-frame { max-width: 230px; margin: 0 auto; }
        .contact-item { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
        .live-environment { height: 420px; }
      }

      /* BLOG (11ty, served at /blog): post list, post body, Obsidian callouts */
      nav a[aria-current="page"] { color: var(--accent); }
      /* Blog index header: title left, RSS button right. The button matches the nav icon
         buttons and slides open to read "RSS Feed" on hover/focus. */
      .blog-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
      .blog-head h1 { margin-bottom: 0; }
      a.nav-icon-btn.rss-link { width: auto; min-width: 20px; display: inline-flex; align-items: center; justify-content: center; padding: 0 3px; font-size: 0.8rem; font-weight: bold; line-height: 1; text-decoration: none; }
      .rss-link svg circle { fill: var(--orange); }
      .rss-link svg path { fill: none; stroke: var(--orange); stroke-width: 2.2; stroke-linecap: round; }
      .rss-rest { max-width: 0; overflow: hidden; white-space: nowrap; color: var(--text-emph); transition: max-width 0.25s ease, margin 0.25s ease; }
      .rss-link:hover .rss-rest, .rss-link:focus-visible .rss-rest { max-width: 8em; margin-left: 6px; }
      @media (prefers-reduced-motion: reduce) { .rss-rest { transition: none; } }
      .post-list { list-style: none; display: flex; flex-direction: column; gap: 1rem; }
      .post-card { display: block; border: 2px solid var(--border); background: var(--panel); padding: 1rem 1.25rem; text-decoration: none; color: var(--text); transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease; }
      .post-card:hover { border-color: var(--accent); transform: translate(-3px, -3px); box-shadow: 6px 6px 0 var(--shadow); }
      .post-card-date { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.35rem; }
      .post-card-title { display: block; font-weight: bold; font-size: 1.1rem; color: var(--text-emph); }
      .post-card-summary { display: block; margin-top: 0.4rem; font-size: 0.9rem; color: var(--text); }
      .post-empty { color: var(--muted); }
      .post-header { margin-bottom: 2rem; border-bottom: 2px dashed var(--rule); padding-bottom: 1.25rem; }
      .post-header h1 { text-transform: none; letter-spacing: 0; margin-bottom: 0.5rem; }
      .post-meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 0.75rem; }
      .post-draft { margin-left: 0.5rem; padding: 1px 6px; border: 1px solid var(--orange); color: var(--orange); font-size: 0.75rem; }
      .post-body { line-height: 1.7; }
      .post-body > * + * { margin-top: 1.1rem; }
      .post-body p { margin-bottom: 0; }
      .post-body h2, .post-body h3, .post-body h4 { margin-top: 2rem; color: var(--text-emph); }
      .post-body h2 { font-size: 1.3rem; }
      .post-body h3 { font-size: 1.1rem; }
      .post-body h4 { font-size: 1rem; color: var(--yellow); }
      .post-body a { color: var(--accent); text-underline-offset: 3px; }
      .post-body a:hover { color: var(--accent-2); }
      .post-body ul, .post-body ol { padding-left: 1.5rem; }
      .post-body li + li { margin-top: 0.35rem; }
      .post-body li::marker { color: var(--muted); }
      .post-body blockquote { border-left: 3px solid var(--border); padding: 0.25rem 0 0.25rem 1rem; color: var(--muted); }
      .post-body code { font-size: 0.9em; }
      .post-body pre { background: var(--bg-alt); border: 1px solid var(--rule); padding: 1rem; overflow-x: auto; font-size: 0.85rem; line-height: 1.5; }
      .post-body pre code { background: none; padding: 0; color: var(--text); }
      .post-body img { max-width: 100%; height: auto; display: block; border: 2px solid var(--border); box-shadow: 6px 6px 0 var(--shadow); }
      .post-body hr { border: none; border-top: 2px dashed var(--rule); margin: 2rem 0; }
      .post-body table { width: 100%; border-collapse: collapse; border: 1px solid var(--border); }
      .post-body th, .post-body td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); }
      .post-body mark { background: color-mix(in srgb, var(--yellow) 30%, transparent); color: inherit; padding: 0 2px; }
      .callout { --callout: var(--blue); border: 1px solid var(--callout); border-left-width: 4px; background: color-mix(in srgb, var(--callout) 8%, var(--panel)); padding: 0.75rem 1rem; }
      .callout > * + * { margin-top: 0.6rem; }
      .callout-title { font-weight: bold; color: var(--callout); margin-bottom: 0; }
      .callout-tip, .callout-success, .callout-check, .callout-done { --callout: var(--green); }
      .callout-info, .callout-todo, .callout-abstract, .callout-summary { --callout: var(--cyan); }
      .callout-question, .callout-help, .callout-faq, .callout-example { --callout: var(--violet); }
      .callout-warning, .callout-caution, .callout-attention { --callout: var(--orange); }
      .callout-danger, .callout-error, .callout-bug, .callout-failure { --callout: var(--red); }
      .callout-quote, .callout-cite { --callout: var(--base01); }

      /* ASCII star field in the page background (behind the panel).
         Palette only: mostly base01, a few base1 / yellow / cyan / violet. */
      .container { position: relative; z-index: 1; }
      .sky { position: absolute; top: 0; left: 0; width: 100%; z-index: 0; pointer-events: none; overflow: hidden; }
      .star { position: absolute; font-size: 14px; line-height: 1; color: var(--base01); opacity: 0.1; animation: twinkle 5s ease-in-out infinite; will-change: opacity, transform; }
      .star.t-bright { color: var(--base1); }
      .star.t-yellow { color: var(--yellow); }
      .star.t-cyan { color: var(--cyan); }
      .star.t-violet { color: var(--violet); }
      @keyframes twinkle {
        0%, 100% { opacity: 0.08; transform: scale(0.85); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .card { transition: none; }
        .card:hover { transform: none; }
        .star { animation: none; opacity: 0.35; }
      }
    `;

    // Shared page script (theme toggle + star field); served at /assets/site.js.
    const siteJs = `
  // Theme toggle: dark by default; the choice is remembered per browser.
  (() => {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    const label = () => {
      const light = document.documentElement.dataset.theme === "light";
      btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    };
    label();
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      if (next === "light") document.documentElement.dataset.theme = "light";
      else delete document.documentElement.dataset.theme;
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
  })();

  // Scatter a sparse field of ASCII stars over the open background (never behind
  // the panel, so the strip above it gets its share); each twinkles on its own cycle.
  (() => {
    const sky = document.querySelector(".sky");
    const panel = document.querySelector(".container");
    if (!sky || !panel) return;
    const glyphs = [".", ".", ".", "'", "+", "*"];
    const tints = ["", "", "", "", "t-bright", "t-yellow", "t-cyan", "t-violet"];
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const PX_PER_STAR = 28500; // lower = denser

    const build = () => {
      sky.textContent = "";
      sky.style.height = "0px"; // don't let the old layer inflate the page height
      const w = document.documentElement.clientWidth;
      const h = document.documentElement.scrollHeight;
      sky.style.height = h + "px";
      // Panel footprint in page coordinates, padded to cover its offset shadow.
      const r = panel.getBoundingClientRect();
      const box = { l: r.left + scrollX - 14, r: r.right + scrollX + 14, t: r.top + scrollY - 14, b: r.bottom + scrollY + 14 };
      const open = w * h - (box.r - box.l) * (box.b - box.t);
      const count = Math.max(0, Math.round(open / PX_PER_STAR));
      for (let i = 0; i < count; i++) {
        let x, y, tries = 0;
        do {
          x = Math.random() * (w - 10);
          y = Math.random() * (h - 16);
        } while (x > box.l && x < box.r && y > box.t && y < box.b && ++tries < 30);
        const star = document.createElement("span");
        star.className = ("star " + pick(tints)).trim();
        star.textContent = pick(glyphs);
        star.style.left = x.toFixed(0) + "px";
        star.style.top = y.toFixed(0) + "px";
        const duration = 3 + Math.random() * 5;
        star.style.animationDuration = duration.toFixed(2) + "s";
        star.style.animationDelay = (-Math.random() * duration).toFixed(2) + "s";
        sky.appendChild(star);
      }
    };

    build();
    let resizeTimer;
    addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 250); });
  })();
`;

    // Shared assets: the main site and the /blog (11ty on Cloudflare Pages) both load
    // these, so the look lives in one place.
    const asset = (body, type, maxAge) => new Response(body, { headers: { "content-type": type, "cache-control": "public, max-age=" + maxAge } });
    if (path === "/assets/site.css") return asset(css, "text/css; charset=utf-8", 300);
    if (path === "/assets/site.js") return asset(siteJs, "text/javascript; charset=utf-8", 300);
    if (path === "/assets/duck.svg") return asset(DUCK_SVG, "image/svg+xml", 86400);

    // Blog: the 11ty build lives on Pages; serve it under /blog on this domain.
    if (path === "/blog") return Response.redirect(url.origin + "/blog/" + url.search, 301);
    if (path.startsWith("/blog/")) {
      const upstream = new URL(path.slice("/blog".length) + url.search, BLOG_ORIGIN);
      const res = await fetch(new Request(upstream, request), { redirect: "manual" });
      // Pages redirects (e.g. adding a trailing slash) point at its own root; keep them under /blog.
      const location = res.headers.get("location");
      if (location && location.startsWith("/") && !location.startsWith("/blog/")) {
        const headers = new Headers(res.headers);
        headers.set("location", "/blog" + location);
        return new Response(res.body, { status: res.status, headers });
      }
      return res;
    }

    let content = "";

    // ROUTING SYSTEM: Determines which content block to inject based on URL path
    if (path === "/admin") {

      // ==========================================
      // Admin Portal
      // Probes the tailnet host; devices on the tailnet are forwarded to
      // Guacamole, everyone else (the name doesn't resolve) sees a notice.
      // ==========================================
      content = `
        <div id="admin-checking">
          <h1>Admin Portal</h1>
          <p>Connecting&hellip;</p>
        </div>
        <div id="admin-denied" style="display: none;">
          <h1>Private Admin Area</h1>
          <p>This portal is for my own devices and is only reachable from my private network.</p>
          <p>Nothing's broken, it just isn't public. If you're here to see my work, the projects page is the place to be.</p>
          <a href="/projects" class="back-link">View My Work &rarr;</a>
        </div>
        <script>
          (() => {
            const target = ${JSON.stringify(ADMIN_TARGET)};
            const denied = () => {
              document.getElementById("admin-checking").style.display = "none";
              document.getElementById("admin-denied").style.display = "block";
            };
            const timeout = new Promise((_, reject) => setTimeout(reject, 3000));
            Promise.race([fetch(target, { mode: "no-cors", cache: "no-store" }), timeout])
              .then(() => location.replace(target))
              .catch(denied);
          })();
        </script>`;

    } else if (path === "/projects") {

      // ==========================================
      // Project Gallery
      // ==========================================
      content = `
        <h1>Projects</h1>
        <div class="grid">
          <a href="/project/1" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Project%20thumbs/razer-deathadder-v3-split-key-cover.webp" alt="Sleepy's Mouse Diag">
            <h3>Sleepy's Mouse Diag</h3>
            <p>Interactive diagnostic utility.</p>
          </a>
          <a href="/project/2" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Project%20thumbs/HistorytoX.png" alt="Browser Activity Report">
            <h3>Browser Activity Report</h3>
            <p>SQLite forensics &amp; Excel reporting tool.</p>
          </a>
          <a href="/project/3" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Project%20thumbs/Scripts-thumb.png" alt="Windows Scripts Toolkit">
            <h3>Windows Scripts Toolkit</h3>
            <p>PowerShell &amp; batch tools for IT triage.</p>
          </a>
          <a href="/project/4" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Project%20thumbs/DirectoryDemo-thumb.png" alt="Directory Board Demo">
            <h3>Directory Board Demo</h3>
            <p>Data-driven lobby directory board for kiosk TVs.</p>
          </a>
          <a href="/project/5" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/qudian-obsidian/main/Images/screenshot.png" alt="Qudian for Obsidian">
            <h3>Qudian for Obsidian</h3>
            <p>An Obsidian theme port of Qudian, inspired by Caves of Qud.</p>
          </a>
        </div>`;

    } else if (path === "/project/1") {

      // ==========================================
      // Project - Sleepy's Mouse Diag
      // ==========================================
      content = `
        <h1>Sleepy's Mouse Diag</h1>
        <p>A diagnostic tool for visualizing mouse input issues.</p>
        <div class="live-environment">
            <iframe src="https://sleepyzip.github.io/SleepyToolz/?v=11" title="Sleepy's Mouse Diag"></iframe>
        </div>
        <div class="description-block" style="margin-top: 2rem; border-top: 2px solid var(--border); padding-top: 1rem;">
            <h3 style="color: var(--accent);">> OVERVIEW</h3>
            <p>This utility was born out of necessity following recurring scroll-wheel inconsistencies with my Razer DeathAdder V3. <a href="https://fractalglider.github.io/fun/2018/02/13/testing-mouse-scroll-wheel.html" target="_blank" style="color: var(--accent);">Fractal Glider's scroll tester</a> established a strong proof-of-concept. It allows you to easily identify unintended scroll wheel skips/jumps due to faulty hardware. However, I identified a need for a more comprehensive diagnostic tool that provided similar telemetry across the entire mouse. I used Processing to recreate the tracer concept but added integrated duration timers and logic to detect double-click consistency. The tool was then rebuilt using Vanilla JavaScript (ES6) and HTML5 Canvas. By stripping away heavy dependency libraries, I reduced it from >5MB to under 10KB.</p>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> CONTROL_REFERENCE</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid var(--border);">
                <thead>
                    <tr>
                        <th style="padding: 0.5rem; text-align: left;">Input</th>
                        <th style="padding: 0.5rem; text-align: left;">Function</th>
                    </tr>
                </thead>
                <tbody style="font-family: monospace;">
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Arrow Up / +</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Increase Trail Persistence</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Arrow Down / -</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Decrease Trail Persistence</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Arrow Left/Right</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Adjust Tick Height</td></tr>
                </tbody>
            </table>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else if (path === "/project/2") {

      // ==========================================
      // Project - Browser Activity Report
      // ==========================================
      content = `
        <h1>Browser Activity Report</h1>
        <p>Turns Chrome/Edge SQLite history databases into categorized Excel reports.</p>
        <div class="description-block" style="margin-top: 1rem; border-top: 2px solid var(--border); padding-top: 1rem;">
            <h3 style="color: var(--accent);">> OVERVIEW</h3>
            <p>Chrome and Edge keep browsing history in a local SQLite database, but raw <code>History</code> files aren't something you can hand to anyone for review. This tool parses that database directly, runs each visit through a rule-driven categorizer (work tools, job searching, social media, shopping, and so on), and writes a formatted Excel workbook with a summary sheet, per-visit detail, downloads, and source-file hashes. There's a drag-and-drop GUI, a CLI, and optional PowerShell components for collecting history at scale via an RMM across a fleet of machines.</p>
            <p>Built for IT teams that occasionally need to review workstation activity as part of an authorized investigation, so the design leans on that constraint rather than treating it as an afterthought. The tool ships with a written appropriate-use policy, supports collecting from specific users instead of sweeping every profile, and treats every output file as confidential by default.</p>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> REPORT_CONTENTS</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid var(--border);">
                <thead>
                    <tr>
                        <th style="padding: 0.5rem; text-align: left;">Sheet</th>
                        <th style="padding: 0.5rem; text-align: left;">Contents</th>
                    </tr>
                </thead>
                <tbody style="font-family: monospace;">
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Summary</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Per-user visit counts by category</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Visit Detail</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Timestamped, filterable by date/PC/category</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Downloads</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Files downloaded per session</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Uncategorized Domains</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Domains with no rule match, for tuning</td></tr>
                </tbody>
            </table>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> STACK</h3>
            <div class="skills-group">
              <div class="skill-tag">Python</div>
              <div class="skill-tag">SQLite parsing</div>
              <div class="skill-tag">openpyxl</div>
              <div class="skill-tag">Tkinter GUI</div>
              <div class="skill-tag">PowerShell / RMM collection</div>
            </div>
            <p style="margin-top: 1.5rem;"><a href="https://github.com/SleepyZip/SleepyToolz/tree/main/browser-activity-report" target="_blank" class="contact-link" style="padding-left:0;">Source on GitHub &rarr;</a></p>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else if (path === "/project/3") {

      // ==========================================
      // Project - Windows Scripts Toolkit
      // ==========================================
      content = `
        <h1>Windows Scripts Toolkit</h1>
        <p>PowerShell and batch scripts for common Windows IT triage and maintenance tasks.</p>
        <div class="description-block" style="margin-top: 1rem; border-top: 2px solid var(--border); padding-top: 1rem;">
            <h3 style="color: var(--accent);">> OVERVIEW</h3>
            <p>A small toolkit of the scripts I actually reach for on an unfamiliar workstation or a routine maintenance pass: a system triage report, a network health check that flags what's actually broken instead of dumping raw ping output, a dry-run-by-default temp file cleaner, and the classic release/renew/flush-DNS/Winsock reset routine as a batch file for when PowerShell isn't the right tool for the job.</p>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> SCRIPTS</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid var(--border);">
                <thead>
                    <tr>
                        <th style="padding: 0.5rem; text-align: left;">Script</th>
                        <th style="padding: 0.5rem; text-align: left;">Purpose</th>
                    </tr>
                </thead>
                <tbody style="font-family: monospace;">
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Get-SystemInfoReport.ps1</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">OS/hardware/disk/network dump plus recently installed software</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Test-NetworkHealth.ps1</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Gateway/DNS/external connectivity check with a plain-English summary</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Clear-TempFiles.ps1</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Temp/cache cleanup, dry-run by default</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Reset-NetworkStack.bat</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Classic IP release/renew, DNS flush, Winsock reset</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Get-/Set-UserNetworkShares.ps1</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Reads a user's mapped drives (live or offline) and replicates them onto another user</td></tr>
                </tbody>
            </table>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> STACK</h3>
            <div class="skills-group">
              <div class="skill-tag">PowerShell</div>
              <div class="skill-tag">Batch / cmd.exe</div>
              <div class="skill-tag">Windows CIM/WMI</div>
              <div class="skill-tag">Network diagnostics</div>
            </div>
            <p style="margin-top: 1.5rem;"><a href="https://github.com/SleepyZip/SleepyToolz/tree/main/windows-scripts-toolkit" target="_blank" class="contact-link" style="padding-left:0;">Source on GitHub &rarr;</a></p>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else if (path === "/project/4") {

      // ==========================================
      // Project - Directory Board Demo
      // ==========================================
      content = `
        <h1>Directory Board Demo</h1>
        <p>A self-contained, data-driven lobby directory board built for unattended TV kiosks.</p>
        <p style="margin-bottom: 2rem;">
          <a href="https://sleepyzip.github.io/Building-Directory-Board-Demo/" target="_blank" class="contact-link" style="padding-left:0;">View Live Demo &rarr;</a>
        </p>
        <div class="live-environment">
            <iframe src="https://sleepyzip.github.io/Building-Directory-Board-Demo/" title="Directory Board Demo"></iframe>
        </div>
        <div class="description-block" style="margin-top: 2rem; border-top: 2px solid var(--border); padding-top: 1rem;">
            <h3 style="color: var(--accent);">> OVERVIEW</h3>
            <p>A single HTML file renders a full multi-floor building directory from one plain JS data object: no templates, no build step, no server. It's built to run on a PC connected to a TV in a lobby, 24/7, unattended, refreshing itself to pick up changes without anyone touching the display. The building, tenants, and staff shown ("Beacon Ridge Commons") are entirely fictional. This is a sanitized demo built from the same rendering engine used in a real board I originally developed for a multi-tenant office building, with all identifying details replaced for portfolio purposes.</p>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> FEATURES</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid var(--border);">
                <thead>
                    <tr>
                        <th style="padding: 0.5rem; text-align: left;">Feature</th>
                        <th style="padding: 0.5rem; text-align: left;">Detail</th>
                    </tr>
                </thead>
                <tbody style="font-family: monospace;">
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Data-driven layout</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Entire board is one JS object; editing it is the only thing needed to update the display</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Portrait auto-scaling</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Built for a 1080&times;1920 canvas but scales to fit any screen or aspect ratio</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Self-refreshing</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Reloads on a timer to pick up data edits with no server or push</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Burn-in guard</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Subtle pixel-shift nudge on a timer for displays that sit on the same TV for months</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Smart credential parsing</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">"Last, First, CRED" entries auto-split and alphabetized</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Client-side QR generation</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">No external image dependency, generated on load</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Zero backend</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border);">Plain HTML/CSS/JS; deploys anywhere that can serve a static file</td></tr>
                </tbody>
            </table>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> STACK</h3>
            <div class="skills-group">
              <div class="skill-tag">Vanilla JavaScript (ES6)</div>
              <div class="skill-tag">HTML5 / CSS3</div>
              <div class="skill-tag">Client-side QR generation</div>
              <div class="skill-tag">Windows Task Scheduler (kiosk deployment)</div>
            </div>
            <p style="margin-top: 1.5rem;"><a href="https://github.com/SleepyZip/Building-Directory-Board-Demo" target="_blank" class="contact-link" style="padding-left:0;">Source on GitHub &rarr;</a></p>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else if (path === "/project/5") {

      // ==========================================
      // Project - Qudian for Obsidian
      // ==========================================
      content = `
        <h1>Qudian for Obsidian</h1>
        <p>An Obsidian theme port of Qudian, with a look inspired by the UI of Caves of Qud.</p>
        <div class="description-block" style="margin-top: 1rem; border-top: 2px solid var(--border); padding-top: 1rem;">
            <img src="https://raw.githubusercontent.com/SleepyZip/qudian-obsidian/main/Images/screenshot.png" alt="Qudian for Obsidian screenshot" style="width: 100%; border: 1px solid var(--border); margin-bottom: 1.5rem;">
            <h3 style="color: var(--accent);">> OVERVIEW</h3>
            <p>A collaboration with dwwr, who created the original Qudian theme for macOS Terminal and VS Code/Cursor. This port brings the same palette (itself inspired by Caves of Qud's UI) into Obsidian as a proper theme, with a matching <code>manifest.json</code> and <code>theme.css</code>. Submitted to Obsidian's community theme store.</p>
            <h3 style="color: var(--accent); margin-top: 1.5rem;">> STACK</h3>
            <div class="skills-group">
              <div class="skill-tag">CSS</div>
              <div class="skill-tag">Obsidian Theme API</div>
              <div class="skill-tag">JSON</div>
            </div>
            <p style="margin-top: 1.5rem;">
              <a href="https://github.com/SleepyZip/qudian-obsidian" target="_blank" class="contact-link" style="padding-left:0;">Source on GitHub &rarr;</a><br>
              <a href="https://community.obsidian.md/themes/qudian" target="_blank" class="contact-link" style="padding-left:0;">View on Obsidian Community Themes &rarr;</a>
            </p>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else {

      // ==========================================
      // HOME PAGE
      // ==========================================
      content = `
        <div class="intro-section">
          <div class="bio-text">
            <h2>Trevor DeMelo</h2>
            <p>
              Fascinated by computing from an early age, I spent hours in the environments of Windows and OS X, animating Flash cartoons and building my first websites from scratch. Now I provide Tier 1 and Tier 2 technical support across high-availability environments and medical-sector installations.
            </p>
            <p style="margin-top: 16px;">
              <a href="/projects" class="contact-link" style="padding-left:0;">View My Work &rarr;</a>
            </p>
          </div>
          <div class="bio-portrait-frame">
            <div class="portrait-container">
              <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Images/AboutMe.png" width="768" height="1024" alt="Trevor DeMelo Self-portrait Sketch">
            </div>
          </div>
        </div>

        <hr class="section-divider">

        <div class="contact-section">
          <h3>Contact</h3>
          <div class="contact-grid">
            <div class="contact-item">
              <span class="label">EMAIL:</span>
              <a href="mailto:Contact@TrevorDeMelo.com" class="contact-link">Contact@TrevorDeMelo.com</a>
            </div>
            <div class="contact-item">
              <span class="label">LINKS:</span>
              <a href="https://www.linkedin.com/in/trevor-demelo-33207595/" target="_blank" class="contact-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIN
              </a>
            </div>
          </div>
        </div>
      `;

    }

    // Assemble the complete HTML document using the layout frame
    return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Trevor DeMelo | Portfolio</title><link rel="icon" type="image/svg+xml" href="/assets/duck.svg"><meta name="description" content="Trevor DeMelo, IT professional. Network administration, systems diagnostics, and Cloudflare Workers projects."><meta property="og:title" content="Trevor DeMelo | Portfolio"><meta property="og:description" content="IT professional. Network administration, systems diagnostics, and Cloudflare Workers projects."><meta property="og:type" content="website"><meta property="og:url" content="https://trevordemelo.com"><meta property="og:image" content="https://github.com/SleepyZip/mywebpage/blob/main/Assets/Images/AboutMe.png?raw=true"><script>try { if (localStorage.getItem("theme") === "light") document.documentElement.dataset.theme = "light"; } catch (e) {}</script><link rel="stylesheet" href="/assets/site.css"></head><body>
      <div class="sky" aria-hidden="true"></div>
      <div class="container">
        <nav>
          <div>
            <a href="/">HOME</a>
            <a href="/projects">PROJECTS</a>
            <a href="/blog/">BLOG</a>
          </div>
          <div class="nav-right">
            <button type="button" class="nav-icon-btn theme-toggle" aria-label="Switch to light theme" title="Switch theme"><svg class="icon-sun" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4"/></svg><svg class="icon-moon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z"/></svg><span class="theme-rest" aria-hidden="true"><span class="theme-word theme-word-light">Light</span><span class="theme-sep">/</span><span class="theme-word theme-word-dark">Dark</span></span></button>
            <a href="/admin" class="nav-icon-btn portal-link" aria-label="Admin Portal"><span class="portal-a" aria-hidden="true">A</span><span class="portal-rest" aria-hidden="true">dmin Portal</span></a>
          </div>
        </nav>
        ${content}
      </div>
      <script src="/assets/site.js" defer></script>
    </body></html>`, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
  }
};
