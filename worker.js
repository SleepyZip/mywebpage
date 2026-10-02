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
      /* Light theme: the default (set before paint in <head>); the toggle switches to dark. */
      :root[data-theme="light"] {
        --bg: var(--base2); --panel: var(--base3); --bg-alt: var(--base2);
        --text: var(--base00); --text-emph: var(--base02); --muted: var(--base1);
        --border: var(--base1); --rule: var(--base2);
        --shadow: rgba(220, 50, 47, 0.16);
        --accent: var(--red); --accent-2: var(--orange);
        color-scheme: light;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      /* The page itself never scrolls: the panel fits the window and scrolls inside. */
      html { overflow: hidden; }
      body { font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace; font-size: 15px; background: var(--bg); color: var(--text); padding: 3rem 1rem; display: flex; justify-content: center; align-items: flex-start; height: 100vh; height: 100dvh; overflow: hidden; }

      /* Signature: the name in the bottom-right corner inside the front layer of the cloud
         bank, filled with the theme's gradient (deepened at night so it stands out against
         the pale front clouds). site.js has each letter ride the cloud surface as it scrolls
         by. Each letter carries its own slice of one shared gradient (--x is its offset in
         the name), so the colors run continuously across the letters, flowing left like
         the clouds. */
      .signature { position: fixed; right: 18px; bottom: 8px; z-index: 0; font-family: "Jost", sans-serif; font-weight: 400; font-size: clamp(22px, 2.4vw, 32px); line-height: 1; letter-spacing: 0.06em; white-space: nowrap; pointer-events: none; opacity: 0; animation: fade-in 1.2s ease-out 0.4s forwards;
        --sig-grad: linear-gradient(90deg, color-mix(in srgb, var(--cyan) 55%, var(--base03)), color-mix(in srgb, var(--blue) 55%, var(--base03)), color-mix(in srgb, var(--violet) 60%, var(--base03)), color-mix(in srgb, var(--blue) 55%, var(--base03)), color-mix(in srgb, var(--cyan) 55%, var(--base03))); }
      :root[data-theme="light"] .signature { --sig-grad: linear-gradient(90deg, var(--orange), var(--red), var(--magenta), var(--red), var(--orange)); }
      .signature span { display: inline-block; white-space: pre; will-change: transform; color: transparent; background-image: var(--sig-grad); background-size: 360px 100%; background-repeat: repeat-x; background-position: calc(-1 * var(--x, 0px)) 0; -webkit-background-clip: text; background-clip: text; animation: sig-flow 9s linear infinite; }
      @keyframes sig-flow { to { background-position: calc(-1 * var(--x, 0px) - 360px) 0; } }
      @keyframes fade-in { to { opacity: 1; } }

      /* The panel: bordered card with the offset shadow block behind it */
      .container { background: var(--panel); border: 2px solid var(--border); padding: 1.5rem 2.25rem 2.25rem; width: 100%; max-width: 820px; max-height: 100%; display: flex; flex-direction: column; overflow: hidden; box-shadow: 10px 10px 0 var(--shadow); }
      /* The page's content scrolls inside the panel, below the fixed nav bar; the thin
         scrollbar sits just inside the panel's right border. */
      /* The negative-margin/padding pairs keep content in place while giving the scroll box room
         on both sides: the scrollbar on the right, and hovered cards lifting 3px on the left. */
      .page { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; margin-right: -1.5rem; padding-right: 1.5rem; margin-left: -6px; padding-left: 6px; scrollbar-width: thin; scrollbar-color: var(--base01) transparent; }
      .page::-webkit-scrollbar { width: 8px; }
      .page::-webkit-scrollbar-thumb { background: var(--base01); border-radius: 4px; }
      .page::-webkit-scrollbar-track { background: transparent; }
      a { color: var(--accent); }
      code { color: var(--accent-2); background: var(--bg-alt); padding: 1px 5px; }

      nav { flex: none; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; border-bottom: 2px solid var(--rule); padding-bottom: 26px; padding-right: 3rem; }
      nav a { color: var(--text-emph); text-decoration: none; margin-right: 0.5rem; padding: 3px 8px; font-weight: bold; letter-spacing: 0.05em; font-size: 0.9rem; }
      nav > div:first-child a:first-child { margin-left: -8px; }
      nav a:hover { background: var(--accent); color: var(--panel); }
      /* Home page: the panel is just the nav bar (no divider, no space below it). */
      .container.is-home { padding-bottom: 0; }
      .container.is-home nav { border-bottom: none; margin-bottom: 0; }
      .container.is-home .page { display: none; }
      /* Icon buttons (Minimize on top, Admin Portal below) stacked in the panel's
         top-right corner, the same 12px in from the top and right edges. They sit
         outside the nav's flow; the nav's bottom padding puts the divider 12px below the
         stack, and the links sit level with the middle of the stack. */
      .nav-right { position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
      /* Square 20px icon buttons (Minimize, Admin Portal, and the blog RSS link). */
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
      /* Minimize: collapses the panel into a small corner tile around this button, and back */
      .nav-icon-btn.min-toggle { width: auto; min-width: 20px; display: inline-flex; align-items: center; justify-content: center; padding: 0 3px; font: inherit; font-size: 0.8rem; font-weight: bold; line-height: 1; color: var(--text-emph); }
      .min-toggle svg { fill: none; stroke: var(--accent-2); stroke-width: 2; stroke-linecap: square; }
      .min-toggle .icon-restore, .is-minimized .min-toggle .icon-min { display: none; }
      .is-minimized .min-toggle .icon-restore { display: block; }
      .min-rest { max-width: 0; overflow: hidden; white-space: nowrap; transition: max-width 0.25s ease, margin 0.25s ease; }
      .min-toggle:hover .min-rest, .min-toggle:focus-visible .min-rest { max-width: 8em; margin-left: 6px; }
      .min-rest .when-min, .is-minimized .min-rest .when-open { display: none; }
      .is-minimized .min-rest .when-min { display: inline; }
      /* Light / Dark words in the moon's hover label; the current theme is highlighted */
      .theme-word { color: var(--muted); padding: 1px 3px; transition: background 0.15s ease, color 0.15s ease; }
      .theme-sep { color: var(--muted); padding: 0 1px; }
      :root:not([data-theme="light"]) .theme-word-dark, :root[data-theme="light"] .theme-word-light { background: var(--accent); color: var(--panel); }
      @media (prefers-reduced-motion: reduce) { .theme-word { transition: none; } }

      h1 { font-size: 1.7rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-emph); }
      h2 { font-size: 1.5rem; color: var(--text-emph); margin-bottom: 1rem; }
      h3 { margin-bottom: 0.5rem; color: var(--text-emph); }
      p { margin-bottom: 1.5rem; line-height: 1.7; }

      /* HOME: bio + framed portrait */
      .intro-section { display: grid; grid-template-columns: 1fr 230px; gap: 2.5rem; align-items: start; }
      .bio-portrait-frame { border: 2px solid var(--border); background: var(--bg-alt); padding: 6px; box-shadow: 6px 6px 0 var(--shadow); }
      .portrait-container { overflow: hidden; display: flex; justify-content: center; align-items: center; }
      .portrait-container img { width: 100%; height: auto; display: block; }
      :root[data-theme="light"] .portrait-container img { filter: url(#portrait-ink); }

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
        body { padding: 3rem 0.75rem 1rem; }
        .container { padding: 1.5rem 1.25rem 1.25rem; box-shadow: 6px 6px 0 var(--shadow); }
        .page { margin-right: -1rem; padding-right: 1rem; }
        .intro-section { grid-template-columns: 1fr; gap: 1.5rem; }
        .bio-portrait-frame { max-width: 230px; margin: 0 auto; }
        .contact-item { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
        .live-environment { height: 420px; }
      }

      /* BLOG (11ty, served at /blog): post list, post body, Obsidian callouts */
      nav a[aria-current="page"] { color: var(--accent); }
      nav a[aria-current="page"]:hover { color: var(--panel); }
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
      .callout { --callout: var(--accent); border: 1px solid var(--callout); border-left-width: 4px; background: color-mix(in srgb, var(--callout) 8%, var(--panel)); padding: 0.75rem 1rem; }
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
      .sky { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
      .star { position: absolute; font-size: 14px; line-height: 1; color: var(--base01); opacity: 0.1; animation: twinkle 5s ease-in-out infinite; will-change: opacity, transform; }
      .star.t-bright { color: var(--base1); }
      .star.t-yellow { color: var(--yellow); }
      .star.t-cyan { color: var(--cyan); }
      .star.t-violet { color: var(--violet); }
      @keyframes twinkle {
        0%, 100% { opacity: 0.15; transform: scale(0.85); }
        50% { opacity: 0.9; transform: scale(1.1); }
      }
      /* Constellations: now and then one fades in over the open background, joined by
         thin lines, then fades out. A few stars carry their real color from the palette. */
      .constellation { position: absolute; pointer-events: none; opacity: 0; animation: constellation 18s ease-in-out forwards; }
      .constellation svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .constellation line { stroke: var(--base01); stroke-width: 1; opacity: 0.55; }
      .constellation .cs { position: absolute; transform: translate(-50%, -50%); line-height: 1; color: var(--base1); }
      .constellation .cs.c-orange { color: var(--orange); }
      .constellation .cs.c-blue { color: var(--blue); }
      .constellation .cs.c-yellow { color: var(--yellow); }
      .constellation .cs.c-green { color: var(--green); }
      @keyframes constellation {
        0% { opacity: 0; }
        22%, 72% { opacity: 0.6; }
        100% { opacity: 0; }
      }
      /* Theme toggle: the moon (in its real current phase) in dark mode, the sun in light
         mode. It floats in the open sky left of the panel with a slow drift; on hover a thin
         circuit line draws out to a Light / Dark label. */
      .moon-toggle { position: fixed; top: clamp(56px, 14vh, 170px); left: max(10px, calc((100vw - 820px) / 4 - 17px)); z-index: 0; width: 34px; height: 34px; padding: 0; border: none; border-radius: 50%; background: none; cursor: pointer; font: inherit; }
      .moon-toggle > svg { width: 100%; height: 100%; display: block; overflow: visible; transition: filter 0.2s ease; }
      .moon-toggle { animation: moon-drift 26s ease-in-out infinite; }
      @keyframes moon-drift {
        0%, 100% { transform: translate(0px, 0px); }
        30% { transform: translate(5px, -4px); }
        60% { transform: translate(-3px, 3px); }
        80% { transform: translate(2px, 5px); }
      }
      .moon-art { filter: drop-shadow(0 0 7px color-mix(in srgb, var(--base2) 30%, transparent)); }
      .moon-art .moon-disk { fill: var(--base02); stroke: var(--base01); stroke-width: 0.6; }
      .moon-art .moon-lit { fill: var(--base2); }
      .moon-toggle .sun-art { display: none; overflow: visible; filter: drop-shadow(0 0 6px color-mix(in srgb, var(--red) 40%, transparent)); }
      .sun-art circle { fill: var(--red); }
      .sun-rays { transform-box: view-box; transform-origin: 19px 19px; animation: sun-spin 90s linear infinite; }
      .sun-rays text { fill: var(--red); font: bold 9px ui-monospace, "Cascadia Code", Consolas, monospace; text-anchor: middle; dominant-baseline: central; }
      @keyframes sun-spin { to { transform: rotate(360deg); } }
      :root[data-theme="light"] .moon-toggle .moon-art { display: none; }
      :root[data-theme="light"] .moon-toggle .sun-art { display: block; }
      .moon-toggle:hover .moon-art, .moon-toggle:focus-visible .moon-art { filter: drop-shadow(0 0 11px color-mix(in srgb, var(--base2) 55%, transparent)); }
      .moon-toggle:hover .sun-art, .moon-toggle:focus-visible .sun-art { filter: drop-shadow(0 0 10px color-mix(in srgb, var(--red) 65%, transparent)); }
      .moon-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
      .moon-toggle:hover, .moon-toggle:focus-visible { z-index: 4; } /* above clouds and the panel while its label shows */
      .moon-lead { position: absolute; left: 28px; top: 20px; width: 60px; height: 20px; pointer-events: none; }
      .moon-lead svg { width: 100%; height: 100%; display: block; overflow: visible; }
      .moon-lead path { fill: none; stroke: var(--accent-2); stroke-width: 1.2; stroke-dasharray: 70; stroke-dashoffset: 70; transition: stroke-dashoffset 0.3s ease; }
      .moon-lead circle { fill: var(--accent-2); opacity: 0; transition: opacity 0.15s ease; }
      .moon-label { position: absolute; left: 90px; top: 24px; display: inline-flex; align-items: center; white-space: nowrap; font-size: 0.8rem; font-weight: bold; line-height: 1; padding: 2px 3px; background: var(--panel); border: 1px solid var(--accent-2); box-shadow: 2px 2px 0 var(--shadow); opacity: 0; transform: translateX(-4px); transition: opacity 0.15s ease, transform 0.15s ease; pointer-events: none; }
      .moon-phase { position: absolute; left: 91px; top: 9px; white-space: nowrap; font-size: 10px; line-height: 1; letter-spacing: 0.03em; color: var(--base1); opacity: 0; transform: translateX(-4px); transition: opacity 0.15s ease, transform 0.15s ease; pointer-events: none; }
      .sky-blood-moon .moon-phase { color: var(--orange); }
      :root[data-theme="light"] .moon-phase { display: none; }
      .moon-toggle:hover .moon-phase, .moon-toggle:focus-visible .moon-phase { opacity: 1; transform: none; transition-delay: 0.28s; }
      .moon-toggle:hover .moon-lead path, .moon-toggle:focus-visible .moon-lead path { stroke-dashoffset: 0; }
      .moon-toggle:hover .moon-lead circle, .moon-toggle:focus-visible .moon-lead circle { opacity: 1; transition-delay: 0.25s; }
      .moon-toggle:hover .moon-label, .moon-toggle:focus-visible .moon-label { opacity: 1; transform: none; transition-delay: 0.28s; }
      /* No room beside the panel: sit in the strip above it instead (and scroll away). */
      @media (max-width: 940px) {
        .moon-toggle { position: absolute; top: 8px; left: 9vw; width: 30px; height: 30px; }
        .moon-lead { left: 24px; top: 16px; }
        .moon-label { left: 86px; top: 20px; }
        .moon-phase { left: 87px; top: 5px; }
      }

      /* Minimized page: once the collapse animation (site.js) ends, the panel's frame fades
         away and only the Restore button is left, fully expanded and softly pulsing. */
      .container { transition: clip-path 0.3s ease, background-color 0.3s ease, border-color 0.3s ease; }
      .is-minimized .container { clip-path: inset(0px 0px calc(100% - 44px) calc(100% - 150px)); background-color: transparent; border-color: transparent; }
      .is-minimized .container * { visibility: hidden; }
      .is-minimized .container .min-toggle, .is-minimized .container .min-toggle * { visibility: visible; }
      .is-minimized .min-rest { max-width: 8em; margin-left: 6px; }
      .is-minimized .nav-icon-btn.min-toggle { border-color: var(--accent-2); animation: restore-pulse 2.6s ease-in-out infinite; }
      @keyframes restore-pulse {
        0%, 100% { box-shadow: 0 0 0 color-mix(in srgb, var(--accent-2) 0%, transparent); }
        50% { box-shadow: 0 0 10px color-mix(in srgb, var(--accent-2) 55%, transparent); }
      }
      .container.is-animating { border-color: var(--accent-2); }
      /* The [A] steps aside so it doesn't peek into the shrinking corner. */
      .container.is-animating .portal-link { visibility: hidden; }
      .min-scan { position: absolute; height: 2px; right: 0; background: var(--accent-2); box-shadow: 0 0 8px var(--accent-2), 0 0 2px var(--accent-2); pointer-events: none; z-index: 5; }

      /* Rare sky events (animated from site.js). One plays at a time. */
      .comet, .meteor, .satellite, .supernova, .supernova-ring, .firework { position: absolute; pointer-events: none; opacity: 0; }
      .comet, .meteor { width: 0; height: 0; transform-origin: 0 0; }
      .comet-tail { position: absolute; right: 4px; top: -1px; width: 150px; height: 2px; border-radius: 2px; background: linear-gradient(to left, var(--cyan), transparent); filter: blur(0.4px); }
      .comet-head { position: absolute; right: -4px; top: -8px; font-size: 15px; line-height: 1; color: var(--cyan); text-shadow: 0 0 6px var(--cyan); }
      .meteor { --meteor: var(--base2); }
      :root[data-theme="light"] .meteor { --meteor: var(--base01); }
      .meteor::before { content: ""; position: absolute; right: 0; top: -1px; width: 90px; height: 1.5px; border-radius: 2px; background: linear-gradient(to right, transparent, var(--meteor)); }
      .meteor::after { content: ""; position: absolute; right: -1.5px; top: -1.75px; width: 3px; height: 3px; border-radius: 50%; background: var(--meteor); box-shadow: 0 0 6px var(--meteor); }
      .sat-dot { position: absolute; left: -1.5px; top: -1.5px; width: 3px; height: 3px; border-radius: 50%; background: var(--base1); }
      :root[data-theme="light"] .sat-dot { background: var(--base01); }
      /* Plane: one plane in both themes, seen from below: a silhouette trailing a contrail, with
         steady red and green wingtip lights either side of a white double-flash strobe. By day
         it's lit (silhouette and contrail, lights lost in the daylight); by night the dark hides
         it (a faint shape and trail) and its lights show. Switching themes mid-flight fades
         between the two, so it's the same plane, obscured by darkness or lit by daylight. */
      .plane { position: absolute; pointer-events: none; opacity: 0; width: 0; height: 0; }
      .plane svg { position: absolute; left: -24px; top: -5px; width: 24px; height: 10px; fill: var(--base02); opacity: 0.7; transition: fill 0.8s ease, opacity 0.8s ease; }
      .plane .contrail { opacity: 0.12; transition: opacity 0.8s ease; }
      .plane-lights { position: absolute; left: -15px; top: 0; transition: opacity 0.8s ease; }
      :root[data-theme="light"] .plane svg { fill: var(--base01); opacity: 1; }
      :root[data-theme="light"] .plane .contrail { opacity: 1; }
      :root[data-theme="light"] .plane-lights { opacity: 0; }
      .plane-light { position: absolute; left: -1.5px; width: 3px; height: 3px; border-radius: 50%; }
      .plane-top { top: -5.5px; }
      .plane-bottom { top: 2.5px; }
      .plane-port { background: var(--red); box-shadow: 0 0 4px var(--red); }
      .plane-starboard { background: var(--green); box-shadow: 0 0 4px var(--green); }
      .plane-strobe { --strobe: var(--base3); left: 3px; top: -1.5px; background: var(--strobe); opacity: 0; animation: plane-strobe 1.3s linear infinite; }
      @keyframes plane-strobe {
        0%, 4%, 8%, 12%, 100% { opacity: 0; box-shadow: none; }
        2%, 10% { opacity: 1; box-shadow: 0 0 6px 1px var(--strobe); }
      }
      .supernova { font-size: 14px; line-height: 1; color: var(--base2); text-shadow: 0 0 6px var(--yellow), 0 0 16px var(--yellow); }
      :root[data-theme="light"] .supernova { color: var(--base01); }
      .supernova-ring { width: 18px; height: 18px; border: 1px solid var(--cyan); border-radius: 50%; }
      .firework { font-size: 15px; line-height: 1; font-weight: bold; }
      /* Daytime (light theme): the night sky gives way to the odd bird or migrating flock.
         Drifting pixel clouds and planes show in both themes. */
      :root[data-theme="light"] :is(.star, .constellation, .comet, .meteor, .satellite, .supernova, .supernova-ring, .firework) { display: none; }
      :root:not([data-theme="light"]) .birds { display: none; }
      /* Clouds live in their own layer: above the sun and moon (so they can pass in front),
         below the panel. Each is a pixel-art cloud like the cloud bank's (a shape mask over
         one of its layer colors, set by depth), drifting left from off the right edge. */
      .clouds { position: absolute; top: 0; left: 0; width: 100%; height: 100vh; z-index: 0; overflow: hidden; pointer-events: none; }
      .cloud { position: absolute; left: 100%; animation: cloud-drift 240s linear infinite; will-change: transform; }
      /* The shape is its own layer, so the mask doesn't clip what rides along (the face, the snore box). */
      .cloud-shape { position: absolute; inset: 0; background: var(--cb-color); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
      @keyframes cloud-drift { to { transform: translateX(calc(-100vw - 100%)); } }
      /* One cloud has a sleepy face: a slightly deeper shade of its own color, so it's subtle. */
      .cloud-face { position: absolute; color: color-mix(in srgb, var(--cb-color) 62%, var(--base03)); transition: color 0.8s ease; }
      :root[data-theme="light"] .cloud-face { color: color-mix(in srgb, var(--cb-color) 72%, var(--base01)); }
      .cloud-face svg { display: block; fill: currentColor; }
      /* Now and then it dreams: a little thought bubble (in the moon label's colors) above
         it, with two shrinking circles trailing down to the cloud. Animated from site.js. */
      .cloud-bubble { position: absolute; bottom: calc(100% + 14px); left: 55%; padding: 4px 10px; font: bold 11px/1 ui-monospace, "Cascadia Code", Consolas, monospace; letter-spacing: 0.04em; white-space: nowrap; color: var(--text-emph); background: var(--panel); border: 1px solid var(--accent-2); border-radius: 999px; box-shadow: 2px 2px 0 var(--shadow); opacity: 0; }
      .cloud-bubble::before, .cloud-bubble::after { content: ""; position: absolute; border-radius: 50%; background: var(--panel); border: 1px solid var(--accent-2); box-shadow: 1.5px 1.5px 0 var(--shadow); }
      .cloud-bubble::before { left: 8px; top: calc(100% + 3px); width: 8px; height: 8px; }
      .cloud-bubble::after { left: 3px; top: calc(100% + 13px); width: 5px; height: 5px; }
      /* Sky_Whale (a visiting character): a distant pixel whale who swims in the cloud bank,
         behind all but its farthest layer: he cruises along the cloud tops, spouts, then
         breaches and dives, splashing up puffs of cloud. Muted colors (deep blues by night,
         hazy blue-grays by day) so he reads as far away. Animated from site.js. */
      .whale { position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform;
        --wh-body: color-mix(in srgb, var(--blue) 30%, var(--base02)); --wh-belly: color-mix(in srgb, var(--blue) 48%, var(--base02));
        --wh-fin: color-mix(in srgb, var(--blue) 16%, var(--base03)); --wh-eye: var(--base03); --wh-freckle: color-mix(in srgb, var(--base1) 70%, var(--base02)); }
      .whale svg { display: block; }
      .whale .wB { fill: var(--wh-body); }
      .whale .wL { fill: var(--wh-belly); }
      .whale .wF { fill: var(--wh-fin); }
      .whale .wE { fill: var(--wh-eye); }
      .whale .wS { fill: var(--wh-freckle); }
      .whale .wf-b, .whale.flap .wf-a { display: none; }
      .whale.flap .wf-b { display: inline; }
      .whale-puff { position: absolute; left: 0; top: 0; background: var(--cb-color); pointer-events: none; }
      :root[data-theme="light"] .whale {
        --wh-body: color-mix(in srgb, var(--blue) 38%, var(--base1)); --wh-belly: color-mix(in srgb, var(--blue) 22%, var(--base2));
        --wh-fin: color-mix(in srgb, var(--blue) 40%, var(--base01)); --wh-eye: var(--base02); --wh-freckle: var(--base3); }
      /* Cloud bank: layered pixel-art clouds along the bottom of the window (after Cave
         Story's ending), drawn in site.js. Each layer's shape is a repeating mask over its
         theme color and scrolls left one tile per loop: front fastest, back slowest. */
      .cloudbank { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; opacity: 0; animation: fade-in 1.2s ease-out forwards; }
      .cb-layer { position: absolute; left: 0; bottom: 0; width: calc(100% + var(--tile, 0px)); background: var(--cb-color); -webkit-mask-repeat: repeat-x; mask-repeat: repeat-x; -webkit-mask-position: left bottom; mask-position: left bottom; animation: cb-scroll 60s linear infinite; will-change: transform; }
      @keyframes cb-scroll { to { transform: translateX(calc(-1 * var(--tile, 0px))); } }
      /* Switching themes fades every cloud between its night and day color. */
      .cloud-shape, .cb-layer { transition: background-color 0.8s ease; }
      .cb-0 { --cb-color: color-mix(in srgb, var(--blue) 12%, var(--base03)); }
      .cb-1 { --cb-color: color-mix(in srgb, var(--blue) 36%, var(--base02)); }
      .cb-2 { --cb-color: color-mix(in srgb, var(--blue) 55%, var(--base01)); }
      .cb-3 { --cb-color: color-mix(in srgb, var(--blue) 60%, var(--base2)); }
      /* By day the back layers are a cool blue-gray, darker than the sky, and the front one a
         soft white, lighter than it, so no layer lands on the sky's own beige. */
      :root[data-theme="light"] .cb-0 { --cb-color: color-mix(in srgb, var(--blue) 41%, var(--base2)); }
      :root[data-theme="light"] .cb-1 { --cb-color: color-mix(in srgb, var(--blue) 29%, var(--base2)); }
      :root[data-theme="light"] .cb-2 { --cb-color: color-mix(in srgb, var(--blue) 15%, var(--base2)); }
      :root[data-theme="light"] .cb-3 { --cb-color: color-mix(in srgb, #fff 70%, var(--base3)); }
      .birds { position: absolute; pointer-events: none; opacity: 0; width: 0; height: 0; }
      .bird { position: absolute; width: 17px; height: 8px; overflow: visible; }
      .bird path { fill: none; stroke: var(--base01); stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
      .contrail { position: absolute; right: 24px; top: -1px; width: 280px; height: 2px; border-radius: 2px; background: linear-gradient(to left, var(--base3), transparent); }
      /* Blood moon: on real lunar eclipse nights the moon toggle glows red. */
      .sky-blood-moon .moon-toggle .moon-art .moon-lit { fill: var(--orange); }
      .sky-blood-moon .moon-toggle .moon-art .moon-disk { fill: color-mix(in srgb, var(--red) 40%, var(--base02)); stroke: var(--red); }
      .sky-blood-moon .moon-toggle .moon-art { filter: drop-shadow(0 0 9px color-mix(in srgb, var(--red) 55%, transparent)); }
      @media (prefers-reduced-motion: reduce) {
        .signature { animation: none; opacity: 1; }
        .signature span { animation: none; }
        .sun-rays { animation: none; }
        .card { transition: none; }
        .card:hover { transform: none; }
        .star { animation: none; opacity: 0.5; }
        .constellation, .comet { display: none; }
        .cloud, .cb-layer { animation: none; transition: none; }
        .cloud-shape, .cloud-face { transition: none; }
        .cloudbank { animation: none; opacity: 1; }
        .plane-strobe { animation: none; }
        .plane svg, .plane .contrail, .plane-lights { transition: none; }
        .moon-lead path, .moon-lead circle, .moon-label, .moon-phase, .container, .min-rest { transition: none; }
        .moon-toggle { animation: none; }
        .is-minimized .nav-icon-btn.min-toggle { animation: none; box-shadow: 0 0 8px color-mix(in srgb, var(--accent-2) 45%, transparent); }
      }
    `;

    // Shared page script, served at /assets/site.js: the moon theme toggle, Minimize, the
    // clock, and the night sky (stars, constellations, and rare events).
    const siteJs = `
  // Theme toggle: the moon in dark mode (drawn in tonight's real phase), the sun in
  // light mode. Light by default; the choice is remembered per browser.
  (() => {
    const btn = document.querySelector(".moon-toggle");
    if (!btn) return;

    // Moon phase from the date: 0 = new, 0.5 = full (synodic month from a known new moon).
    const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
    const days = (Date.now() - NEW_MOON) / 86400000;
    const p = (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;

    // Lit part of the disk: the sunlit limb plus the terminator (an ellipse). Waxing is
    // lit on the right, waning on the left (as seen from the northern hemisphere).
    const r = 19, rx = (r * Math.abs(Math.cos(2 * Math.PI * p))).toFixed(2);
    const waxing = p < 0.5;
    const limbSweep = waxing ? 1 : 0;
    const termSweep = waxing ? (p < 0.25 ? 0 : 1) : (p > 0.75 ? 1 : 0);
    const lit = btn.querySelector(".moon-lit");
    if (lit) lit.setAttribute("d", "M " + r + " 0 A " + r + " " + r + " 0 0 " + limbSweep + " " + r + " " + 2 * r + " A " + rx + " " + r + " 0 0 " + termSweep + " " + r + " 0 Z");

    const pct = Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100);
    const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    const phaseName = names[Math.round(p * 8) % 8];

    const label = () => {
      const light = document.documentElement.dataset.theme === "light";
      btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    };
    // Tonight's phase, shown in small text above the Light / Dark label on hover.
    const phase = btn.querySelector(".moon-phase");
    if (phase) phase.textContent = phaseName + " · " + pct + "% lit";
    label();
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      if (next === "light") document.documentElement.dataset.theme = "light";
      else delete document.documentElement.dataset.theme;
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
      dispatchEvent(new CustomEvent("themechange")); // for anything that reacts to the theme (the sky and clouds recolor in CSS)
    });
  })();

  // Minimize: the panel collapses upward into a glowing scan line, then folds into the
  // corner, leaving just the Restore button. Clicking again plays it in reverse.
  (() => {
    const btn = document.querySelector(".min-toggle");
    const panel = document.querySelector(".container");
    if (!btn || !panel) return;
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FULL = "inset(0px 0px 0px 0px)";
    const STRIP = "inset(0px 0px calc(100% - 44px) 0px)";
    const TILE = "inset(0px 0px calc(100% - 44px) calc(100% - 44px))";

    // Everything except this button: hidden from keyboard and screen readers while minimized.
    const hideable = () => [...panel.children].filter((el) => el.tagName !== "NAV")
      .concat([...panel.querySelectorAll("nav > div:first-child, .nav-right > :not(.min-toggle)")]);
    const setHidden = (on) => hideable().forEach((el) => { el.inert = on; });
    const label = () => {
      const min = root.classList.contains("is-minimized");
      btn.setAttribute("aria-label", min ? "Restore page" : "Minimize page");
      btn.setAttribute("aria-pressed", min ? "true" : "false");
    };

    let busy = false;
    btn.addEventListener("click", () => {
      if (busy) return;
      const minimizing = !root.classList.contains("is-minimized");
      if (reduced) {
        root.classList.toggle("is-minimized", minimizing);
        setHidden(minimizing);
        return label();
      }
      busy = true;
      const timing = { duration: 700, easing: "ease-in-out", direction: minimizing ? "normal" : "reverse" };
      if (minimizing) setHidden(true);
      else root.classList.remove("is-minimized"); // the animation takes over the clip from here
      panel.classList.add("is-animating");
      const scan = document.createElement("div");
      scan.className = "min-scan";
      panel.appendChild(scan);
      scan.animate([
        { top: "calc(100% - 2px)", left: "0px", opacity: 0, offset: 0 },
        { top: "calc(100% - 2px)", left: "0px", opacity: 1, offset: 0.06 },
        { top: "42px", left: "0px", opacity: 1, offset: 0.5 },
        { top: "42px", left: "calc(100% - 44px)", opacity: 0, offset: 1 },
      ], timing);
      panel.animate([
        { clipPath: FULL, offset: 0 },
        { clipPath: STRIP, offset: 0.5 },
        { clipPath: TILE, offset: 1 },
      ], timing).onfinish = () => {
        scan.remove();
        panel.classList.remove("is-animating");
        if (minimizing) root.classList.add("is-minimized");
        else setHidden(false);
        busy = false;
        label();
      };
    });
    label();
  })();

  // A sparse field of ASCII stars filling the window. The panel just sits on top of it;
  // the sky never changes with the page, minimizing, or navigation, only a window resize
  // redraws it. Each star twinkles on its own cycle.
  (() => {
    const sky = document.querySelector(".sky");
    if (!sky) return;
    const glyphs = [".", ".", ".", "'", "+", "*"];
    const tints = ["", "", "", "", "t-bright", "t-yellow", "t-cyan", "t-violet"];
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const PX_PER_STAR = 28500; // lower = denser

    const build = () => {
      sky.textContent = "";
      const w = document.documentElement.clientWidth, h = innerHeight;
      const count = Math.round((w * h) / PX_PER_STAR);
      for (let i = 0; i < count; i++) {
        const star = document.createElement("span");
        star.className = ("star " + pick(tints)).trim();
        star.textContent = pick(glyphs);
        star.style.left = (Math.random() * (w - 10)).toFixed(0) + "px";
        star.style.top = (Math.random() * (h - 16)).toFixed(0) + "px";
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

  // Page transitions: links within the site swap just the panel's content instead of
  // loading a new page, so the sky, moon, clouds and any event in flight carry on as if
  // live. The old content fades out, the panel eases to the new content's height, and
  // the new content fades in. Anything unexpected falls back to a normal page load.
  (() => {
    const panel = document.querySelector(".container");
    const nav = panel && panel.querySelector("nav");
    const page = panel && panel.querySelector(".page");
    if (!page || !nav || !window.fetch || !window.DOMParser || !history.pushState) return;
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Loaded normally: the admin page runs its own check; feeds and files aren't pages.
    const NORMAL_LOAD = (p) => p.startsWith("/admin") || p.startsWith("/assets/") || /[.](xml|png|jpe?g|gif|webp|svg|pdf|zip|txt)$/i.test(p);
    const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

    // Fade the current content out; it stays hidden until the new content replaces it.
    let fading = null;
    const fadeOut = () => {
      if (reduced || !page.childElementCount) return Promise.resolve();
      fading = page.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: "ease-in", fill: "forwards" });
      return fading.finished.catch(() => {});
    };
    // Ease the panel from its old height to the new one, and fade the new content in.
    const settle = (fromHeight) => {
      if (fading) { fading.cancel(); fading = null; }
      if (reduced) return;
      const toHeight = panel.offsetHeight;
      if (Math.abs(toHeight - fromHeight) > 1) {
        panel.animate([{ height: fromHeight + "px" }, { height: toHeight + "px" }], { duration: 260, easing: EASE });
      }
      if (page.childElementCount) {
        page.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 240, delay: 40, easing: "ease-out", fill: "backwards" });
      }
    };

    let current = location.pathname + location.search, request = null;
    const go = async (url, push) => {
      if (request) request.abort();
      const ctrl = new AbortController();
      request = ctrl;
      let doc;
      try {
        const [res] = await Promise.all([fetch(url, { signal: ctrl.signal }), fadeOut()]);
        if (!(res.headers.get("content-type") || "").includes("text/html")) throw new Error("not a page");
        doc = new DOMParser().parseFromString(await res.text(), "text/html");
        if (!doc.querySelector(".container nav") || !doc.querySelector(".container .page")) throw new Error("not one of our pages");
      } catch (err) {
        if (err.name !== "AbortError") location.href = url;
        return;
      }
      request = null;
      const next = doc.querySelector(".container");
      if (push) history.pushState(null, "", url);
      current = location.pathname + location.search;
      document.title = doc.title;
      const fromHeight = panel.offsetHeight;
      // Swap the content under the nav; the nav itself stays (its buttons stay wired up).
      page.replaceChildren(...[...next.querySelector(".page").childNodes].map((node) => document.importNode(node, true)));
      panel.className = next.className;
      // Mark the current page in the nav the way the server would.
      const marks = new Map([...next.querySelectorAll("nav a[href]")].map((a) => [a.getAttribute("href"), a.getAttribute("aria-current")]));
      nav.querySelectorAll("a[href]").forEach((a) => {
        const mark = marks.get(a.getAttribute("href"));
        if (mark) a.setAttribute("aria-current", mark); else a.removeAttribute("aria-current");
      });
      page.scrollTop = 0;
      settle(fromHeight);
    };

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download") || root.classList.contains("is-minimized")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || NORMAL_LOAD(url.pathname)) return;
      if (url.pathname + url.search === current) { if (!url.hash) event.preventDefault(); return; } // same page
      event.preventDefault();
      go(url.href, true);
    });
    addEventListener("popstate", () => {
      if (location.pathname + location.search !== current) go(location.href, false); // back/forward
    });
  })();

  // Clouds: a few pixel-art clouds drifting left across the sky like the cloud bank, the
  // same in both themes. Each hides the sun or moon as it passes in front.
  // Far clouds are smaller, slower and take a farther cloud-bank color, for depth.
  (() => {
    const layer = document.querySelector(".clouds");
    if (!layer) return;
    const rand = (a, b) => a + Math.random() * (b - a);

    // One cloud's shape, w x h art pixels, scaled up by px with hard edges. Most are puffy
    // all round: big puffs along the top (taller in the middle), smaller ones scalloping the
    // bottom, and an oval core so there are no holes. Now and then one is flat-bottomed: a
    // row of puffs cut off along the bottom edge.
    const shape = (w, h, px, flat) => {
      const puffs = [];
      if (flat) {
        for (let x = h * 0.25; x < w - h * 0.25; ) {
          const t = x / w, r = h * (0.2 + 0.4 * Math.sin(Math.PI * t)) * rand(0.6, 1);
          puffs.push([x, h - r * rand(0.2, 0.5), r]);
          x += r * rand(0.9, 1.3);
        }
      } else {
        const n = Math.max(3, Math.round((w / h) * rand(1.4, 1.9)));
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n, r = h * (0.22 + 0.26 * Math.sin(Math.PI * t)) * rand(0.8, 1.1);
          puffs.push([w * (0.12 + 0.76 * t) + rand(-0.03, 0.03) * w, h * 0.55 - r * rand(0.05, 0.35), r]);
        }
        for (let x = w * 0.22; x < w * 0.78; ) {
          const r = h * rand(0.17, 0.25);
          puffs.push([x, h - r, r]);
          x += r * rand(1.1, 1.5);
        }
      }
      // Shrink any puff that would run off the sides or top, so no edge is cut straight.
      for (const p of puffs) p[2] = Math.min(p[2], p[0] - 0.5, w - p[0] - 0.5, p[1] - 0.5);
      const art = document.createElement("canvas");
      art.width = w; art.height = h;
      const g = art.getContext("2d"), img = g.createImageData(w, h);
      const ex = w / 2, ey = h * 0.55, rx = w * 0.33, ry = h * 0.26;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const ox = (x + 0.5 - ex) / rx, oy = (y + 0.5 - ey) / ry;
          let on = !flat && ox * ox + oy * oy <= 1;
          for (let i = 0; !on && i < puffs.length; i++) {
            const [cx, cy, r] = puffs[i], dx = x + 0.5 - cx, dy = y + 0.5 - cy;
            on = dx * dx + dy * dy <= r * r;
          }
          if (on) img.data[(y * w + x) * 4 + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
      const out = document.createElement("canvas");
      out.width = w * px; out.height = h * px;
      const o = out.getContext("2d");
      o.imageSmoothingEnabled = false;
      o.drawImage(art, 0, 0, out.width, out.height);
      return out.toDataURL();
    };

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pixelSize = () => (innerHeight * 0.26 >= 180 ? 3 : 2); // same pixel size as the cloud bank

    // One cloud, w x h art pixels, colored like cloud-bank layer "tier" (1 far to 3 near).
    const makeCloud = (w, h, px, flat, tier) => {
      const cloud = document.createElement("div");
      cloud.className = "cloud cb-" + tier;
      cloud.dataset.tier = tier;
      const body = document.createElement("div");
      body.className = "cloud-shape";
      const mask = "url(" + shape(w, h, px, flat) + ")";
      body.style.setProperty("-webkit-mask-image", mask);
      body.style.setProperty("mask-image", mask);
      cloud.appendChild(body);
      cloud.style.width = w * px + "px";
      cloud.style.height = h * px + "px";
      return cloud;
    };
    // Adds a cloud in depth order, so nearer clouds pass in front of farther ones.
    const place = (cloud) => {
      const nearer = [...layer.children].find((c) => +c.dataset.tier > +cloud.dataset.tier);
      layer.insertBefore(cloud, nearer || null);
    };

    // The regular clouds: at most one per depth layer (far, middle, near), 2 on narrow windows
    // and 3 on wide ones. Visiting characters (below) don't count toward them.
    const build = () => {
      layer.querySelectorAll(".cloud:not(.cloud-character)").forEach((c) => c.remove());
      const vw = document.documentElement.clientWidth, px = pixelSize();
      const LAYERS = [[1, 0, 0.4], [2, 0.4, 0.75], [3, 0.75, 1]]; // [color layer, depth range]; depth 0 = far, 1 = near
      const count = vw >= 1250 ? 3 : 2;
      const picks = LAYERS.slice().sort(() => Math.random() - 0.5).slice(0, count);
      for (const [tier, lo, hi] of picks) {
        const depth = rand(lo, hi);
        const flat = Math.random() < 0.2; // about 1 in 5 has a flat bottom
        const w = Math.round(rand(26, 40) + depth * 34), h = Math.round(w * (flat ? rand(0.32, 0.42) : rand(0.45, 0.55)));
        const cloud = makeCloud(w, h, px, flat, tier);
        cloud.style.top = (innerHeight * (0.03 + Math.random() * 0.55)).toFixed(0) + "px";
        const duration = (vw + w * px) / (4 + depth * 8); // far clouds drift slower
        cloud.style.animationDuration = duration.toFixed(0) + "s";
        cloud.style.animationDelay = (-Math.random() * duration).toFixed(0) + "s"; // already mid-drift
        if (still) cloud.style.left = (Math.random() * (vw - w * px)).toFixed(0) + "px";
        place(cloud);
      }
    };
    build(); // a theme switch just recolors them (in CSS), so they carry on undisturbed
    let resizeTimer;
    addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 300); });

    // Characters: one-of-a-kind clouds that visit now and then. One drifts across the sky
    // once, at its depth's speed, then leaves; a few minutes later another (or the same one)
    // comes by. Each character has a depth layer, makes its cloud, and can start something
    // while it's visiting (returning a function that stops it). Add new ones to CHARACTERS.
    const VISIT_GAP = [120000, 300000]; // ms between one visit ending and the next starting

    // A tiny ( ˘ ω ˘ ) on the same pixel grid as the cloud: two closed, content eyes either
    // side of an ω mouth, centered on the cloud's body.
    const FACE = [[0, 0], [1, 1], [2, 1], [3, 0], [6, 1], [7, 2], [8, 1], [9, 2], [10, 1], [13, 0], [14, 1], [15, 1], [16, 0]]; // [x, y] art pixels
    const face = (w, h, px) => {
      const el = document.createElement("div");
      el.className = "cloud-face";
      el.style.left = (Math.round(w / 2 - 8.5) * px) + "px";
      el.style.top = (Math.round(h * 0.55 - 1.5) * px) + "px";
      el.innerHTML = '<svg viewBox="0 0 17 3" width="' + 17 * px + '" height="' + 3 * px + '" shape-rendering="crispEdges">' +
        FACE.map(([x, y]) => '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>').join("") + "</svg>";
      return el;
    };

    // A thought bubble over the cloud: fades in, its Zs trade capitals a few times, and it
    // fades away. Skipped while the cloud is off screen or too near the top to fit it.
    const SNORES = ["ZzZ...zZz", "zZz...ZzZ"], FLIPS = 5, FLIP_MS = 650;
    const snore = (cloud) => {
      const r = cloud.getBoundingClientRect();
      if (document.hidden || r.left < 0 || r.right > innerWidth - 60 || r.top < 36) return;
      const box = document.createElement("div");
      box.className = "cloud-bubble";
      box.textContent = SNORES[0];
      cloud.appendChild(box);
      let n = 0;
      const flip = setInterval(() => { box.textContent = SNORES[++n % 2]; if (n >= FLIPS) clearInterval(flip); }, FLIP_MS);
      box.animate([
        { opacity: 0, transform: "translateY(4px)" },
        { opacity: 1, transform: "none", offset: 0.12 },
        { opacity: 1, transform: "none", offset: 0.88 },
        { opacity: 0, transform: "translateY(-3px)" },
      ], { duration: 600 + FLIPS * FLIP_MS + 900, easing: "ease-out" }).onfinish = () => { clearInterval(flip); box.remove(); };
    };

    const CHARACTERS = [
      // Sleepy_Cloud: a puffy middle-distance cloud with a ( ˘ ω ˘ ) face who dreams in a
      // thought bubble every 15-25s while he's passing through.
      { name: "Sleepy_Cloud", tier: 2, depth: 0.6,
        make: (px) => {
          const w = Math.round(rand(48, 56)), h = Math.round(w * rand(0.46, 0.52));
          const cloud = makeCloud(w, h, px, false, 2);
          cloud.appendChild(face(w, h, px));
          return cloud;
        },
        visit: (cloud, preview) => {
          let timer = setTimeout(function dream() { snore(cloud); timer = setTimeout(dream, rand(15000, 25000)); }, preview ? 1500 : rand(5000, 9000));
          return () => clearTimeout(timer);
        } },
      // Sky_Whale: a distant whale who treats the cloud bank as his sea: he surfaces, cruises
      // along the cloud tops spouting, then breaches and dives back under. He moves himself
      // (run), rather than crossing like a cloud.
      { name: "Sky_Whale", run: (done) => swim(done) },
    ];

    // Sky_Whale's sprite, facing left, in two frames (tail up, tail down) swapped as he
    // swims: B body, L belly, F flipper, E eye, S pale spots.
    const WHALE = [
      ["......BBBBBBBB...........BB.BB",
       "....BBBBBBBBBBBB..........BBB.",
       "...BBBBBSBBBBBBBBB........BB..",
       "..BBBBBBBBBBBSBBBBBB.....BB...",
       "..BBEBBBBBBBBBBBBBBBBBBBBB....",
       ".BBBBBBBBBBBBBBBBBBBBBBBB.....",
       ".LLLBBBBBBBBBBBBBBBBBBBB......",
       ".LLLLLLBBBBBBBBBBBBBBBB.......",
       "..LLLLLLLLLBBBBFFBBBB.........",
       "...LLLLLLLLLLLLLFFF...........",
       ".....LLLLLLLLLL..FF..........."],
      ["......BBBBBBBB................",
       "....BBBBBBBBBBBB..............",
       "...BBBBBSBBBBBBBBB............",
       "..BBBBBBBBBBBSBBBBBB..........",
       "..BBEBBBBBBBBBBBBBBBBBBB...BB.",
       ".BBBBBBBBBBBBBBBBBBBBBBBBBBB..",
       ".LLLBBBBBBBBBBBBBBBBBBBBBBBBB.",
       ".LLLLLLBBBBBBBBBBBBBBBB....BB.",
       "..LLLLLLLLLBBBBFFBBBB.........",
       "...LLLLLLLLLLLLLFFF...........",
       ".....LLLLLLLLLL..FF..........."],
    ];
    const whaleSprite = (px) => {
      const cols = WHALE[0][0].length, rows = WHALE[0].length;
      const frame = (lines, cls) => '<g class="' + cls + '">' + lines.map((line, y) => [...line].map((c, x) =>
        c === "." ? "" : '<rect class="w' + c + '" x="' + x + '" y="' + y + '" width="1" height="1"/>').join("")).join("") + "</g>";
      return { w: cols * px, h: rows * px,
        html: '<svg viewBox="0 0 ' + cols + " " + rows + '" width="' + cols * px + '" height="' + rows * px + '" shape-rendering="crispEdges">' + frame(WHALE[0], "wf-a") + frame(WHALE[1], "wf-b") + "</svg>" };
    };

    // His swim is one animation along a path in three parts:
    //   surface: he rises from below the cloud bank (behind all but its farthest layer) to
    //            cruising depth, where only his back shows above that layer's cloud tops;
    //   cruise:  he swims slowly along, bobbing in and out of the clouds, and spouts twice;
    //   breach:  he arcs up out of the clouds to about mid-sky, then dives nose first back
    //            under, out of sight.
    // He tilts with his path, and puffs of cloud splash up wherever he breaks the surface.
    const SURFACE_MS = 7000, BREACH_MS = 22000, CRUISE_SPEED = 10, FLAP_MS = 900, TILT = 50; // CRUISE_SPEED in px/s
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    // A small burst of pixel puffs (in cloud-bank layer "tier"'s color) from around x, y:
    // each flies up by rise px (spread sideways by spread px), then falls back a little as it fades.
    const burst = (bank, before, tier, x, y, count, spread, rise, px) => {
      for (let n = 0; n < count; n++) {
        const puff = document.createElement("div"), size = px * pick([1, 1, 2, 2, 3]);
        puff.className = "whale-puff cb-" + tier;
        puff.style.width = puff.style.height = size + "px";
        bank.insertBefore(puff, before);
        const sx = x + rand(-0.3, 0.3) * spread, ex = x + rand(-1, 1) * spread, top = y - rise * rand(0.5, 1);
        const at = (px2, py) => "translate(" + px2.toFixed(0) + "px, " + py.toFixed(0) + "px)";
        puff.animate([
          { transform: at(sx, y), opacity: 1 },
          { transform: at((sx + ex) / 2, top), opacity: 0.9, offset: 0.55 },
          { transform: at(ex, top + rise * 0.3), opacity: 0 },
        ], { duration: rand(1500, 2600), delay: n * rand(20, 60), easing: "ease-out", fill: "backwards" }).onfinish = () => puff.remove();
      }
    };
    const swim = (done) => {
      const bank = document.querySelector(".cloudbank"), cover = bank && bank.querySelector(".cb-1"), front = bank && bank.querySelector(".cb-2");
      if (!cover) return done();
      const vw = document.documentElement.clientWidth, ih = innerHeight, px = pixelSize();
      const sprite = whaleSprite(px);
      const whale = document.createElement("div");
      whale.className = "whale";
      whale.innerHTML = sprite.html;
      bank.insertBefore(whale, cover);

      const top = cover.getBoundingClientRect().top, depth = cover.offsetHeight; // that layer's cloud tops are about 30% of the way down it
      const cruiseY = top + depth * 0.2 + sprite.h / 2; // his center while cruising: just his back shows
      const startY = ih + sprite.h, peakY = ih * rand(0.38, 0.5), endY = ih + sprite.h * 2;
      const dir = Math.random() < 0.5 ? -1 : 1; // 1 swims right, -1 left (the sprite faces left)
      const x0 = dir > 0 ? vw * rand(0.08, 0.3) : vw * rand(0.7, 0.92);
      const cruiseDist = vw * rand(0.3, 0.4), breachDist = vw * rand(0.22, 0.3);
      const xs = x0 + dir * vw * 0.04, x1 = xs + dir * cruiseDist, x2 = x1 + dir * breachDist;
      const CRUISE_MS = (cruiseDist / CRUISE_SPEED) * 1000, total = SURFACE_MS + CRUISE_MS + BREACH_MS;

      // The breach is a lob, y = cruiseY + (endY - cruiseY) u - 4 A u (1 - u), with A found so
      // its highest point is peakY.
      const lob = (A, u) => cruiseY + (endY - cruiseY) * u - 4 * A * u * (1 - u);
      let lo = 0, hi = ih * 4;
      for (let i = 0; i < 40; i++) { const A = (lo + hi) / 2; let min = Infinity; for (let u = 0; u <= 1; u += 0.01) min = Math.min(min, lob(A, u)); if (min > peakY) lo = A; else hi = A; }
      const A = (lo + hi) / 2;
      const at = (ms) => {
        if (ms < SURFACE_MS) { const u = ms / SURFACE_MS; return [x0 + (xs - x0) * u, startY + (cruiseY - startY) * (1 - (1 - u) * (1 - u))]; }
        ms -= SURFACE_MS;
        if (ms < CRUISE_MS) { const u = ms / CRUISE_MS; return [xs + (x1 - xs) * u, cruiseY + Math.sin(u * Math.PI * 6) * 5]; }
        const u = Math.min(1, (ms - CRUISE_MS) / BREACH_MS);
        return [x1 + (x2 - x1) * u, lob(A, u)];
      };
      const heading = (ms) => { const [ax, ay] = at(Math.max(0, ms - 400)), [bx, by] = at(Math.min(total, ms + 400)); return [bx - ax, by - ay]; };

      const frames = [], steps = Math.ceil(total / 250);
      for (let i = 0; i <= steps; i++) {
        const ms = (total * i) / steps, [x, y] = at(ms), [dx, dy] = heading(ms);
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI; // direction of travel
        if (dir < 0) angle = ((angle + 360) % 360) - 180; // the sprite faces left
        const tilt = Math.max(-TILT, Math.min(TILT, angle));
        frames.push({ offset: ms / total, transform: "translate(" + (x - sprite.w / 2).toFixed(1) + "px, " + (y - sprite.h / 2).toFixed(1) + "px) rotate(" + tilt.toFixed(1) + "deg)" + (dir > 0 ? " scaleX(-1)" : "") });
      }
      const path = whale.animate(frames, { duration: total, easing: "linear" });
      const flap = setInterval(() => whale.classList.toggle("flap"), FLAP_MS);

      // Spouts: a little fountain of vapor from his blowhole (top of the head), twice while cruising.
      const spout = () => {
        if (document.hidden) return;
        const [x, y] = at(path.currentTime || 0);
        burst(bank, front, 3, x + dir * 6.5 * px, y - sprite.h / 2, 14, 10, rand(26, 40), px);
      };
      const spouts = [0.3, 0.7].map((f) => setTimeout(spout, SURFACE_MS + CRUISE_MS * (f + rand(-0.08, 0.08))));
      // Splashes: whenever he's crossing the cloud tops steeply (coming up or diving in).
      // (The cloud tops are measured each time, in case the window has changed size since.)
      const splash = setInterval(() => {
        if (document.hidden || !cover.isConnected) return;
        const ms = path.currentTime || 0, [x, y] = at(ms), [dx, dy] = heading(ms);
        const tops = cover.getBoundingClientRect().top + cover.offsetHeight * 0.3;
        if (Math.abs(dy) > 0.45 * Math.hypot(dx, dy) && Math.abs(y - tops) < sprite.h * 0.6) burst(bank, cover, 1, x, tops, 3, sprite.w * 0.6, rand(16, 36), px);
      }, 200);

      path.onfinish = () => { clearInterval(flap); clearInterval(splash); spouts.forEach(clearTimeout); whale.remove(); done(); };
    };

    // Picks a visitor (a character marked night: true only comes at night) and sends it
    // across. preview names one
    // to show right away (the #snore and #whale links), starting a cloud a third of the way in.
    const isNight = () => document.documentElement.dataset.theme !== "light";
    const visit = (preview) => {
      const next = () => setTimeout(visit, rand(VISIT_GAP[0], VISIT_GAP[1]));
      const pool = preview ? CHARACTERS.filter((c) => c.name === preview) : CHARACTERS.filter((c) => !c.night || isNight());
      const who = pool[Math.floor(Math.random() * pool.length)];
      if (!who) return next();
      if (who.run) return who.run(next);
      const cloud = who.make(pixelSize());
      cloud.classList.add("cloud-character");
      cloud.dataset.character = who.name;
      cloud.style.animation = "none"; // it crosses once, below, instead of looping
      cloud.style.top = (innerHeight * rand(0.1, 0.5)).toFixed(0) + "px";
      place(cloud);
      const travel = document.documentElement.clientWidth + cloud.offsetWidth;
      const crossing = cloud.animate([{ transform: "translateX(0px)" }, { transform: "translateX(" + -travel + "px)" }],
        { duration: (travel / (4 + who.depth * 8)) * 1000, easing: "linear" });
      if (preview) crossing.currentTime = crossing.effect.getTiming().duration * 0.35;
      const stop = who.visit ? who.visit(cloud, preview) : () => {};
      crossing.onfinish = () => { stop(); cloud.remove(); next(); };
    };
    const PREVIEWS = { "#snore": "Sleepy_Cloud", "#whale": "Sky_Whale" };
    if (!still) {
      if (PREVIEWS[location.hash]) setTimeout(() => visit(PREVIEWS[location.hash]), 300); // once the cloud bank (below) is built
      else setTimeout(visit, rand(20000, 60000)); // the first visitor shows up within a minute
    }
  })();

  // Cloud bank: four layers of pixel-art clouds along the bottom of the window, after the
  // ending of Cave Story. Each layer scrolls left, the front fastest and the back slowest,
  // for depth. A layer's shape is drawn once as a seamless tile and used as a CSS mask, so
  // its color comes from the theme and a theme switch needs no redraw.
  (() => {
    const bank = document.querySelector(".cloudbank");
    if (!bank) return;
    // Back to front: height (fraction of the bank), tile width (art pixels), speed (px/s).
    const LAYERS = [
      { height: 1, width: 230, speed: 10 },
      { height: 0.78, width: 270, speed: 17 },
      { height: 0.58, width: 310, speed: 26 },
      { height: 0.4, width: 350, speed: 40 },
    ];
    const rand = (a, b) => a + Math.random() * (b - a);
    const bandHeight = () => Math.round(Math.min(260, Math.max(110, innerHeight * 0.26)));

    // One layer's silhouette, w x h art pixels, scaled up by px with hard edges: a solid
    // base with round puffs along its top (now and then a big one). Distances wrap around
    // the tile, so its ends join seamlessly. Returns the mask image and the height of the
    // top edge in each column (for the signature to ride on).
    const tile = (w, h, px) => {
      const puffs = [];
      for (let x = 0; x < w; ) {
        const r = (Math.random() < 0.15 ? rand(0.4, 0.48) : rand(0.18, 0.34)) * h;
        puffs.push([x, Math.max(r, h * rand(0.5, 0.65)), r]);
        x += r * rand(0.6, 1.1);
      }
      const base = Math.round(h * 0.62);
      const art = document.createElement("canvas");
      art.width = w; art.height = h;
      const g = art.getContext("2d"), img = g.createImageData(w, h), tops = new Array(w).fill(h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let on = y >= base;
          for (let i = 0; !on && i < puffs.length; i++) {
            const [cx, cy, r] = puffs[i];
            let dx = Math.abs(x + 0.5 - cx);
            dx = Math.min(dx, w - dx);
            const dy = y + 0.5 - cy;
            on = dx * dx + dy * dy <= r * r;
          }
          if (on) {
            img.data[(y * w + x) * 4 + 3] = 255;
            if (y < tops[x]) tops[x] = y;
          }
        }
      }
      g.putImageData(img, 0, 0);
      const out = document.createElement("canvas");
      out.width = w * px; out.height = h * px;
      const o = out.getContext("2d");
      o.imageSmoothingEnabled = false;
      o.drawImage(art, 0, 0, out.width, out.height);
      return { url: out.toDataURL(), tops };
    };

    let built = 0, front = null;
    const build = () => {
      const band = built = bandHeight(), px = band >= 180 ? 3 : 2;
      bank.textContent = "";
      LAYERS.forEach((layer, i) => {
        const h = Math.round((band * layer.height) / px), tw = layer.width * px, th = h * px;
        const art = tile(layer.width, h, px);
        const mask = "url(" + art.url + ")", size = tw + "px " + th + "px";
        const duration = tw / layer.speed;
        const el = document.createElement("div");
        el.className = "cb-layer cb-" + i;
        el.style.height = th + "px";
        el.style.setProperty("--tile", tw + "px");
        el.style.setProperty("-webkit-mask-image", mask);
        el.style.setProperty("mask-image", mask);
        el.style.setProperty("-webkit-mask-size", size);
        el.style.setProperty("mask-size", size);
        el.style.animationDuration = duration.toFixed(1) + "s";
        el.style.animationDelay = (-Math.random() * duration).toFixed(1) + "s";
        bank.appendChild(el);
        if (i === LAYERS.length - 1) front = { el, tops: art.tops, px, tw, th };
      });
    };
    build();

    // Signature: each letter of the name floats just under the front layer's surface, so as
    // the cloud tops scroll by beneath it the name bobs up and down with them. The surface
    // is averaged over a stretch around each letter so the bobbing reads as gentle swells.
    const sig = document.querySelector(".signature");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let letters = [], rest = [], cur = [];
    if (sig) {
      letters = [...sig.textContent].map((ch) => {
        const span = document.createElement("span");
        span.textContent = ch;
        return span;
      });
      sig.replaceChildren(...letters);
    }
    // Where each letter sits untouched (its offsets are measured from there), and its offset
    // in the name, which lines up its slice of the gradient.
    const measure = () => {
      letters.forEach((s) => { s.style.transform = ""; s.style.setProperty("--x", s.offsetLeft + "px"); });
      rest = letters.map((s) => { const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, w: r.width, top: r.top, h: r.height }; });
      cur = rest.map(() => null);
    };
    // On top of that, a slight, slow wave runs along the name. Each letter is kept inside the
    // cloud: never above the surface right over it, never below the window's edge.
    const DEPTH = 12, REACH = 36, EASE = 0.06; // px under the surface, px averaged either side, smoothing per frame
    const WAVE = 3, WAVE_PERIOD = 6, WAVE_STEP = 0.5; // px high, seconds per swell, phase between letters
    const tick = (now) => {
      const anim = front && front.el.getAnimations()[0];
      if (anim && rest.length) {
        const { tops, px, tw, th } = front;
        const offset = (anim.effect.getComputedTiming().progress || 0) * tw;
        const phase = ((now / 1000) * 2 * Math.PI) / WAVE_PERIOD;
        // Viewport y of the front layer's top edge at screen x.
        const surface = (x) => innerHeight - th + tops[Math.floor(((((x + offset) % tw) + tw) % tw) / px)] * px;
        letters.forEach((s, i) => {
          const r = rest[i];
          let y = 0;
          for (let k = -2; k <= 2; k++) y += surface(r.x + (k * REACH) / 2);
          const local = Math.max(surface(r.x - r.w / 2), surface(r.x), surface(r.x + r.w / 2)); // lowest point of the surface over the letter
          const top = Math.max(y / 5 + DEPTH + WAVE * Math.sin(phase + i * WAVE_STEP), local + 2);
          const target = Math.min(top, innerHeight - 6 - r.h) - r.top;
          cur[i] = cur[i] === null ? target : cur[i] + (target - cur[i]) * EASE;
          s.style.transform = "translateY(" + cur[i].toFixed(1) + "px)";
        });
      }
      requestAnimationFrame(tick);
    };
    if (sig) {
      measure();
      if (document.fonts) document.fonts.ready.then(measure); // the name's font loads after the page
      if (!still) requestAnimationFrame(tick);
    }

    let resizeTimer;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (bandHeight() !== built) build();
        if (sig) measure();
      }, 300);
    });
  })();

  // Constellations: every 20-40s one fades in somewhere in the sky, drawn from real star
  // positions so the shapes are true to the sky.
  (() => {
    const sky = document.querySelector(".sky");
    if (!sky || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Stars: [right ascension (hours), declination (degrees), magnitude, color?]
    // Lines: pairs of star indexes.
    const SKY = [
      { name: "Orion", // Betelgeuse, Bellatrix, Meissa, Alnitak, Alnilam, Mintaka, Saiph, Rigel
        stars: [[5.919, 7.41, 0.5, "orange"], [5.419, 6.35, 1.6], [5.585, 9.93, 3.4], [5.679, -1.94, 1.8], [5.604, -1.20, 1.7], [5.533, -0.30, 2.2], [5.796, -9.67, 2.1], [5.242, -8.20, 0.1, "blue"]],
        lines: [[0, 2], [2, 1], [0, 3], [1, 5], [3, 4], [4, 5], [3, 6], [5, 7]] },
      { name: "Big Dipper", // Dubhe, Merak, Phecda, Megrez, Alioth, Mizar, Alkaid
        stars: [[11.062, 61.75, 1.8], [11.031, 56.38, 2.4], [11.897, 53.69, 2.4], [12.257, 57.03, 3.3], [12.900, 55.96, 1.8], [13.399, 54.93, 2.2], [13.792, 49.31, 1.9]],
        lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
      { name: "Little Dipper", // Polaris, Yildun, Epsilon, Zeta, Eta, Pherkad, Kochab
        stars: [[2.530, 89.26, 2.0, "yellow"], [17.537, 86.59, 4.4], [16.766, 82.04, 4.2], [15.734, 77.79, 4.3], [16.292, 75.76, 5.0], [15.345, 71.83, 3.0], [14.845, 74.16, 2.1]],
        lines: [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 3]] },
      { name: "Gemini", // Castor, Pollux, Alhena, Mebsuta, Tejat, Propus, Wasat, Mekbuda, Tau, Theta, Iota, Nu, Lambda, Xi
        stars: [[7.577, 31.89, 1.6], [7.755, 28.03, 1.1, "yellow"], [6.628, 16.40, 1.9], [6.732, 25.13, 3.0], [6.383, 22.51, 2.9], [6.248, 22.51, 3.3], [7.335, 21.98, 3.5], [7.068, 20.57, 3.9], [7.186, 30.25, 4.4], [6.879, 33.96, 3.6], [7.428, 27.80, 3.8], [6.483, 20.21, 4.1], [7.301, 16.54, 3.6], [6.755, 12.90, 3.4]],
        lines: [[0, 8], [8, 9], [8, 3], [3, 4], [4, 5], [3, 11], [8, 10], [10, 1], [10, 6], [6, 7], [7, 2], [6, 12], [12, 13]] },
      { name: "Libra", // Zubenelgenubi, Zubeneschamali (the "green" star), Zubenelhakrabi, Brachium, Upsilon, Tau
        stars: [[14.848, -16.04, 2.8], [15.283, -9.38, 2.6, "green"], [15.592, -14.79, 3.9], [15.068, -25.28, 3.3], [15.617, -28.14, 3.6], [15.644, -29.78, 3.7]],
        lines: [[0, 1], [1, 2], [2, 0], [0, 3], [2, 4], [4, 5]] },
      { name: "Virgo", // Spica (blue-white), Porrima, Vindemiatrix, Zaniah, Zavijava, Minelauva, Heze, Syrma, Kang, Khambalia, Mu, Theta, Nu
        stars: [[13.420, -11.16, 1.0, "blue"], [12.694, -1.45, 2.7], [13.036, 10.96, 2.8], [12.332, -0.67, 3.9], [11.845, 1.76, 3.6], [12.927, 3.40, 3.4], [13.578, -0.60, 3.4], [14.267, -6.00, 4.1], [14.215, -10.27, 4.2], [14.318, -13.37, 4.5], [14.718, -5.66, 3.9], [13.166, -5.54, 4.4], [11.764, 6.53, 4.0]],
        lines: [[12, 4], [4, 3], [3, 1], [1, 5], [5, 2], [1, 11], [11, 0], [5, 6], [6, 0], [6, 7], [7, 10], [0, 8], [8, 9]] },
      { name: "Cassiopeia", // Caph, Schedar, Navi, Ruchbah, Segin
        stars: [[0.153, 59.15, 2.3], [0.675, 56.54, 2.2], [0.945, 60.72, 2.2], [1.430, 60.24, 2.7], [1.907, 63.67, 3.4]],
        lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
      { name: "Cygnus", // Deneb, Sadr, Albireo, Gienah, Delta
        stars: [[20.690, 45.28, 1.3], [20.370, 40.26, 2.2], [19.512, 27.96, 3.1, "yellow"], [20.770, 33.97, 2.5], [19.750, 45.13, 2.9]],
        lines: [[0, 1], [1, 2], [4, 1], [1, 3]] },
    ];

    // Gnomonic projection around the constellation's center, as seen looking up
    // (north up, east left). Returns points in degrees with the top-left at 0,0.
    const project = (stars) => {
      const rad = Math.PI / 180;
      const vec = stars.map((s) => {
        const ra = s[0] * 15 * rad, dec = s[1] * rad;
        return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
      });
      const c = vec.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]);
      const ra0 = Math.atan2(c[1], c[0]), dec0 = Math.asin(c[2] / Math.hypot(c[0], c[1], c[2]));
      const pts = stars.map((s) => {
        const ra = s[0] * 15 * rad, dec = s[1] * rad, d = ra - ra0;
        const k = Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(d);
        const x = Math.cos(dec) * Math.sin(d) / k;
        const y = (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(d)) / k;
        return [-x / rad, -y / rad];
      });
      const minX = Math.min(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1]));
      return pts.map((p) => [p[0] - minX, p[1] - minY]);
    };

    const glyphFor = (mag) => (mag < 1 ? ["*", 16] : mag < 2.5 ? ["*", 13] : mag < 3.6 ? ["+", 11] : [".", 13]);
    const SVG = "http://www.w3.org/2000/svg";
    const PAD = 10; // keep glyphs inside the group's box

    // Cycle through a shuffled order so every constellation appears before any repeats.
    let queue = [];
    const next = () => {
      if (!queue.length) queue = SKY.slice().sort(() => Math.random() - 0.5);
      return queue.pop();
    };

    const show = () => {
      if (document.hidden || document.documentElement.dataset.theme === "light") return schedule(); // night only
      const con = next();
      const pts = project(con.stars);
      const spanX = Math.max(...pts.map((p) => p[0])), spanY = Math.max(...pts.map((p) => p[1]));
      const w = document.documentElement.clientWidth;
      const top = 8, bottom = innerHeight - 8;

      // Largest scale (px per degree) that fits in the window.
      for (const scale of [9, 8, 7, 6, 5]) {
        const gw = spanX * scale + PAD * 2, gh = spanY * scale + PAD * 2;
        if (gh > bottom - top) continue;
        if (gw > w - 16) continue;
        const x = 8 + Math.random() * (w - gw - 16);
        const y = top + Math.random() * (bottom - top - gh);
        draw(con, pts, scale, x, y, gw, gh);
        return schedule();
      }
      schedule(); // too big for this window at any scale; try another later
    };

    const draw = (con, pts, scale, x, y, gw, gh) => {
      const g = document.createElement("div");
      g.className = "constellation";
      g.setAttribute("aria-hidden", "true");
      g.style.left = x.toFixed(0) + "px";
      g.style.top = y.toFixed(0) + "px";
      g.style.width = gw.toFixed(0) + "px";
      g.style.height = gh.toFixed(0) + "px";
      const at = (p) => [PAD + p[0] * scale, PAD + p[1] * scale];
      const svg = document.createElementNS(SVG, "svg");
      for (const [a, b] of con.lines) {
        const line = document.createElementNS(SVG, "line");
        const [x1, y1] = at(pts[a]), [x2, y2] = at(pts[b]);
        line.setAttribute("x1", x1); line.setAttribute("y1", y1);
        line.setAttribute("x2", x2); line.setAttribute("y2", y2);
        svg.appendChild(line);
      }
      g.appendChild(svg);
      con.stars.forEach((s, i) => {
        const [glyph, size] = glyphFor(s[2]);
        const star = document.createElement("span");
        star.className = "cs" + (s[3] ? " c-" + s[3] : "");
        star.textContent = glyph;
        star.style.fontSize = size + "px";
        const [sx, sy] = at(pts[i]);
        star.style.left = sx.toFixed(1) + "px";
        star.style.top = sy.toFixed(1) + "px";
        g.appendChild(star);
      });
      g.addEventListener("animationend", () => g.remove());
      sky.appendChild(g);
    };

    let timer;
    const schedule = (delay) => { clearTimeout(timer); timer = setTimeout(show, delay == null ? 20000 + Math.random() * 20000 : delay); };
    schedule(5000 + Math.random() * 5000); // first one shortly after load
  })();

  // Rare sky events (night) and daytime events (light theme). One plays at a time: roughly
  // every 20s the sky rolls the dice.
  // Add #sky to the page URL to see each event in turn; #sky-newyear and #sky-bloodmoon
  // preview the holidays.
  (() => {
    const sky = document.querySelector(".sky");
    if (!sky) return;
    const root = document.documentElement;
    const hash = location.hash;

    // Chance of each event per check (about every 20s). Set one to 0 to turn it off.
    const SKY_EVENTS = { meteor: 0.35, satellite: 0.30, plane: 0.12, supernova: 0.05, comet: 0.05 };
    // Date-based extras.
    const HOLIDAYS = { meteorShowers: true, newYearFireworks: true, bloodMoon: true };

    const now = new Date();
    const md = (now.getMonth() + 1) * 100 + now.getDate(); // local month+day, e.g. 812 = Aug 12
    // Peak nights of the major annual meteor showers: Quadrantids, Lyrids, Eta Aquariids,
    // Perseids, Orionids, Leonids, Geminids.
    const SHOWERS = [[102, 104], [421, 423], [505, 507], [811, 813], [1020, 1022], [1116, 1118], [1213, 1215]];
    const shower = HOLIDAYS.meteorShowers && SHOWERS.some(([a, b]) => md >= a && md <= b);
    const newYear = HOLIDAYS.newYearFireworks && ([1230, 1231, 101].includes(md) || hash === "#sky-newyear"); // Dec 30 - Jan 1
    // Total and partial lunar eclipses (UTC date of greatest eclipse).
    const ECLIPSES = ["2026-03-03", "2026-08-28", "2028-01-12", "2028-07-06", "2028-12-31", "2029-06-26", "2029-12-20", "2030-06-15", "2032-04-25", "2032-10-18", "2033-04-14", "2033-10-08"];
    if (HOLIDAYS.bloodMoon && (ECLIPSES.includes(now.toISOString().slice(0, 10)) || hash === "#sky-bloodmoon")) {
      root.classList.add("sky-blood-moon"); // the moon toggle turns red (see .sky-blood-moon in site.css)
      const moon = document.querySelector(".moon-toggle");
      const phase = moon && moon.querySelector(".moon-phase");
      if (phase) phase.textContent = "Lunar eclipse · blood moon";
    }

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; // the moving events are off
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    // The window, which is the whole sky.
    const view = () => ({ w: root.clientWidth, top: 0, bottom: innerHeight });
    const add = (cls, x, y, html) => {
      const el = document.createElement("div");
      el.className = cls;
      el.setAttribute("aria-hidden", "true");
      el.style.left = x.toFixed(0) + "px";
      el.style.top = y.toFixed(0) + "px";
      if (html) el.innerHTML = html;
      sky.appendChild(el);
      return el;
    };
    // A random spot in the upper topShare of the sky.
    const randomSpot = (v, topShare) => [rand(20, v.w - 20), rand(v.top + 20, v.top + (v.bottom - v.top) * topShare)];

    // Shooting star: a quick, bright streak. During a meteor shower they fan out from the
    // shower's radiant (a fixed point for this page view) and arrive in small bursts.
    const radiant = { x: rand(0.2, 0.8) * root.clientWidth, y: rand(0.05, 0.3) * innerHeight };
    const meteor = (fromRadiant) => {
      const v = view();
      let x, y, angle;
      if (fromRadiant) {
        angle = rand(0, 2 * Math.PI);
        const d = rand(40, 260);
        x = radiant.x + Math.cos(angle) * d;
        y = radiant.y + Math.sin(angle) * d;
      } else {
        x = rand(0.1, 0.9) * v.w;
        y = rand(v.top + 20, v.top + (v.bottom - v.top) * 0.5);
        angle = (Math.random() < 0.5 ? rand(15, 50) : rand(130, 165)) * Math.PI / 180; // falling left or right
      }
      const m = add("meteor", x, y);
      const rot = "rotate(" + (angle * 180 / Math.PI).toFixed(1) + "deg)";
      m.animate([
        { transform: rot + " translateX(0px)", opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: rot + " translateX(" + rand(160, 320).toFixed(0) + "px)", opacity: 0 },
      ], { duration: rand(600, 1000), easing: "ease-in" }).onfinish = () => m.remove();
    };
    const meteors = (done) => {
      if (!shower) { meteor(false); return setTimeout(done, 1200); }
      let left = Math.floor(rand(2, 5));
      const next = () => { meteor(true); if (--left > 0) setTimeout(next, rand(250, 900)); else setTimeout(done, 1200); };
      next();
    };

    // Satellite: a steady dot crossing in a straight line. Now and then it catches the sun
    // and flares brightly for a moment (an "Iridium flare").
    const satellite = (done, forceFlare) => {
      const v = view(), h = v.bottom - v.top;
      const leftToRight = Math.random() < 0.5;
      const x0 = leftToRight ? -10 : v.w + 10, x1 = leftToRight ? v.w + 10 : -10;
      const y0 = v.top + rand(0.08, 0.7) * h;
      const y1 = Math.min(v.bottom - 10, Math.max(v.top + 10, y0 + rand(-0.3, 0.3) * h));
      const sat = add("satellite", x0, y0, '<span class="sat-dot"></span>');
      const duration = rand(28000, 40000);
      sat.animate([
        { transform: "translate(0px, 0px)", opacity: 0 },
        { opacity: 0.8, offset: 0.06 },
        { opacity: 0.8, offset: 0.94 },
        { transform: "translate(" + (x1 - x0).toFixed(0) + "px, " + (y1 - y0).toFixed(0) + "px)", opacity: 0 },
      ], { duration, easing: "linear" }).onfinish = () => { sat.remove(); done(); };
      if (forceFlare || Math.random() < 0.3) {
        sat.firstChild.animate([
          { transform: "scale(1)", boxShadow: "0 0 0px transparent" },
          { transform: "scale(2.6)", boxShadow: "0 0 14px 4px var(--base2)", offset: 0.4 },
          { transform: "scale(1)", boxShadow: "0 0 0px transparent" },
        ], { duration: 2400, delay: duration * rand(0.35, 0.6), easing: "ease-in-out" });
      }
    };

    // Supernova: a star somewhere in the sky swells to a blazing point with a faint shockwave
    // ring, holds, then fades away.
    const supernova = (done) => {
      const spot = randomSpot(view(), 0.9);
      const star = add("supernova", spot[0], spot[1], "*");
      const ring = add("supernova-ring", spot[0], spot[1]);
      const c = "translate(-50%, -50%) ";
      const timing = { duration: 9000, easing: "ease-in-out" };
      star.animate([
        { transform: c + "scale(1)", opacity: 0.25 },
        { transform: c + "scale(3.2)", opacity: 1, offset: 0.25 },
        { transform: c + "scale(2.8)", opacity: 0.95, offset: 0.5 },
        { transform: c + "scale(1)", opacity: 0 },
      ], timing).onfinish = () => { star.remove(); ring.remove(); done(); };
      ring.animate([
        { transform: c + "scale(0.2)", opacity: 0 },
        { transform: c + "scale(0.6)", opacity: 0.7, offset: 0.22 },
        { transform: c + "scale(4.5)", opacity: 0, offset: 0.6 },
        { transform: c + "scale(4.5)", opacity: 0 },
      ], timing);
    };

    // Plane: a slow, nearly level crossing, the same plane in both themes (the CSS shows it lit
    // by day, or as lights in the dark by night, and fades between them if the theme changes
    // mid-flight). Seen from below: a silhouette trailing a contrail, with steady red and
    // green wingtip lights (red on the left wing, green on the right) either side of a white
    // double-flash strobe.
    const PLANE_SVG = '<svg viewBox="0 0 24 10"><path d="M23 5 Q22 4.2 19 4.2 L13 4.2 L9.5 0.4 L7.6 0.4 L9.6 4.2 L4 4.4 L2.2 1.8 L1 1.8 L1.8 4.6 L1.8 5.4 L1 8.2 L2.2 8.2 L4 5.6 L9.6 5.8 L7.6 9.6 L9.5 9.6 L13 5.8 L19 5.8 Q22 5.8 23 5 Z"/></svg>';
    const plane = (done) => {
      const v = view(), h = v.bottom - v.top, ltr = Math.random() < 0.5;
      const x0 = ltr ? -30 : v.w + 30, x1 = ltr ? v.w + 330 : -330; // far enough for the contrail to leave too
      const y0 = v.top + rand(0.08, 0.45) * h, dy = rand(-0.05, 0.05) * h;
      // Drawn facing right and mirrored to fly left, which also swaps which wingtip is on top.
      const upper = ltr ? "plane-port" : "plane-starboard", lower = ltr ? "plane-starboard" : "plane-port";
      const p = add("plane", x0, y0, '<div class="contrail"></div>' + PLANE_SVG +
        '<div class="plane-lights"><span class="plane-light plane-top ' + upper + '"></span><span class="plane-light plane-strobe"></span><span class="plane-light plane-bottom ' + lower + '"></span></div>');
      const flip = ltr ? "" : " scaleX(-1)";
      p.animate([
        { transform: "translate(0px, 0px)" + flip, opacity: 0 },
        { opacity: 0.9, offset: 0.05 },
        { opacity: 0.9, offset: 0.95 },
        { transform: "translate(" + (x1 - x0).toFixed(0) + "px, " + dy.toFixed(0) + "px)" + flip, opacity: 0 },
      ], { duration: rand(45000, 60000), easing: "linear" }).onfinish = () => { p.remove(); done(); };
    };

    // Comet: glides slowly across the sky on a shallow diagonal.
    const comet = (done) => {
      const v = view(), h = v.bottom - v.top;
      const leftToRight = Math.random() < 0.5;
      const x0 = leftToRight ? -180 : v.w + 180, x1 = leftToRight ? v.w + 180 : -180;
      const y0 = rand(v.top + 20, v.top + h * 0.45), y1 = y0 + rand(0.12, 0.35) * h;
      const rot = " rotate(" + (Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI).toFixed(1) + "deg)";
      const c = add("comet", x0, y0, '<div class="comet-tail"></div><span class="comet-head">*</span>');
      c.animate([
        { transform: "translate(0px, 0px)" + rot, opacity: 0 },
        { opacity: 0.85, offset: 0.12 },
        { opacity: 0.85, offset: 0.85 },
        { transform: "translate(" + (x1 - x0).toFixed(0) + "px, " + (y1 - y0).toFixed(0) + "px)" + rot, opacity: 0 },
      ], { duration: rand(18000, 24000), easing: "linear" }).onfinish = () => { c.remove(); done(); };
    };

    // Fireworks (Dec 30 - Jan 1): a short show of rockets bursting into palette colors.
    const COLORS = ["yellow", "orange", "red", "magenta", "violet", "blue", "cyan", "green"];
    const burst = () => {
      const v = view();
      const [x, y] = randomSpot(v, 0.55), color = "var(--" + pick(COLORS) + ")";
      const rocket = add("firework", x, v.bottom - 10, "'");
      rocket.style.color = color;
      rocket.animate([
        { transform: "translate(-50%, -50%)", opacity: 0.9 },
        { transform: "translate(-50%, " + (y - v.bottom + 10).toFixed(0) + "px)", opacity: 0.9 },
      ], { duration: 700, easing: "ease-out" }).onfinish = () => {
        rocket.remove();
        const n = Math.floor(rand(14, 22));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 2 * Math.PI + rand(-0.15, 0.15), d = rand(50, 110);
          const spark = add("firework", x, y, pick(["*", "+", "."]));
          spark.style.color = color;
          spark.animate([
            { transform: "translate(-50%, -50%) translate(0px, 0px) scale(1)", opacity: 1 },
            { transform: "translate(-50%, -50%) translate(" + (Math.cos(a) * d).toFixed(0) + "px, " + (Math.sin(a) * d + 30).toFixed(0) + "px) scale(0.6)", opacity: 0 },
          ], { duration: rand(1400, 2000), easing: "cubic-bezier(0.1, 0.7, 0.3, 1)" }).onfinish = () => spark.remove();
        }
      };
    };
    const fireworks = (done) => {
      let left = Math.floor(rand(4, 8));
      const next = () => { burst(); if (--left > 0) setTimeout(next, rand(700, 1600)); else setTimeout(done, 2500); };
      next();
    };

    // ---- Daytime events (light theme) ----
    // One bird. The wing shape itself animates: up, level, down, level, then a short glide
    // before the next beat. Each bird gets its own tempo and phase.
    const WINGS_UP = "M0.7 0.8 Q3.3 3.4 6 3.2 Q8.7 3.4 11.3 0.8";
    const WINGS_LEVEL = "M0.7 3.2 Q3.3 1.4 6 3.2 Q8.7 1.4 11.3 3.2";
    const WINGS_DOWN = "M0.7 5.4 Q3.3 2.4 6 3.2 Q8.7 2.4 11.3 5.4";
    const bird = (x, y) => {
      const beat = rand(0.9, 1.4).toFixed(2);
      return '<svg class="bird" viewBox="0 0 12 6" style="left:' + x.toFixed(0) + "px;top:" + y.toFixed(0) + 'px"><path d="' + WINGS_LEVEL + '">' +
        '<animate attributeName="d" dur="' + beat + 's" begin="-' + rand(0, 1.4).toFixed(2) + 's" repeatCount="indefinite" calcMode="spline"' +
        ' keyTimes="0;0.15;0.3;0.45;0.6;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"' +
        ' values="' + [WINGS_LEVEL, WINGS_UP, WINGS_LEVEL, WINGS_DOWN, WINGS_LEVEL, WINGS_LEVEL].join(";") + '"/></path></svg>';
    };
    const glide = (el, dx, dy, duration, done) => el.animate([
      { transform: "translate(0px, 0px)", opacity: 0 },
      { opacity: 0.9, offset: 0.06 },
      { opacity: 0.9, offset: 0.94 },
      { transform: "translate(" + dx.toFixed(0) + "px, " + dy.toFixed(0) + "px)", opacity: 0 },
    ], { duration, easing: "linear" }).onfinish = () => { el.remove(); done(); };

    // Birds: one to three crossing the sky.
    const birds = (done) => {
      const v = view(), h = v.bottom - v.top, ltr = Math.random() < 0.5, n = Math.floor(rand(1, 4));
      let html = "";
      for (let i = 0; i < n; i++) html += bird(i * rand(20, 32) * (ltr ? -1 : 1), rand(-12, 12));
      const x0 = ltr ? -40 : v.w + 40, x1 = ltr ? v.w + 40 : -40;
      const g = add("birds", x0, v.top + rand(0.08, 0.55) * h, html);
      glide(g, x1 - x0, rand(-0.12, 0.08) * h, rand(16000, 26000), done);
    };

    // Migration: a V formation, leader out front, arms trailing behind on both sides.
    const migration = (done) => {
      const v = view(), h = v.bottom - v.top, ltr = Math.random() < 0.5, dir = ltr ? 1 : -1;
      const arm = Math.floor(rand(3, 7));
      let html = bird(0, 0);
      for (let k = 1; k <= arm; k++) {
        html += bird(-dir * k * 22 + rand(-2, 2), -k * 12 + rand(-1.5, 1.5));
        html += bird(-dir * k * 22 + rand(-2, 2), k * 12 + rand(-1.5, 1.5));
      }
      const x0 = ltr ? -140 : v.w + 140, x1 = ltr ? v.w + 140 : -140;
      const g = add("birds", x0, v.top + rand(0.12, 0.45) * h, html);
      glide(g, x1 - x0, rand(-0.1, 0.05) * h, rand(34000, 46000), done);
    };

    // Chance of each daytime event per check. Set one to 0 to turn it off.
    const DAY_EVENTS = { birds: 0.32, plane: 0.18, migration: 0.05 };
    const isDay = () => root.dataset.theme === "light";

    const EVENTS = { meteor: meteors, satellite, plane, supernova, comet, fireworks, birds, migration };
    // Holidays tilt the odds: New Year's (Dec 30 - Jan 1) is mostly fireworks, shower nights mostly meteors.
    const chances = newYear ? { fireworks: 0.7, meteor: 0.2, satellite: 0.05 }
      : shower ? Object.assign({}, SKY_EVENTS, { meteor: 0.8 - Object.keys(SKY_EVENTS).filter((k) => k !== "meteor").reduce((sum, k) => sum + SKY_EVENTS[k], 0) })
      : SKY_EVENTS;

    let busy = false;
    const run = (name, arg) => { busy = true; EVENTS[name](() => { busy = false; }, arg); };
    const check = () => {
      if (!busy && !document.hidden) {
        const table = isDay() ? DAY_EVENTS : chances;
        let roll = Math.random();
        for (const name of Object.keys(table)) {
          if (roll < table[name]) { run(name); break; }
          roll -= table[name];
        }
      }
      setTimeout(check, newYear || shower ? rand(7000, 12000) : rand(15000, 25000));
    };

    if (hash === "#sky") {
      // Preview: every event once, back to back (the satellite always flares). In the light
      // theme it previews the daytime events instead.
      const order = isDay() ? ["birds", "plane", "migration"]
        : ["meteor", "satellite", "plane", "supernova", "comet", "fireworks"];
      const step = () => {
        const name = order.shift();
        if (!name) return check();
        busy = true;
        EVENTS[name](() => { busy = false; setTimeout(step, 1500); }, true);
      };
      setTimeout(step, 2000);
    } else if (hash === "#plane") {
      // Preview: a plane right away (switch themes while it's crossing to see it change).
      busy = true;
      setTimeout(() => plane(() => { busy = false; check(); }), 1000);
    } else {
      setTimeout(check, rand(8000, 15000));
    }
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
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">&larr; Back to Projects</a>`;

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
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">&larr; Back to Projects</a>`;

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
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">&larr; Back to Projects</a>`;

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
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">&larr; Back to Projects</a>`;

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
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">&larr; Back to Projects</a>`;

    } else if (path === "/about") {

      // ==========================================
      // ABOUT ME
      // ==========================================
      content = `
        <div class="intro-section">
          <div class="bio-text">
            <h2>Trevor DeMelo</h2>
            <p>
              Hello. This is my website. I have a tremendous curiosity and a genuine love for all things technology. I'm still figuring out this web page, but I'm having fun with it (as you can hopefully see).
            </p>
          </div>
          <div class="bio-portrait-frame">
            <div class="portrait-container">
              <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Images/AboutMe.webp" width="480" height="640" alt="Trevor DeMelo Self-portrait Sketch">
            </div>
            <!-- Light theme: redraw the sketch as Solarized red ink (#dc322f) on base3 paper (#fdf6e3).
                 Levels are stretched so the paper goes fully white, then darkness maps from paper to ink. -->
            <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="portrait-ink" color-interpolation-filters="sRGB">
              <feComponentTransfer><feFuncR type="linear" slope="1.15" intercept="-0.1"/><feFuncG type="linear" slope="1.15" intercept="-0.1"/><feFuncB type="linear" slope="1.15" intercept="-0.1"/></feComponentTransfer>
              <feColorMatrix type="matrix" values="0.0274 0.0923 0.0093 0 0.863  0.1635 0.5500 0.0555 0 0.196  0.1501 0.5049 0.0510 0 0.184  0 0 0 1 0"/>
            </filter></svg>
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
    // HOME ("/", and any other path): just the nav bar, so content stays empty.

    // Highlights the current page in the nav.
    const current = (href) => (path === href || (href === "/projects" && path.startsWith("/project")) ? ' aria-current="page"' : "");

    // Assemble the complete HTML document using the layout frame
    return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Trevor DeMelo | Portfolio</title><link rel="icon" type="image/svg+xml" href="/assets/duck.svg"><meta name="description" content="Trevor DeMelo, IT professional. Network administration, systems diagnostics, and Cloudflare Workers projects."><meta property="og:title" content="Trevor DeMelo | Portfolio"><meta property="og:description" content="IT professional. Network administration, systems diagnostics, and Cloudflare Workers projects."><meta property="og:type" content="website"><meta property="og:url" content="https://trevordemelo.com"><meta property="og:image" content="https://github.com/SleepyZip/mywebpage/blob/main/Assets/Images/AboutMe.png?raw=true"><script>var t; try { t = localStorage.getItem("theme"); } catch (e) {} if (t !== "dark") document.documentElement.dataset.theme = "light";</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/site.css"></head><body>
      <div class="sky" aria-hidden="true"></div>
      <button type="button" class="moon-toggle" aria-label="Switch to light theme"><svg class="moon-art" viewBox="0 0 38 38" aria-hidden="true"><circle class="moon-disk" cx="19" cy="19" r="18.6"/><path class="moon-lit" d=""/></svg><svg class="sun-art" viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="8"/><g class="sun-rays"><text x="19" y="4.5">|</text><text x="29.3" y="8.7">/</text><text x="33.5" y="19">-</text><text x="29.3" y="29.3">&#92;</text><text x="19" y="33.5">|</text><text x="8.7" y="29.3">/</text><text x="4.5" y="19">-</text><text x="8.7" y="8.7">&#92;</text></g></svg><span class="moon-lead" aria-hidden="true"><svg viewBox="0 0 60 20"><path d="M1 1 L13 13 H55"/><circle cx="57" cy="13" r="2"/></svg></span><span class="moon-phase" aria-hidden="true"></span><span class="moon-label" aria-hidden="true"><span class="theme-word theme-word-light">Light</span><span class="theme-sep">/</span><span class="theme-word theme-word-dark">Dark</span></span></button>
      <div class="clouds" aria-hidden="true"></div>
      <div class="cloudbank" aria-hidden="true"></div>
      <div class="signature" aria-hidden="true">Trevor DeMelo</div>
      <div class="container${content ? "" : " is-home"}">
        <nav>
          <div>
            <a href="/"${current("/")}>HOME</a>
            <a href="/about"${current("/about")}>ABOUT</a>
            <a href="/projects"${current("/projects")}>PROJECTS</a>
            <a href="/blog/">BLOG</a>
          </div>
          <div class="nav-right">
            <button type="button" class="nav-icon-btn min-toggle" aria-label="Minimize page" aria-pressed="false"><svg class="icon-min" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 10h8"/></svg><svg class="icon-restore" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="2" width="8" height="8"/></svg><span class="min-rest" aria-hidden="true"><span class="when-open">Minimize</span><span class="when-min">Restore</span></span></button>
            <a href="/admin" class="nav-icon-btn portal-link" aria-label="Admin Portal"><span class="portal-a" aria-hidden="true">A</span><span class="portal-rest" aria-hidden="true">dmin Portal</span></a>
          </div>
        </nav>
        <div class="page">${content}</div>
      </div>
      <script src="/assets/site.js" defer></script>
    </body></html>`, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
  }
};
