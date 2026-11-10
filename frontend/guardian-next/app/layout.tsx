import "./theme.css";
import "./globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { LedgerProvider } from "@/lib/ledger-store";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata = {
  title: "Guardian AI · Living Claim Ledger",
  description: "Every claim tied to its source",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <LedgerProvider>{children}</LedgerProvider>
      </body>
    </html>
  );
}
