"use client";

import { useEffect, useRef } from "react";

export function AffiliateCapture() {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    fetch("/api/affiliate/capture", { method: "POST" }).catch(() => {
      // Silent fail — affiliate capture is non-critical
    });
  }, []);

  return null;
}
