import type { MetadataRoute } from "next";

// PWA manifest. Chrome uses the 512px icon for the install/splash screen, so it
// must be a real high-res PNG (an SVG favicon alone would look blurry there).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Livestock Monitoring System",
    short_name: "SLMS",
    description: "Monitoring lingkungan kandang sapi berbasis IoT",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF9",
    theme_color: "#10B981",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
