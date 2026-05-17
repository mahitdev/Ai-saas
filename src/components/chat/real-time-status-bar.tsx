"use client";

import { Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          className: "border-primary/20 bg-primary/10 text-foreground",
          iconClassName: "text-cyan-300",
        };
      case "connected":
        return {
          icon: CheckCircle,
          text: "Connected",
          className: "border-emerald-300/20 bg-emerald-300/10 text-foreground",
          iconClassName: "text-emerald-300",
        };
      case "reconnecting":
        return {
          icon: AlertCircle,
          text: "Reconnecting...",
          className: "border-amber-300/20 bg-amber-300/10 text-foreground",
          iconClassName: "text-amber-300",
        };
      case "offline":
        return {
          icon: WifiOff,
          text: error || "Offline",
          className: "border-destructive/30 bg-destructive/10 text-foreground",
          iconClassName: "text-destructive",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "panel-surface flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", config.iconClassName)} />
      <span className="flex-1 truncate">{config.text}</span>
      {status === "offline" && onRetry && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-7 px-2 text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
