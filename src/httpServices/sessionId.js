"use client";
export function generateNewSession() {
  return (
    "session-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11)
  );
}
