import type { Metadata, Viewport } from "next";
import {
  Archivo_Black,
  Bricolage_Grotesque,
  DM_Serif_Display,
  Fraunces,
  Geist,
  Geist_Mono,
  Inter,
  Manrope,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
  Space_Mono,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Slide fonts: the same families the server renderer uses, so previews match the final images.
// Not preloaded; browsers only fetch the ones a page actually shows. (next/font needs literal options.)
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], preload: false });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"], preload: false });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin", "latin-ext"], preload: false, weight: "400" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin", "latin-ext"], preload: false });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin", "latin-ext"], preload: false, weight: ["400", "700"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin", "latin-ext"], preload: false });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin", "latin-ext"], preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin", "latin-ext"], preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"], preload: false });
const archivo = Archivo_Black({ variable: "--font-archivo-black", subsets: ["latin", "latin-ext"], preload: false, weight: "400" });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin", "latin-ext"], preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"], preload: false });

const fontVars = [geist, geistMono, inter, jakarta, dmSerif, spaceGrotesk, spaceMono, sora, outfit, playfair, fraunces, archivo, bricolage, manrope]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: {
    default: "Cadence: your social media posts, written and designed daily",
    template: "%s · Cadence",
  },
  description:
    "Cadence writes and designs a post for LinkedIn, Instagram and more from your content calendar every day, then emails it to you ready to publish. Carousels, images and short videos.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07070b" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7fa" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVars} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
