# Blog Guide

How to write and publish posts on **trevordemelo.com/blog**. Every note in this folder (`Personal/Blog`) becomes a post, except notes whose names start with `_`, like this guide. Those are never published.

> [!warning] This folder is public
> This folder is `blog/src/posts` in the public GitHub repo **SleepyZip/mywebpage**. A draft never appears on the website, but its Markdown file is visible on GitHub once you publish. Don't keep anything private here, even as a draft.

## Publishing a post, step by step

1. **Create a note** in this folder. Its file name becomes the address: `My First Post.md` becomes `trevordemelo.com/blog/posts/my-first-post/`.
2. **Paste this at the very top** and fill it in:

   ```yaml
   ---
   title: My First Post
   date: 2026-09-28
   summary: One line shown on the blog index and in link previews.
   tags: [networking]
   draft: true
   ---
   ```

3. **Write the post** below the second `---`. Paste images straight into the note as usual.
4. **Preview it (optional).** Open a terminal in the blog folder (see **Running the commands** below) and run:

   ```
   npm start
   ```

   Then open http://localhost:8080/blog/. Drafts show here, and the page reloads as you type. Press `Ctrl+C` in the terminal to stop it.
5. **When it's ready, change `draft: true` to `draft: false`** (or delete that line).
6. **Publish** in the terminal:

   ```
   npm run publish
   ```

   This copies any images the post uses, builds the blog to catch mistakes, then commits and pushes to GitHub. Cloudflare rebuilds the blog automatically, and the post is live **about a minute later**.

To check what would be published without publishing anything, run `npm run publish:check`.

## The front matter

| Field | Required? | What it does |
| --- | --- | --- |
| `title` | No | The post's title. Defaults to the note's file name. |
| `date` | Recommended | Sets the order on the blog index (newest first). Use `YYYY-MM-DD`. |
| `summary` | No | One line under the title on the index, and the description in link previews. |
| `tags` | No | Shown as small tags on the post, e.g. `[networking, homelab]`. |
| `draft` | No | `true` keeps the post off the live site (it still shows in `npm start`). |

## What you can use in a post

- **Normal Markdown:** headings, **bold**, *italics*, lists, links, tables, and code blocks.
- **Links between posts:** `[[Other Post]]` or `[[Other Post|custom text]]`. Links to notes outside this folder won't work on the site, since only this folder is published.
- **Images:** `![[image.png]]`, or `![[image.png|400]]` to set a width in pixels. Obsidian saves pasted images to `Attachments`; publishing finds them anywhere in the vault and copies them into the blog.
- **Highlights:** `==highlighted text==`.
- **Callouts:** `> [!note]`, `> [!tip]`, `> [!warning]`, `> [!danger]`, `> [!info]`, `> [!question]`, `> [!quote]`, with an optional title after the type.
- **Private comments:** `%%like this%%`. They're removed and never published.

## Editing, renaming, or removing a post

- **Edit:** change the note, then run `npm run publish` again.
- **Rename:** renaming the note changes its address, so old links to it will stop working.
- **Unpublish:** set `draft: true` (or delete the note), then run `npm run publish`.

## Running the commands

The commands run in a terminal opened in the blog folder:

1. Open **PowerShell** (or **Terminal**).
2. Go to the blog folder:

   ```
   cd "$HOME\Documents\GitHub\mywebpage\blog"
   ```

3. Run the command you need (`npm start`, `npm run publish:check`, or `npm run publish`).

### Setting up another PC (one time)

1. Install **Node.js** (LTS) and **Git**, e.g. `winget install OpenJS.NodeJS.LTS` and `winget install Git.Git`.
2. Download the site: `git clone https://github.com/SleepyZip/mywebpage.git "$HOME\Documents\GitHub\mywebpage"`
3. In the `blog` folder, run `npm install`.
4. Set your commit name and email for this repo: `git config user.name "Trevor DeMelo"` and `git config user.email "209317220+SleepyZip@users.noreply.github.com"`.
5. If your Obsidian vault isn't at `Documents\The SleepyBase`, tell the publish command where it is before publishing, e.g. `$env:BLOG_VAULT = "D:\Notes\The SleepyBase"`.
6. Optional: to write posts in Obsidian on that PC, link the vault's `Personal\Blog` folder to the repo's `blog\src\posts` folder (a Windows junction), or open `blog\src\posts` as its own vault.

## If something goes wrong

| Problem | Fix |
| --- | --- |
| `npm` isn't recognized | Close and reopen the terminal. If it still fails, reinstall Node.js. |
| A browser window asks you to sign in to GitHub | That's the first push from this PC. Sign in and it'll remember you. |
| "These embedded images weren't found anywhere in the vault" | The image name in `![[...]]` doesn't match a file in the vault. Check the spelling, or re-paste the image. |
| "The blog failed to build" | The error says which note has the problem. It's often broken front matter, like a missing `---` or a `:` in the title (wrap the title in quotes). |
| "Nothing new to publish" | The site already matches your notes. Did you save the note, and set `draft: false`? |
| Published, but the post isn't on the site | Wait a minute and refresh. Check the build under **Cloudflare → Workers & Pages → trevordemelo-blog → Deployments**. |
