import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@radix-ui/react-toast";

const monumentGroteskSans = localFont({
  src: "./fonts/MonumentGrotesk-Regular.ttf",
  variable: "--font-monument-grotesk",
  weight: "100 900",
});
const monumentGroteskMono = localFont({
  src: "./fonts/MonumentGrotesk-Mono.ttf",
  variable: "--font-monument-grotesk-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Invitation Generator",
  description: "Invitation Generator for events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${monumentGroteskSans.variable} ${monumentGroteskMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
