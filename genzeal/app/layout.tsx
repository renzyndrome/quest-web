import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/600.css";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenZeal",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
