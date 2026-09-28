import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const QUERY = /\/node_modules\/(@tanstack\/react-query|@tanstack\/query-core|axios)\//;
const CHARTS =
  /\/node_modules\/(recharts|recharts-scale|react-smooth|victory-vendor|d3-[a-z-]+|internmap|delaunator|robust-predicates|lodash|eventemitter3|fast-equals)\//;
const PAGE_GROUP = /\/src\/pages\/(public|student|teacher|admin)\//;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Every module gets an explicit home so Rollup never hoists shared code into a
         * page chunk: third-party libraries, shared app code, and one lazily-loaded
         * chunk per page group.
         */
        manualChunks(id) {
          if (QUERY.test(id)) return "query";
          if (CHARTS.test(id)) return "charts";
          if (id.includes("/node_modules/")) return "vendor";
          const group = PAGE_GROUP.exec(id);
          if (group) return `pages-${group[1]}`;
          return id.includes("/src/") ? "app" : undefined;
        },
      },
    },
  },
});
