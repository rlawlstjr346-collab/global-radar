import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Radar",
  description: "Map-based search across secondhand marketplaces worldwide",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
