import "./theme.css";
import "./globals.css";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { LedgerProvider } from "@/lib/ledger-store";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Guardian AI · Living Claim Ledger",
  description: "Every claim tied to its source",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${ibmPlexMono.variable}`}>
        <LedgerProvider>{children}</LedgerProvider>
      </body>
    </html>
  );
}
