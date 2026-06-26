"use client";
// BottomNav — Redesign Premium v4.0
// i18n-ready — now includes LOG tab

import { Activity, CloudLightning, Wind, Navigation, BookOpen, BarChart2, type LucideIcon } from "lucide-react";
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
  { id: 'wind',       Icon: Wind,           labelKey: 'nav_wind'     },
  { id: 'forecast',   Icon: BarChart2,      labelKey: 'nav_forecast' },
  { id: 'map',        Icon: Navigation,     labelKey: 'nav_map'      },
  { id: 'log',        Icon: BookOpen,       labelKey: 'nav_log'      },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none px-4">
      <nav 
        className="pointer-events-auto rounded-[20px] w-[95%] max-w-[420px] transition-all"
        style={{ 
          background: 'var(--z-glass-bg)', 
          backdropFilter: 'var(--z-glass-blur)',
          WebkitBackdropFilter: 'var(--z-glass-blur)',
          border: '0.5px solid rgba(0,0,0,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          {TABS.map(({ id, Icon, labelKey }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-label={t(labelKey)}
                className="relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95"
                style={{ 
                    width: '56px',
                    color: isActive ? 'var(--z-cyan)' : 'var(--z-muted)'
                }}
              >
                <div className="relative">
                  <Icon size={20} className="transition-all duration-300" strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                  
                <span className="text-[9px] font-medium tracking-widest uppercase transition-all duration-300 mt-1">
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
