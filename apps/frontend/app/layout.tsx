import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReplayLens - StarCraft II Replay Analytics",
  description: "Advanced StarCraft II replay analysis and match tracking. Analyze your SC2 replays, track match history, and gain insights from your StarCraft 2 gameplay.",
  keywords: ["StarCraft II", "SC2", "StarCraft 2", "replay analysis", "match tracker", "SC2 replays", "StarCraft analytics", "SC2 stats", "replay analyzer"],
  openGraph: {
    title: "ReplayLens - StarCraft II Replay Analytics",
    description: "Advanced StarCraft II replay analysis and match tracking platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplayLens - StarCraft II Replay Analytics",
    description: "Advanced StarCraft II replay analysis and match tracking platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navigation />
          <main className="ml-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
