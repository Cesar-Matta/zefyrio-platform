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
    <nav className="absolute bottom-0 left-0 right-0 z-20 z-nav pb-safe pointer-events-auto">
      <div className="flex items-center justify-between px-6 pt-3 pb-6 max-w-md mx-auto">
        {TABS.map(({ id, Icon, labelKey }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label={t(labelKey)}
              className="relative flex flex-col items-center justify-center cursor-pointer transition-colors duration-200"
              style={{ width: '60px' }}
            >
              <Icon
                className="w-6 h-6 mb-1"
                style={{
                  color: isActive ? 'var(--z-cyan)' : 'var(--color-system-gray)',
                }}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="text-[10px] font-medium tracking-tight"
                style={{ color: isActive ? 'var(--z-cyan)' : 'var(--color-system-gray)' }}
              >
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
