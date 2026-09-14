import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";

import { AuthProvider } from "@/components/auth-provider";
import { DisableNativeValidation } from "@/components/disable-native-validation";
import { SiteDisclaimer } from "@/components/disclaimer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const SITE_TITLE = "MYTHH — or truth?";
const SITE_DESCRIPTION =
  "Swipe through popular claims, choose Fact or Myth, and read a short AI write-up. For curiosity, not professional advice.";

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: SITE_TITLE,
    template: "%s · MYTHH",
  },
  description: SITE_DESCRIPTION,
  applicationName: "MYTHH",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "MYTHH",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full max-w-full min-w-0 flex-col overflow-x-hidden antialiased">
        <AuthProvider>
          <DisableNativeValidation />
          <SiteHeader />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>
          <SiteDisclaimer />
        </AuthProvider>
      </body>
    </html>
  );
}
