// Design tokens for consistent theming
export const designTokens = {
  // Colors
  colors: {
    // Real-time status colors
    realtime: {
      connected: "bg-green-50 text-green-700 border-green-200",
      connecting: "bg-blue-50 text-blue-700 border-blue-200",
      reconnecting: "bg-yellow-50 text-yellow-700 border-yellow-200",
      offline: "bg-red-50 text-red-700 border-red-200",
    },

    // Message colors
    message: {
      user: "bg-blue-600 text-white",
      assistant: "bg-white border border-gray-200 text-gray-900",
    },

    // Status indicators
    status: {
      online: "text-green-500",
      away: "text-yellow-500",
      offline: "text-gray-400",
    },
  },

  // Spacing
  spacing: {
    section: "gap-6",
    component: "gap-4",
    element: "gap-2",
  },

  // Border radius
  radius: {
    small: "rounded-lg",
    medium: "rounded-xl",
    large: "rounded-2xl",
    full: "rounded-full",
  },

  // Shadows
  shadows: {
    subtle: "shadow-sm",
    medium: "shadow-md",
    large: "shadow-lg",
  },

  // Transitions
  transitions: {
    fast: "transition-all duration-200",
    normal: "transition-all duration-300",
    slow: "transition-all duration-500",
  },
} as const;

// Type helpers
export type DesignTokenColor = typeof designTokens.colors;
export type DesignTokenSpacing = typeof designTokens.spacing;
export type DesignTokenRadius = typeof designTokens.radius;