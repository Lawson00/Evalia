import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assessment AI — AI-Powered Online Assessment Platform",
  description:
    "Assessment AI is a secure online assessment platform for creating assessments, conducting monitored examinations, and analyzing candidate performance with AI-assisted tools.",
  openGraph: {
    title: "Assessment AI — AI-Powered Online Assessment Platform",
    description:
      "Assessment AI is a secure online assessment platform for creating assessments, conducting monitored examinations, and analyzing candidate performance with AI-assisted tools.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
