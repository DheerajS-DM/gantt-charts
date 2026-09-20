import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GanttFlow - Division & Master Timeline Tracker",
  description: "Interactive timeline tracking system with division views (Division 1, Division 2, Division 3, Division 4), dual-mode master view, and CSV import/export.",
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
