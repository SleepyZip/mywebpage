# mywebpage

Source for [trevordemelo.com](https://trevordemelo.com), a single-file Cloudflare Worker.

## Deploying

The site is hosted as a Cloudflare Worker (`withered-meadow-cde0`), not through GitHub Pages or Wrangler CI - this repo just tracks the source. To publish a change:

1. Edit `worker.js`
2. Go to **Cloudflare Dashboard -> Workers & Pages -> withered-meadow-cde0 -> Edit code**
3. Select all, delete, paste in the updated `worker.js`, click **Deploy**
4. Commit and push the change here so this repo stays in sync with what's live

`index.txt` is an old abandoned draft and isn't part of the live site.