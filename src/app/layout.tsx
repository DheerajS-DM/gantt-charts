import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GanttFlow - Department & Master Timeline Tracker",
  description: "Interactive timeline tracking system with department views (CS, Mechanical, Electrical, Management), dual-mode master view, and CSV import/export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
