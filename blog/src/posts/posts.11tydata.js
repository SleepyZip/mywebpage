// Defaults for every post in this folder (the Obsidian Personal/Blog folder).
// Front matter in a post overrides any of these.
import { slugify } from "../../eleventy.config.js";

export default {
  layout: "layouts/post.njk",
  eleventyComputed: {
    // No title in front matter? Use the note's file name, as Obsidian shows it.
    title: (data) => data.title || data.page.fileSlug,
    // /blog/posts/<file-name-slug>/ so [[wikilinks]] between posts resolve.
    permalink: (data) => (data.permalink === false ? false : `/posts/${slugify(data.page.fileSlug)}/`),
  },
};
