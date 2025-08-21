import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Bulk Link Creator",
  description: "Create bulk short links with custom slugs",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}