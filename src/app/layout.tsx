import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query/provider";
import { Toaster } from "sonner";
import { env } from "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description: "A professional Next.js starter template with best practices",
  keywords: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: env.NEXT_PUBLIC_APP_NAME,
    title: env.NEXT_PUBLIC_APP_NAME,
    description: "A professional Next.js starter template",
  },
  twitter: {
    card: "summary_large_image",
    title: env.NEXT_PUBLIC_APP_NAME,
    description: "A professional Next.js starter template",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
