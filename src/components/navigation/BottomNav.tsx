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

const TABS: { id: string; Icon: LucideIcon; labelKey: TranslationKey }[] = [
  { id: 'telemetry',  Icon: Activity,       labelKey: 'nav_hud'      },
  { id: 'weather',    Icon: CloudLightning, labelKey: 'nav_radar'    },
  { id: 'forecast',   Icon: BarChart2,      labelKey: 'nav_forecast' },
  { id: 'map',        Icon: Navigation,     labelKey: 'nav_map'      },
  { id: 'log',        Icon: BookOpen,       labelKey: 'nav_log'      },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none px-6">
      <nav 
        className="pointer-events-auto rounded-[32px] w-full max-w-[360px] transition-all"
        style={{ 
          background: 'var(--z-glass-bg)', 
          backdropFilter: 'var(--z-glass-blur)',
          WebkitBackdropFilter: 'var(--z-glass-blur)',
          border: '0.5px solid var(--z-border)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.08)'
        }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          {TABS.map(({ id, Icon, labelKey }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-label={t(labelKey)}
                className="relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95"
                style={{ width: '56px' }}
              >
                <Icon
                  className="w-[22px] h-[22px] mb-1.5"
                  style={{
                    color: isActive ? 'var(--z-cyan)' : 'var(--z-muted)',
                  }}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span
                  className="text-[9px] font-bold tracking-widest uppercase"
                  style={{ color: isActive ? 'var(--z-cyan)' : 'var(--z-muted)' }}
                >
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
