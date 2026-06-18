import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interior Image Editor",
  description:
    "Upload a room photo, edit it as an easy-to-understand table, and regenerate it with Nano Banana Pro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
