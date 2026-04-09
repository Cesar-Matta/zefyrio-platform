"use client";
// SKILL: ui-ux-pro-max | animejs-animation | react-best-practices
// ThemeToggle — Animated sun/moon toggle para Dark/Light mode

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  size?: "sm" | "md";
  className?: string;
}

export function ThemeToggle({ size = "md", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const btnSize = size === "sm" 
    ? "w-8 h-8" 
    : "w-10 h-10";
  
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo Claro" : "Modo Oscuro"}
      className={`
        ${btnSize} rounded-full flex items-center justify-center
        border theme-transition cursor-pointer
        active:scale-95 hover:scale-105
        ${isDark 
          ? "bg-white/10 border-white/20 hover:bg-white/20 text-yellow-300 hover:text-yellow-200" 
          : "bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700 hover:text-slate-900"
        }
        ${className}
      `}
      style={{
        transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: isDark 
          ? "0 0 12px rgba(253, 224, 71, 0.15)" 
          : "0 2px 8px rgba(15, 23, 42, 0.08)",
      }}
    >
      {isDark ? (
        <Sun 
          className={`${iconSize} transition-transform duration-300`}
          style={{ filter: "drop-shadow(0 0 4px rgba(253, 224, 71, 0.4))" }}
        />
      ) : (
        <Moon 
          className={`${iconSize} transition-transform duration-300`}
        />
      )}
    </button>
  );
}
