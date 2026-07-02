import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clashpin - Premium CoC Giveaway",
  description: "Platform undian profesional untuk klan Clash of Clans.",
  icons: {
    icon: '/icon.png', // Mengarah otomatis ke file src/app/icon.png
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-background text-foreground selection:bg-elixir selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}