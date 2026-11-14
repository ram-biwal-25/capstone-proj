import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | FarmWard",
    default: "FarmWard — Digital Farm Management & Biosecurity Portal",
  },
  description: "Internal farm biosecurity self-assessments and record keeping for pig and poultry farms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
