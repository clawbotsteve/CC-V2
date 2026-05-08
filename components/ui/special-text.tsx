"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Glitchy "scramble-then-reveal" text effect (a.k.a. "decoder" or
 * "matrix" type animation). Two phases:
 *
 *   Phase 1: random characters fly in left-to-right until the slot
 *            count matches the target text length.
 *   Phase 2: characters resolve from random → final text, one
 *            position per tick. While a position is settling we
 *            briefly show "_" before the real character appears.
 *
 * Original component spec courtesy of the user; minor adaptations:
 *   - Switched to `cn()` so consumers can override the hardcoded
 *     font-mono / size classes (we use it inside a font-display
 *     gradient hero heading).
 *   - All other behavior preserved verbatim from the source.
 *
 * NOTE: this only animates ONCE per mount. To cycle through multiple
 * phrases, re-mount via a changing `key` prop — see
 * `CyclingSpecialText` below.
 */

interface SpecialTextProps {
  children: string;
  speed?: number;
  delay?: number;
  className?: string;
  inView?: boolean;
  once?: boolean;
}

const RANDOM_CHARS = "_!X$0-+*#";

function getRandomChar(prevChar?: string): string {
  let char: string;
  do {
    char = RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
  } while (char === prevChar);
  return char;
}

export function SpecialText({
  children,
  speed = 20,
  delay = 0,
  className = "",
  inView = false,
  once = true,
}: SpecialTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once, margin: "-100px" });
  const shouldAnimate = inView ? isInView : true;
  const [hasStarted, setHasStarted] = useState(() => !inView && delay <= 0);
  const text = children;
  const [displayText, setDisplayText] = useState<string>(
    " ".repeat(text.length),
  );
  const [currentPhase, setCurrentPhase] = useState<"phase1" | "phase2">(
    "phase1",
  );
  const [animationStep, setAnimationStep] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeoutRef = useRef<number | null>(null);

  function clearStartTimeout() {
    if (startTimeoutRef.current === null) return;
    window.clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = null;
  }

  function startAnimation() {
    setHasStarted(true);
    setDisplayText(" ".repeat(text.length));
    setCurrentPhase("phase1");
    setAnimationStep(0);
  }

  const runPhase1 = () => {
    const maxSteps = text.length * 2;
    const currentLength = Math.min(animationStep + 1, text.length);

    const chars: string[] = [];
    for (let i = 0; i < currentLength; i++) {
      const prevChar = i > 0 ? chars[i - 1] : undefined;
      chars.push(getRandomChar(prevChar));
    }

    for (let i = currentLength; i < text.length; i++) {
      chars.push(" ");
    }

    setDisplayText(chars.join(""));

    if (animationStep < maxSteps - 1) {
      setAnimationStep((prev) => prev + 1);
    } else {
      setCurrentPhase("phase2");
      setAnimationStep(0);
    }
  };

  const runPhase2 = () => {
    const revealedCount = Math.floor(animationStep / 2);
    const chars: string[] = [];

    for (let i = 0; i < revealedCount && i < text.length; i++) {
      chars.push(text[i]);
    }

    if (revealedCount < text.length) {
      if (animationStep % 2 === 0) {
        chars.push("_");
      } else {
        chars.push(getRandomChar());
      }
    }

    for (let i = chars.length; i < text.length; i++) {
      chars.push(getRandomChar());
    }

    setDisplayText(chars.join(""));

    if (animationStep < text.length * 2 - 1) {
      setAnimationStep((prev) => prev + 1);
    } else {
      setDisplayText(text);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (shouldAnimate && !hasStarted) {
      clearStartTimeout();
      if (delay <= 0) {
        startAnimation();
        return;
      }
      startTimeoutRef.current = window.setTimeout(() => {
        startTimeoutRef.current = null;
        startAnimation();
      }, delay * 1000);
    }
    return () => clearStartTimeout();
  }, [shouldAnimate, hasStarted, delay, text.length]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentPhase === "phase1") {
        runPhase1();
      } else {
        runPhase2();
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, animationStep, text, speed, hasStarted]);

  useEffect(() => {
    if (hasStarted) {
      setDisplayText(" ".repeat(text.length));
      setCurrentPhase("phase1");
      setAnimationStep(0);
    }

    return () => {
      clearStartTimeout();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, hasStarted]);

  return (
    <span
      ref={containerRef}
      // Defaults match the original component (font-mono compact size);
      // cn() lets callers override with their own font + sizing for
      // bigger contexts (we override with font-display in the hero).
      className={cn(
        "h-4.5 leading-5 inline-flex font-mono font-medium",
        className,
      )}
    >
      {displayText}
    </span>
  );
}

/**
 * Cycles SpecialText through a list of phrases. Each phrase scrambles
 * in, holds for `holdMs`, then we re-mount with the next phrase via a
 * changing `key` so SpecialText runs its enter animation again.
 *
 * Width is reserved by an invisible sibling rendering the longest
 * phrase — keeps the gradient heading from reflowing as phrases of
 * different lengths cycle. Same trick CyclingTypingAnimation uses.
 */
interface CyclingSpecialTextProps {
  phrases: string[];
  /** Per-character animation speed, ms. Higher = slower scramble. */
  speed?: number;
  /** How long to hold the resolved text before starting the next phrase, ms. */
  holdMs?: number;
  className?: string;
}

export function CyclingSpecialText({
  phrases,
  speed = 20,
  holdMs = 2200,
  className,
}: CyclingSpecialTextProps) {
  const [idx, setIdx] = useState(0);
  // Each phrase mount needs a unique key so SpecialText restarts even
  // if the SAME phrase repeats consecutively (single-element array).
  const [run, setRun] = useState(0);

  // Estimate Phase 1 + Phase 2 total duration: 2 × text.length steps
  // for each phase, at `speed` ms per step. Add the user's `holdMs`
  // hold-on-screen window after that, then advance.
  const current = phrases[idx];
  useEffect(() => {
    const animMs = current.length * 2 * speed * 2;
    const total = animMs + holdMs;
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % phrases.length);
      setRun((r) => r + 1);
    }, total);
    return () => clearTimeout(t);
  }, [current, speed, holdMs, phrases.length]);

  // Reserve width for the longest phrase so the heading doesn't reflow.
  const longest = phrases.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span className="relative inline-block">
      <span aria-hidden className="invisible whitespace-pre">
        {longest}
      </span>
      <span className="absolute inset-0 whitespace-pre">
        <SpecialText key={`${idx}-${run}`} speed={speed} className={className}>
          {current}
        </SpecialText>
      </span>
    </span>
  );
}
