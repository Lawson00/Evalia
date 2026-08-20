import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamForge – Assessment Management Platform",
  description: "Professional online examination and assessment management system for administrators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
