import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI College Admissions Navigator (Prototype)",
  description: "Solo prototype: AI-driven college matching and admission probability estimates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
