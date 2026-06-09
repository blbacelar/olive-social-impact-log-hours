import type { Metadata } from "next";

import { AppShellLoader } from "@/components/app-shell-loader";

import "./globals.css";

export const metadata: Metadata = {
  title: "Olive Social Impact | Time Tracker",
  description: "Consulting and development time tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppShellLoader>{children}</AppShellLoader>
      </body>
    </html>
  );
}
