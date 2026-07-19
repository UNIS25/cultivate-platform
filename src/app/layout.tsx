import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: {
    default: "CULTIVATE Next",
    template: "%s | CULTIVATE Next",
  },
  description: "A fictional demonstration platform for coordinated food sharing in Europe.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppShell dateLabel={formatDate(new Date())}>{children}</AppShell>
      </body>
    </html>
  );
}
