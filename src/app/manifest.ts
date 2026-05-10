import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Logicra",
    short_name: "Logicra",
    description: "AI chat platform with retention, trust, and growth controls.",
    start_url: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    background_color: "#020617",
    theme_color: "#0f172a",
    categories: ["productivity", "business", "utilities"],
    orientation: "any",
    icons: [
      { src: "/next.svg", sizes: "any", type: "image/svg+xml" },
    ],
    screenshots: [
      {
        src: "/screenshots/chat-wide.svg",
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "Logicra chat workspace",
      },
      {
        src: "/screenshots/chat-mobile.svg",
        sizes: "390x844",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "Logicra mobile chat",
      },
    ],
    shortcuts: [
      {
        name: "New Chat",
        short_name: "Chat",
        description: "Start a fresh AI conversation.",
        url: "/dashboard/chat?new=1",
        icons: [{ src: "/next.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Account & Sessions",
        short_name: "Account",
        description: "Review passkeys, 2FA, and active sessions.",
        url: "/dashboard/account",
        icons: [{ src: "/next.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
