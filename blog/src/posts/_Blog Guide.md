# Blog Guide

Notes in this folder become posts at **trevordemelo.com/blog**. This guide starts with `_`, so it's never published.

## Writing a post

Create a note here and start it with this front matter:

```yaml
---
title: My Post Title
date: 2026-09-28
summary: One line shown on the blog index and in link previews.
tags: [networking]
draft: true
---
```

- **title**: optional; defaults to the note's file name.
- **date**: controls ordering on the blog index. Use `YYYY-MM-DD`.
- **summary**: optional one-liner under the title on the index.
- **tags**: optional.
- **draft: true**: shown in the local preview only. Set it to `false` (or delete the line) to publish.

The post's address comes from the file name: `My Post Title.md` becomes `/blog/posts/my-post-title/`. Renaming the note changes the address.

## Obsidian features that work

- `[[Other Post]]` and `[[Other Post|custom text]]` link between posts.
- `![[image.png]]` and `![[image.png|400]]` (width in pixels) embed images. Paste images as usual; publishing copies them from `Attachments` into the blog automatically.
- `==highlight==`, callouts (`> [!note]`, `tip`, `warning`, `danger`, `info`, `question`, `quote`), code blocks, and tables.
- `%%comments%%` are stripped and never published.

Links to notes outside this folder won't work on the site, since only this folder is published.

## Previewing and publishing

In a terminal at `Documents\GitHub\mywebpage\blog`:

- `npm start`: live preview at http://localhost:8080/blog/ (drafts included). It reloads as you edit.
- `npm run publish:check`: a dry run. It copies images and builds the blog to catch errors, then lists what would be published, without committing anything.
- `npm run publish`: copies any images your posts use, builds to catch errors, then commits and pushes. Cloudflare Pages rebuilds, and the post is live in a minute or two.
