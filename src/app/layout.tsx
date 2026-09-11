import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "InggrisStudent — English Proficiency Practice",
  description: "Interactive EPRT & TOEFL preparation platform with authentic passages and structured exercises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased selection:bg-[#FDE047] selection:text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}
