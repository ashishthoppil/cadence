import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist, Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Slide fonts — the same families the Satori renderer uses, so previews match the final images.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: {
    default: "Cadence — your social calendar on autopilot",
    template: "%s · Cadence",
  },
  description:
    "Cadence writes and designs a LinkedIn & Instagram post from your content calendar every day and emails it to you, ready to post.",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${inter.variable} ${jakarta.variable} ${dmSerif.variable} h-full`}
    >
      <body className="min-h-full">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: "#13131b", border: "1px solid rgb(255 255 255 / 0.1)", color: "#f2f1f7" },
          }}
        />
      </body>
    </html>
  );
}
