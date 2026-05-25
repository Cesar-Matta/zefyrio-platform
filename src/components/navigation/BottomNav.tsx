"use client";
// BottomNav — Redesign Premium v4.0
// i18n-ready — now includes LOG tab

import { Activity, CloudLightning, Navigation, BookOpen, BarChart2, type LucideIcon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS: { id: string; Icon: LucideIcon; labelKey: TranslationKey; accent: string }[] = [
  { id: 'telemetry',  Icon: Activity,       labelKey: 'nav_hud',       accent: 'var(--z-cyan)' },
  { id: 'weather',    Icon: CloudLightning, labelKey: 'nav_radar',     accent: '#ffb800'        },
  { id: 'forecast',   Icon: BarChart2,      labelKey: 'nav_forecast',  accent: '#f97316'        },
  { id: 'map',        Icon: Navigation,     labelKey: 'nav_map',       accent: '#00ff66'        },
  { id: 'log',        Icon: BookOpen,       labelKey: 'nav_log',       accent: '#a78bfa'        },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <nav className="absolute bottom-0 left-0 right-0 flex justify-center items-end pb-6 pt-16 z-20 pointer-events-none"
      style={{
        background: isDark
          ? 'linear-gradient(to top, var(--z-surface) 40%, transparent)'
          : 'linear-gradient(to top, var(--z-bg) 40%, transparent)',
      }}>
      <div
        className="flex items-center rounded-full px-2 py-2 gap-1 pointer-events-auto"
        style={{
          background: 'var(--z-nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--z-border)',
          boxShadow: 'var(--z-shadow)',
        }}
      >
        {TABS.map(({ id, Icon, labelKey, accent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label={t(labelKey)}
              className="relative flex flex-col items-center justify-center rounded-full cursor-pointer transition-all duration-200"
              style={{
                width: '56px',
                height: '48px',
                background: isActive ? `${accent}18` : 'transparent',
              }}
            >
              <Icon
                className="w-[20px] h-[20px] transition-all duration-200"
                style={{
                  color: isActive ? accent : 'var(--z-muted)',
                  filter: isActive ? `drop-shadow(0 0 6px ${accent})` : 'none',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span
                className="text-[6px] font-bold uppercase tracking-widest mt-0.5 transition-all duration-200"
                style={{ color: isActive ? accent : 'var(--z-muted)', opacity: isActive ? 1 : 0.6 }}
              >
                {t(labelKey)}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
