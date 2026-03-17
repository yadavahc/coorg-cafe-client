import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coorg Cafe | Premium Coffee Experience",
  description: "Experience the rich flavor of Coorg's finest coffee with our modern QR-based ordering system. Real-time tracking and premium beans.",
  openGraph: {
    title: "Coorg Cafe | Premium Coffee Experience",
    description: "Order coffee from your table with a simple scan. Premium beans, real-time tracking.",
    type: "website",
    url: "https://coorg-cafe.vercel.app",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Coorg Cafe Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coorg Cafe | Premium Coffee Experience",
    description: "Modern QR-based cafe management system for the best coffee experience.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
