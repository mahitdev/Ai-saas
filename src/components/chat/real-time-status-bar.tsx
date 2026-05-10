"use client";

import { Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";

interface RealTimeStatusBarProps {
  status: ConnectionStatus;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function RealTimeStatusBar({ status, error, onRetry, className }: RealTimeStatusBarProps) {
  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case "connecting":
        return {
          icon: Wifi,
          text: "Connecting...",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          iconClassName: "text-blue-500",
        };
      case "connected":
        return {
          icon: CheckCircle,
          text: "Connected",
          className: "bg-green-50 text-green-700 border-green-200",
          iconClassName: "text-green-500",
        };
      case "reconnecting":
        return {
          icon: AlertCircle,
          text: "Reconnecting...",
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
          iconClassName: "text-yellow-500",
        };
      case "offline":
        return {
          icon: WifiOff,
          text: error || "Offline",
          className: "bg-red-50 text-red-700 border-red-200",
          iconClassName: "text-red-500",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-all duration-200",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", config.iconClassName)} />
      <span className="flex-1 truncate">{config.text}</span>
      {status === "offline" && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
        >
          Retry
        </button>
      )}
    </div>
  );
}