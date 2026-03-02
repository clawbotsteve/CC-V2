"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const activeTheme = theme === "system" ? "system" : theme;

  return (
    <div className="inline-flex rounded-sm border border-gray-300 overflow-hidden">
      <Button
        size="sm"
        variant={activeTheme === "light" ? "default" : "outline"}
        onClick={() => setTheme("light")}
        className="rounded-none px-3 py-1"
        aria-label="Light theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <div className="w-px bg-gray-300" />
      <Button
        size="sm"
        variant={activeTheme === "dark" ? "default" : "outline"}
        onClick={() => setTheme("dark")}
        className="rounded-none px-3 py-1"
        aria-label="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <div className="w-px bg-gray-300" />
      <Button
        size="sm"
        variant={activeTheme === "system" ? "default" : "outline"}
        onClick={() => setTheme("system")}
        className="rounded-none px-3 py-1"
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}
