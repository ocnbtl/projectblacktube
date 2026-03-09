import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Purrify Music",
  description: "Blacklist artists and songs on YouTube Music with blocklists, toggles, and autoskip."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <footer className="site-footer">
            <p>Purrify Music is an independent companion tool for YouTube Music listeners.</p>
            <div className="footer-links">
              <a href="/legal/privacy">Privacy</a>
              <a href="/legal/terms">Terms</a>
              <a href="mailto:hello@purrifymusic.com">hello@purrifymusic.com</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
