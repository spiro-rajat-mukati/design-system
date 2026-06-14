# Kijani Design System — showcase site

Static HTML site that presents the design system to designers, developers, and PMs. Inspired visually by [GitHub Primer](https://primer.style). Zero build step — just HTML + CSS + a small JS file for shared chrome.

## Layout

```
site/
  index.html                    Home
  get-started/
    index.html                  Get started — overview
    designers.html              For designers
    developers.html             For developers
    pms.html                    For product managers
  principles.html               Design principles
  foundations/index.html        Foundations (placeholder — content coming later)
  components/index.html         Components (placeholder)
  patterns/index.html           Patterns (placeholder)
  resources/index.html          Resources & links
  changelog/index.html          Changelog
  about/index.html              About + ownership + versioning
  css/site.css                  All styling
  js/chrome.js                  Shared header / sidebar / footer (rendered client-side)
```

Each page only contains its own content. The header, sidebar, and footer are injected by `chrome.js` at runtime — this is the minimal pattern that avoids duplicated HTML across pages without a build step.

## Running locally

The site is plain HTML, but it uses absolute paths (`/css/site.css`, `/js/chrome.js`). Serve it through any static file server rooted at the `site/` folder:

```
cd site
npx serve .
# → http://localhost:3000
```

Or with Python:

```
cd site
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` directly via `file://` won't load the absolute-path assets — use a local server.

## Deploying

The site is fully static. Any of:

- **Vercel** — point a project at this folder, set the root directory to `site`. Vercel serves it as-is.
- **Netlify** — same, set the publish directory to `site`.
- **GitHub Pages** — push to a `gh-pages` branch with only the `site/` contents at root.
- **S3 + CloudFront** — sync `site/` to a bucket configured for static hosting.

There's no build step. Whatever the deploy target serves, that's what users see.

## Adding a page

1. Create the HTML file in the appropriate folder.
2. Copy the boilerplate from any existing page — `<head>`, header / sidebar / footer slots, `<script src="/js/chrome.js">`.
3. Set `data-section` on `<body>` to one of the keys in `chrome.js`'s `NAV` array — that highlights the right top-nav item.
4. Write the content inside `<main class="site-content">`.

If the page belongs in a sidebar group, add an entry to the matching key in `chrome.js`'s `SIDEBARS` map.

## Editing the chrome

`js/chrome.js` is the single place where the header, sidebar, and footer markup live. Update there and every page picks up the change on next load.

## Visual conventions

Mostly Primer-inspired:

- System font stack — `-apple-system, BlinkMacSystemFont, Inter, …` — no custom fonts loaded over the network.
- One accent colour (`#3C61DD`, the design system's brand colour) for links, primary buttons, and focused / active sidebar items.
- Subtle borders (`#E6E8EB`) and slightly stronger borders (`#D7DBDF`) — never solid dividers.
- Generous whitespace, `820px` content max-width.
- Code blocks with a sunken background and a thin border.

If you find yourself reaching for a third colour or a heavier weight, pause — the system is restrained on purpose.
