import React, { useEffect } from "react";
import "../src/index.css";

/* ---- Theme decorator ----
 * Toggles [data-theme] on <html> based on the global Theme toolbar.
 * Storybook UI gets a Theme (Light/Dark) picker; Chromatic snapshots
 * both via parameters.chromatic.modes.
 */
const withGlobals = (Story, context) => {
  const theme = context.globals.theme || "light";

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }, [theme]);

  return React.createElement(
    "div",
    {
      style: {
        background: "var(--color-surface-default)",
        color: "var(--color-text-primary)",
        padding: "var(--space-4)",
        minHeight: "100%",
        fontFamily: "var(--font-family-sans)",
      },
      "data-story-theme": theme,
    },
    React.createElement(Story, null)
  );
};

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [withGlobals],

  globalTypes: {
    theme: {
      name: "Theme",
      description: "Design system theme",
      defaultValue: "light",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark",  title: "Dark",  icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },

  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },

    /* Chromatic light/dark matrix.
     * `modes` requires the @chromatic-com/storybook addon to capture both
     * snapshots per story. Without that addon, snapshots default to
     * whatever the toolbar is set to.
     */
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark:  { theme: "dark" },
      },
      diffThreshold: 0.2,
      pauseAnimationAtEnd: true,
    },

    viewport: {
      viewports: {
        mobile:  { name: "Mobile (375)",  styles: { width: "375px",  height: "812px" } },
        tablet:  { name: "Tablet (768)",  styles: { width: "768px",  height: "1024px" } },
        desktop: { name: "Desktop (1280)", styles: { width: "1280px", height: "800px" } },
      },
    },

    a11y: { test: "todo" },
  },
};

export default preview;
