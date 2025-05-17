import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./provider";
import Navbar from "./components/Navbar";
import React from "react";
import "./globals.css";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow overflow-hidden">
              <div className="size-full mt-8">{children}</div>
            </main>
            {/* Footer 나중에 추가 */}
          </div>
        </Providers>
      </body>
    </html>
  );
}
