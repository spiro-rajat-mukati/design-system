import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/index.ts", "src/components", "src/tokens"],
      exclude: [
        "src/**/*.stories.*",
        "src/**/*.test.*",
        "src/**/*.figma.tsx",
        "src/App.*",
        "src/main.tsx",
        "src/setupTests.js",
      ],
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@kijani/tokens",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    cssCodeSplit: false,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    globals: true,
  },
});
