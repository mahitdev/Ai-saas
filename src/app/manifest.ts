import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Logicra",
    short_name: "Logicra",
    description: "AI chat platform with retention, trust, and growth controls.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0f172a",
    icons: [
      { src: "/next.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
