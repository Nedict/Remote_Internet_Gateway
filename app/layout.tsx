import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remote Internet Gateway",
  description: "Securely route traffic through your home gateway",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
