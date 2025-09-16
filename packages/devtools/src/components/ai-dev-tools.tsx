"use client";

import { useEffect, useRef, useState } from "react";
import { defaultConfig, useAIDevtools } from "../hooks/use-ai-devtools";
import type { DevtoolsConfig, UseAIDevtoolsOptions } from "../types";
import { DevtoolsButton } from "./devtools-button";
import { DevtoolsPanel } from "./devtools-panel";

interface AIDevtoolsProps extends UseAIDevtoolsOptions {
  config?: Partial<DevtoolsConfig>;
  className?: string;
  debug?: boolean;
  modelId?: string; // Optional model ID for context insights
}


export function AIDevtools({
  enabled = true,
  maxEvents = 1000,
  onEvent,
  config = {},
  className = "",
  debug = false,
  modelId,
}: AIDevtoolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewEvents, setHasNewEvents] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<"bottom" | "right">("bottom");
  const previousEventCountRef = useRef(0);

  // Load panel state from localStorage on mount
  useEffect(() => {
    if (isMounted) {
      const savedState = localStorage.getItem("ai-devtools-panel-open");
      if (savedState !== null) {
        setIsOpen(JSON.parse(savedState));
      }
      const savedPosition = localStorage.getItem("ai-devtools-panel-position");
      if (
        savedPosition &&
        (savedPosition === "bottom" || savedPosition === "right")
      ) {
        setPosition(savedPosition);
      }
    }
  }, [isMounted]);

  // Save panel state to localStorage when it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("ai-devtools-panel-open", JSON.stringify(isOpen));
    }
  }, [isOpen, isMounted]);

  // Save position state to localStorage when it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("ai-devtools-panel-position", position);
    }
  }, [position, isMounted]);

  const finalConfig = { ...defaultConfig, ...config, position };

  // Toggle position between bottom and right
  const togglePosition = () => {
    setPosition((prev) => (prev === "bottom" ? "right" : "bottom"));
  };

  // Always call hooks (to maintain hook order)
  const { events, isCapturing, clearEvents, toggleCapturing } = useAIDevtools({
    enabled: enabled && isMounted, // Only enable after mounted
    maxEvents,
    onEvent,
    debug,
    streamCapture: finalConfig.streamCapture
      ? {
        enabled: finalConfig.streamCapture.enabled,
        endpoints: [finalConfig.streamCapture.endpoint],
        autoConnect: finalConfig.streamCapture.autoConnect,
      }
      : undefined,
    throttle: finalConfig.throttle,
  });

  // Hydration-safe mounting check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track new events for button animation (always call this hook)
  useEffect(() => {
    if (isMounted && events.length > previousEventCountRef.current) {
      setHasNewEvents(true);
      // Clear the animation after a short delay
      const timer = setTimeout(() => setHasNewEvents(false), 2000);
      return () => clearTimeout(timer);
    }
    previousEventCountRef.current = events.length;
  }, [events.length, isMounted]);

  // Don't render anything until mounted (hydration-safe)
  if (!isMounted) {
    return null;
  }

  if (!finalConfig.enabled) {
    return null;
  }

  return (
    <div className="ai-devtools">
      {/* Devtools button */}
      <DevtoolsButton
        onToggle={() => setIsOpen(!isOpen)}
        eventCount={events.length}
        hasNewEvents={hasNewEvents && !isOpen}
        className={className}
      />

      {/* Devtools panel */}
      {isOpen && (
        <DevtoolsPanel
          events={events}
          isCapturing={isCapturing}
          toggleCapturing={toggleCapturing}
          clearEvents={clearEvents}
          onClose={() => setIsOpen(false)}
          onTogglePosition={togglePosition}
          config={finalConfig}
          modelId={modelId}
        />
      )}
    </div>
  );
}
