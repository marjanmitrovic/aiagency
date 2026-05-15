import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marjan Dev | AI automatizacija, web aplikacije i Vercel sajtovi",
  description:
    "Portfolio landing strana za AI automatizaciju, web aplikacije, CRM sisteme i moderne Vercel prezentacije.",
  openGraph: {
    title: "Marjan Dev | AI automatizacija i web aplikacije",
    description:
      "Brzi, moderni sajtovi i AI workflow sistemi za male firme.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  );
}
