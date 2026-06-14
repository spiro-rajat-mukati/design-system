/**
 * Shared site chrome — header, sidebar (where applicable), footer.
 * Each page declares which section it belongs to via a `<body data-section="…">`
 * attribute; the script highlights the active link and renders the matching
 * sidebar if one is configured.
 */

(function () {
  const NAV = [
    { key: "get-started",   href: "/get-started/",   label: "Get started" },
    { key: "built-for-ai",  href: "/built-for-ai/",  label: "Built for AI" },
    { key: "design-system", href: "/design-system/", label: "Design System" },
    { key: "resources",     href: "/resources/",     label: "Resources" }
  ];

  const SIDEBARS = {
    "get-started": [
      {
        heading: "Get started",
        items: [
          { href: "/get-started/",            label: "Overview" },
          { href: "/get-started/designers/",  label: "For designers" },
          { href: "/get-started/developers/", label: "For developers" },
          { href: "/get-started/pms/",        label: "For product managers" }
        ]
      }
    ],
    "design-system": [
      {
        heading: "Design System",
        items: [
          { href: "/design-system/",             label: "Overview" },
          { href: "/design-system/foundations/", label: "Foundations" },
          { href: "/design-system/components/",  label: "Components" },
          { href: "/design-system/patterns/",    label: "Patterns" }
        ]
      }
    ],
    "built-for-ai": [
      {
        heading: "Built for AI",
        items: [
          { href: "/built-for-ai/",            label: "Overview" },
          { href: "/built-for-ai/pipeline/",   label: "Design-to-dev pipeline" },
          { href: "/built-for-ai/components/", label: "Component usage" },
          { href: "/built-for-ai/tokens/",     label: "Token usage" },
          { href: "/built-for-ai/prompting/",  label: "Prompt library" },
          { href: "/built-for-ai/quality/",    label: "Quality bar" }
        ]
      },
      {
        heading: "Role guides",
        items: [
          { href: "/built-for-ai/roles/pm/",        label: "For product managers" },
          { href: "/built-for-ai/roles/designer/",  label: "For designers" },
          { href: "/built-for-ai/roles/developer/", label: "For developers" }
        ]
      }
    ]
  };

  function activeSection() {
    return document.body.getAttribute("data-section") || "";
  }
  function activePath() {
    return location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "/");
  }

  function renderHeader() {
    const section = activeSection();
    const nav = NAV.map((n) =>
      `<a href="${n.href}" ${n.key === section ? 'class="active"' : ""}>${n.label}</a>`
    ).join("");

    return `
      <header class="site-header">
        <a href="/" class="site-header__logo">
          <span class="site-header__logo-mark">K</span>
          <span>Kijani Design System</span>
        </a>
        <nav class="site-header__nav">${nav}</nav>
      </header>
    `;
  }

  function renderSidebar() {
    const section = activeSection();
    const groups = SIDEBARS[section];
    if (!groups) return "";
    const path = activePath();

    return `
      <aside class="site-sidebar">
        ${groups.map((group) => `
          <div class="site-sidebar__group">
            <div class="site-sidebar__heading">${group.heading}</div>
            <ul>
              ${group.items.map((item) => {
                const isActive = path === item.href || path === item.href.replace(/\/$/, "");
                return `<li><a href="${item.href}" ${isActive ? 'class="active"' : ""}>${item.label}</a></li>`;
              }).join("")}
            </ul>
          </div>
        `).join("")}
      </aside>
    `;
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div>© Kijani · Design System</div>
        <div class="site-footer__links">
          <a href="/about/">About</a>
          <a href="https://github.com/rajatspiro/design-system" target="_blank" rel="noopener">GitHub</a>
          <a href="/changelog/">Changelog</a>
        </div>
      </footer>
    `;
  }

  function mount() {
    const headerSlot = document.querySelector("[data-include='header']");
    if (headerSlot) headerSlot.outerHTML = renderHeader();

    const sidebarSlot = document.querySelector("[data-include='sidebar']");
    if (sidebarSlot) sidebarSlot.outerHTML = renderSidebar();

    const footerSlot = document.querySelector("[data-include='footer']");
    if (footerSlot) footerSlot.outerHTML = renderFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
