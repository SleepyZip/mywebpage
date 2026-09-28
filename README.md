# mywebpage

Source for [trevordemelo.com](https://trevordemelo.com): a single-file Cloudflare Worker for the main site, plus an 11ty blog served at `/blog`.

## Layout

| Path | What it is |
| --- | --- |
| `worker.js` | The Cloudflare Worker (`withered-meadow-cde0`): every main-site page, the shared `/assets/site.css`, `/assets/site.js` and `/assets/duck.svg`, and the `/blog/*` proxy. |
| `blog/` | The blog, built with [11ty](https://www.11ty.dev/) on Cloudflare Pages (project `trevordemelo-blog`). Posts in `blog/src/posts/` are written in Obsidian. |
| `Assets/` | Images the site loads from GitHub (portrait, project thumbnails). |

`index.txt` is an old abandoned draft and isn't part of the live site.

## Deploying the Worker

The Worker isn't deployed by CI; this repo just tracks the source. To publish a change:

1. Edit `worker.js`
2. Go to **Cloudflare Dashboard -> Workers & Pages -> withered-meadow-cde0 -> Edit code**
3. Select all, delete, paste in the updated `worker.js`, click **Deploy**
4. Commit and push the change here so this repo stays in sync with what's live

## The night sky

`site.js` (in `worker.js`) draws the background: twinkling ASCII stars, constellations from real star positions, and rare events, one at a time. The top-left moon is the theme toggle and shows tonight's real phase.

- **Tuning:** the `SKY_EVENTS` line sets each event's chance per ~20s check (set one to `0` to turn it off). `HOLIDAYS` switches the date-based extras on or off: meteor showers on their peak nights, fireworks Dec 30 - Jan 1, and a blood moon on lunar eclipse dates (the `ECLIPSES` list).
- **Previewing:** add `#sky` to any page URL to play every event in turn, or `#sky-newyear` / `#sky-bloodmoon` for the holidays.
- **Reduced motion:** visitors with reduced motion turned on get a still sky.

## The blog

Cloudflare Pages builds `blog/` on every push to `main` (root directory `blog`, build command `npm run build`, output `_site`). The Worker proxies `trevordemelo.com/blog/*` to the Pages site, so the blog shares the main site's domain, nav, and styles.

From `blog/`:

- `npm install`: once, after cloning.
- `npm start`: live preview of the whole site at http://localhost:8080/blog/ (drafts included; the main pages come from `../worker.js`).
- `npm run publish:check`: dry run of a publish.
- `npm run publish`: copies images embedded in posts from the Obsidian vault into `src/posts/images`, builds, then commits and pushes `src/posts`.

Posts support Obsidian syntax: `[[wikilinks]]`, `![[image embeds]]`, callouts, `==highlights==`, and `%%comments%%` (stripped). `draft: true` keeps a post out of the published build. See `blog/src/posts/_Blog Guide.md`.
