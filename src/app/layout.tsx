import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Noto_Sans_Gurmukhi, Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";

import { AuthProvider } from "@/components/auth-provider";
import { DisableNativeValidation } from "@/components/disable-native-validation";
import { SiteDisclaimer } from "@/components/disclaimer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/seo";
import { THEME_BOOTSTRAP } from "@/lib/theme";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-telugu",
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
});

const notoKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
});

const notoMalayalam = Noto_Sans_Malayalam({
  variable: "--font-malayalam",
  subsets: ["malayalam"],
  weight: ["400", "500", "600", "700"],
});

const notoGujarati = Noto_Sans_Gujarati({
  variable: "--font-gujarati",
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
});

const notoGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-gurmukhi",
  subsets: ["gurmukhi"],
  weight: ["400", "500", "600", "700"],
});

const regionalFontClass = [
  notoDevanagari.variable,
  notoBengali.variable,
  notoTamil.variable,
  notoTelugu.variable,
  notoKannada.variable,
  notoMalayalam.variable,
  notoGujarati.variable,
  notoGurmukhi.variable,
].join(" ");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geist.variable} ${fraunces.variable} ${regionalFontClass} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full max-w-full min-w-0 flex-col overflow-x-hidden antialiased">
        <ThemeProvider>
          <AuthProvider>
            <DisableNativeValidation />
            <SiteHeader />
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>
            <SiteDisclaimer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
