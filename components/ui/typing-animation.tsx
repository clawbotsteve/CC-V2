"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-word typing animation. Types out `text` once and stops.
 */
interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
}

export function TypingAnimation({
  text,
  duration = 200,
  className,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [i, setI] = useState<number>(0);

  useEffect(() => {
    const typingEffect = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [duration, i, text]);

  return (
    <h1
      className={cn(
        "font-display text-center text-4xl font-bold leading-[5rem] tracking-[-0.02em] drop-shadow-sm",
        className,
      )}
    >
      {displayedText ? displayedText : text}
    </h1>
  );
}

/**
 * Cycling typing animation — types out a word, pauses, erases, types
 * the next, loops forever. Used in the dashboard hero to communicate
 * that TraviaLabs isn't only for AI influencers but also AI fitness
 * coaches, AI UGC creators, etc. Each cycle takes ~5–6 seconds per word.
 *
 * Phases (per word):
 *   1. type       — characters appear one at a time at `typeSpeed`
 *   2. holdAfter  — full word displayed for `holdAfterMs`
 *   3. erase      — characters removed one at a time at `eraseSpeed`
 *   4. holdBefore — empty string displayed for `holdBeforeMs` (cursor
 *                   blinks visibly) before the next word starts
 *
 * Renders inline (a <span>) so it can be embedded mid-sentence inside
 * a larger heading without breaking flow.
 */
interface CyclingTypingAnimationProps {
  /** Words to cycle through, in order. Loops back to the first when the
   *  last finishes. */
  words: string[];
  /** ms per character on type-in. Default 90ms. */
  typeSpeed?: number;
  /** ms per character on erase. Default 45ms (faster than typing). */
  eraseSpeed?: number;
  /** ms to hold the fully-typed word before erasing. Default 1800ms. */
  holdAfterMs?: number;
  /** ms to hold empty before typing the next word. Default 250ms. */
  holdBeforeMs?: number;
  className?: string;
}

export function CyclingTypingAnimation({
  words,
  typeSpeed = 90,
  eraseSpeed = 45,
  holdAfterMs = 1800,
  holdBeforeMs = 250,
  className,
}: CyclingTypingAnimationProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] =
    useState<"type" | "holdAfter" | "erase" | "holdBefore">("type");

  useEffect(() => {
    if (words.length === 0) return;
    const currentWord = words[wordIndex];

    let timer: NodeJS.Timeout;

    if (phase === "type") {
      if (displayed.length < currentWord.length) {
        timer = setTimeout(() => {
          setDisplayed(currentWord.substring(0, displayed.length + 1));
        }, typeSpeed);
      } else {
        timer = setTimeout(() => setPhase("holdAfter"), 0);
      }
    } else if (phase === "holdAfter") {
      timer = setTimeout(() => setPhase("erase"), holdAfterMs);
    } else if (phase === "erase") {
      if (displayed.length > 0) {
        timer = setTimeout(() => {
          setDisplayed(displayed.substring(0, displayed.length - 1));
        }, eraseSpeed);
      } else {
        timer = setTimeout(() => setPhase("holdBefore"), 0);
      }
    } else if (phase === "holdBefore") {
      timer = setTimeout(() => {
        setWordIndex((wordIndex + 1) % words.length);
        setPhase("type");
      }, holdBeforeMs);
    }

    return () => clearTimeout(timer);
  }, [
    phase,
    displayed,
    wordIndex,
    words,
    typeSpeed,
    eraseSpeed,
    holdAfterMs,
    holdBeforeMs,
  ]);

  return (
    <span className={cn("inline-block", className)}>
      {displayed}
      {/* Pure-CSS blinking cursor at the end of the typed text. */}
      <span
        aria-hidden
        className="ml-1 inline-block w-[0.06em] h-[0.85em] -mb-[0.05em] bg-current align-baseline"
        style={{ animation: "typing-cursor-blink 1s steps(1) infinite" }}
      />
      <style jsx>{`
        @keyframes typing-cursor-blink {
          0%,
          50% {
            opacity: 1;
          }
          50.01%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
}
