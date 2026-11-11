import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farm Biosecurity Portal",
  description: "Internal farm biosecurity self-assessments",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
