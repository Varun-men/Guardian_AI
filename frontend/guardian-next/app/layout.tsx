import "./globals.css";
import "./theme.css";
import { IBM_Plex_Sans, IBM_Plex_Mono, Outfit } from "next/font/google";
import { LedgerProvider } from "@/lib/ledger-store";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans" });
const display = Outfit({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono" });

export const metadata = { title: "Guardian AI · Living Claim Ledger" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${display.variable}`}>
        <LedgerProvider>{children}</LedgerProvider>
      </body>
    </html>
  );
}
