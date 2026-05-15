# PMARCH
A website for hosting info about Project Moon Unofficial TTRPG for easy viewing.

This repository now includes a full website interface for the rule materials in `Newest Material/`.

## What changed
- `index.html` now presents the site as readable webpages instead of an archive.
- `app.js` imports rule, effect, and expansion content from the documents and displays it in-page.
- `styles.css` uses a minimal DOS/vintage PC theme.
- The changelog is intentionally excluded from the main site content.

## View the site
Open `index.html` in a browser, or serve this folder with a local static server (for example `python3 -m http.server`) and browse to the page.

## Deploy to GitHub Pages
1. Go to your repository settings on GitHub.
2. Scroll to "Pages" in the sidebar.
3. Under "Source", select "Deploy from a branch".
4. Choose the `main` branch and `/ (root)` folder.
5. Click "Save".
6. The site will be available at `https://krispyscripts.github.io/PMARCH/` (adjust for your username).

The navigation links scroll to sections, and the search bar filters content as you type. Content loads asynchronously, so sections may show "Loading..." initially.
