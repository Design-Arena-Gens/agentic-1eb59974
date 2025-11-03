import "./globals.css";
import React from "react";

export const metadata = {
  title: "Agentic Trade Mirroring",
  description: "Mirror trades from MoxyAI to your platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>Agentic Trade Mirroring</h1>
          </header>
          <main>{children}</main>
          <footer className="footer">? {new Date().getFullYear()} Agentic</footer>
        </div>
      </body>
    </html>
  );
}
