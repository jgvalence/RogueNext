import type { Metadata, Viewport } from "next";
import "./globals.css";
import "antd/dist/reset.css";
import { QueryProvider } from "@/lib/query/provider";
import { Toaster } from "sonner";
import { env } from "@/lib/env";
import { AntdProvider } from "@/components/providers/AntdProvider";
import { DevtoolsConsoleWarning } from "@/components/shared/DevtoolsConsoleWarning";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { GlobalLanguageDock } from "@/components/shared/GlobalLanguageDock";
import { RouteMusicGuard } from "@/components/shared/RouteMusicGuard";
import { DevServiceWorkerReset } from "@/components/shared/DevServiceWorkerReset";
import { PwaManager } from "@/components/shared/PwaManager";
import { MenuShell } from "@/components/shared/MenuShell";

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description: "Un deckbuilder roguelite dans une bibliothèque de mythologies.",
  keywords: ["Panlibrarium", "deckbuilder", "roguelite", "mythologies"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: env.NEXT_PUBLIC_APP_NAME,
    title: env.NEXT_PUBLIC_APP_NAME,
    description:
      "Explorez les mythologies, composez votre deck et maîtrisez l’Encre.",
  },
  twitter: {
    card: "summary_large_image",
    title: env.NEXT_PUBLIC_APP_NAME,
    description:
      "Explorez les mythologies, composez votre deck et maîtrisez l’Encre.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: env.NEXT_PUBLIC_APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <I18nProvider>
          <AntdProvider>
            <DevServiceWorkerReset />
            <PwaManager />
            <DevtoolsConsoleWarning />
            <RouteMusicGuard />
            <GlobalLanguageDock />
            <QueryProvider>
              <MenuShell>{children}</MenuShell>
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </AntdProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
