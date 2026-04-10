import { Space_Grotesk, Outfit, Chivo_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Unmuted",
  description: "Unmute the internet",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${outfit.variable} ${chivoMono.variable} dark antialiased h-full`}
    >
      <body className="min-h-full flex flex-col font-body selection:bg-primary selection:text-background-dark">
        {children}
      </body>
    </html>
  );
}
