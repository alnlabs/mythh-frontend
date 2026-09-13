import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";

import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/header";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MYTHH — or truth?",
    template: "%s · MYTHH",
  },
  description:
    "Swipe through popular claims, choose Fact or Myth, and read the explanation.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full max-w-full min-w-0 flex-col overflow-x-hidden antialiased">
        <AuthProvider>
          <Header />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
