import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import PwaRegistry from "@/components/PwaRegistry";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// ── Typography (Stitch Design System: Zefyrio Avionics / Zefyrio Horizon) ──
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d17" },
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Zefyrio",
  description: "Aero HUD Protocol — Aviation Weather & Drone Safety",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zefyrio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${firaCode.variable} h-full antialiased`}
      suppressHydrationWarning
      data-theme="dark"
    >
      <body className="min-h-full flex flex-col theme-transition" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <PwaRegistry />
      </body>
    </html>
  );
}
