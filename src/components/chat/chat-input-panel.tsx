"use client";

import { useCallback, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  ImagePlus,
  Mic,
  MicOff,
  Send,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputPanelProps {
  onSendMessage: (message: string, imageDataUrl?: string, attachments?: File[]) => Promise<void>;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onFileSelect?: (files: FileList) => void;
  isSending?: boolean;
  isListening?: boolean;
  voiceEnabled?: boolean;
  cameraEnabled?: boolean;
  onCameraToggle?: () => void;
  pendingFiles?: File[];
  onRemoveFile?: (index: number) => void;
  className?: string;
}

export function ChatInputPanel({
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  onFileSelect,
  isSending = false,
  isListening = false,
  voiceEnabled = true,
  cameraEnabled = false,
  onCameraToggle,
  pendingFiles = [],
  onRemoveFile,
  className,
}: ChatInputPanelProps) {
  const [input, setInput] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;

    const messageText = input.trim();
    setInput("");

    try {
      await onSendMessage(messageText);
    } catch (error) {
      // Error is handled by parent component
      setInput(messageText); // Restore input on error
    }
  }, [input, isSending, onSendMessage]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
      setIsVoiceMode(true);
    }
  }, [isListening, onVoiceStart, onVoiceStop]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onFileSelect?.(files);
      }
      // Reset input
      event.target.value = "";
    },
    [onFileSelect]
  );

  const canSend = input.trim().length > 0 && !isSending;

  return (
    <div className={cn("border-t border-gray-200 bg-white p-4", className)}>
      {/* Pending Files Preview */}
      {pendingFiles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="truncate max-w-32">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                onClick={() => onRemoveFile?.(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Voice Mode Indicator */}
      {isVoiceMode && isListening && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex space-x-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" style={{ animationDelay: "0.2s" }}></div>
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" style={{ animationDelay: "0.4s" }}></div>
          </div>
          <span className="text-sm text-red-700">Listening... Speak now</span>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* File Upload Button */}
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          <ImagePlus className="h-4 w-4" />
          <span className="sr-only">Upload files</span>
        </Button>

        {/* Camera Toggle Button */}
        {onCameraToggle && (
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "flex-shrink-0",
              cameraEnabled && "bg-blue-50 border-blue-200 text-blue-600"
            )}
            onClick={onCameraToggle}
            disabled={isSending}
          >
            {cameraEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span className="sr-only">
              {cameraEnabled ? "Turn off camera" : "Turn on camera"}
            </span>
          </Button>
        )}

        {/* Voice Toggle Button */}
        {voiceEnabled && (
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "flex-shrink-0",
              isListening && "bg-red-50 border-red-200 text-red-600"
            )}
            onClick={handleVoiceToggle}
            disabled={isSending}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span className="sr-only">
              {isListening ? "Stop voice input" : "Start voice input"}
            </span>
          </Button>
        )}

        {/* Text Input */}
        <div className="flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="min-h-10 resize-none border-gray-200 focus:border-blue-300"
            disabled={isSending || isVoiceMode}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          size="icon"
        >
          {isSending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Voice Mode Toggle */}
      {voiceEnabled && (
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className={cn(
              "text-xs",
              isVoiceMode ? "text-red-600" : "text-gray-500"
            )}
          >
            {isVoiceMode ? <VolumeX className="mr-1 h-3 w-3" /> : <Volume2 className="mr-1 h-3 w-3" />}
            {isVoiceMode ? "Voice mode" : "Text mode"}
          </Button>
        </div>
      )}
    </div>
  );
}