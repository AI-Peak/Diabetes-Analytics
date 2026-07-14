import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Diabetes Analytics — BRFSS 2015",
    template: "%s | Diabetes Analytics",
  },
  description: "An evidence-first research and education dashboard for the CDC BRFSS 2015 diabetes study. Not a diagnostic device.",
};

const themeScript = `
  (() => {
    try {
      const stored = localStorage.getItem('diabetes-theme');
      const theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = theme;
    } catch (_) {}
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
