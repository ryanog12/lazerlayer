import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#1c1d21", colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "LazerLayer — Precision 3D Printing",
    template: "%s · LazerLayer",
  },
  description:
    "LazerLayer prints high-quality FDM and resin parts, figures and decor — and custom prints from your own files or ideas.",
  keywords: ["3D printing", "custom 3D prints", "STL printing", "resin printing", "prototyping"],
  openGraph: {
    title: "LazerLayer — Precision 3D Printing",
    description: "Shop ready-made prints or request a custom 3D print.",
    siteName: "LazerLayer",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <CartProvider>
          {children}
          <Toaster theme="dark" richColors position="top-center" />
        </CartProvider>
      </body>
    </html>
  );
}
