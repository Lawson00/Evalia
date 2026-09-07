import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Evalia — AI-Powered Online Assessment Platform",
  description:
    "Evalia is a secure online assessment platform for creating assessments, conducting monitored examinations, and analyzing candidate performance with AI-assisted tools.",
  openGraph: {
    title: "Evalia — AI-Powered Online Assessment Platform",
    description:
      "Evalia is a secure online assessment platform for creating assessments, conducting monitored examinations, and analyzing candidate performance with AI-assisted tools.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
