"use client";
// LocaleToggle — compact EN/ES language switcher for the HUD header

import { useStore } from "@/store/useStore";

export function LocaleToggle({ size = "sm" }: { size?: "sm" | "md" }) {
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);

  const toggle = () => setLocale(locale === "es" ? "en" : "es");
  const dim = size === "sm" ? "w-9 h-5" : "w-12 h-7";

  return (
    <button
      onClick={toggle}
      title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
      className={`${dim} rounded-full relative flex items-center transition-all duration-300 cursor-pointer shrink-0`}
      style={{
        background: "var(--z-glass-bg)",
        border: "1px solid var(--z-border)",
      }}
    >
      <span
        className="absolute text-[7px] font-black tracking-wider transition-all duration-300"
        style={{
          color: "var(--z-cyan)",
          left: locale === "es" ? "3px" : "auto",
          right: locale === "en" ? "3px" : "auto",
        }}
      >
        {locale.toUpperCase()}
      </span>
    </button>
  );
}
