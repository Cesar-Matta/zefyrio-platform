"use client";
// SKILL: ui-ux-pro-max | stitch-premium-ux-master
// BottomNav — Redesign Premium v4.0

import { Activity, CloudLightning, Navigation } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'telemetry', Icon: Activity,       label: 'HUD',   accent: 'var(--z-cyan)' },
  { id: 'weather',   Icon: CloudLightning, label: 'RADAR', accent: '#ffb800'        },
  { id: 'map',       Icon: Navigation,     label: 'MAP',   accent: '#00ff66'        },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { isDark } = useTheme();

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
        {TABS.map(({ id, Icon, label, accent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              className="relative flex flex-col items-center justify-center rounded-full cursor-pointer transition-all duration-200"
              style={{
                width: '64px',
                height: '52px',
                background: isActive ? `${accent}18` : 'transparent',
              }}
            >
              <Icon
                className="w-[22px] h-[22px] transition-all duration-200"
                style={{
                  color: isActive ? accent : 'var(--z-muted)',
                  filter: isActive ? `drop-shadow(0 0 6px ${accent})` : 'none',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span
                className="text-[7px] font-bold uppercase tracking-widest mt-0.5 transition-all duration-200"
                style={{ color: isActive ? accent : 'var(--z-muted)', opacity: isActive ? 1 : 0.6 }}
              >
                {label}
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
