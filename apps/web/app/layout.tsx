import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Letlotlo la Temo",
  description: "AI farming assistant and community for Botswana."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
