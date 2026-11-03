import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ["maplibre-gl"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/hgm-tiles": {
        target: "https://atlas.harita.gov.tr",
        changeOrigin: true,
        // Kurumsal ağlarda Node kök sertifikayı tanımayabildiği için HGM karoları 500 dönüyordu.
        secure: false,
        rewrite: (path) => path.replace(/^\/hgm-tiles/, ""),
        headers: {
          Referer: "https://atlas.harita.gov.tr/",
        },
      },
    },
  },
});
