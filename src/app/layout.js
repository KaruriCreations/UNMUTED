import { Space_Grotesk, Outfit, Chivo_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: {
    template: "%s | Unmuted",
    default: "Unmuted - Unmute the Internet",
  },
  description: "Unmute the internet - Watch TikTok videos and join uncensored discussions",
  openGraph: {
    title: "Unmuted - Unmute the Internet",
    description: "Watch TikTok videos and join uncensored discussions",
    url: "https://unmuted.app",
    siteName: "Unmuted",
    images: [
      {
        url: "https://unmuted.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Unmuted - Unmute the Internet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unmuted - Unmute the Internet",
    description: "Watch TikTok videos and join uncensored discussions",
    images: ["https://unmuted.app/twitter-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${outfit.variable} ${chivoMono.variable} dark antialiased h-full`}
    >
      <body className="min-h-full flex flex-col font-body selection:bg-primary selection:text-background-dark">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
