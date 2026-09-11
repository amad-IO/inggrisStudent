import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Use Inter for clean UI (very readable on all devices)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Use Lora for reading text (proven highly readable for long passages)
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "EPRT Interactive Practice",
  description: "Test your English Reading and Grammar proficiency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-[#F8FAFC] text-[#334155] antialiased">
        {children}
      </body>
    </html>
  );
}
