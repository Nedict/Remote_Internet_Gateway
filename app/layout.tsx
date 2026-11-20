import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RIG — Your home, wherever you are",
  description: "A preview of the RIG home internet gateway app.",
  applicationName: "RIG",
  themeColor: "#0c0e0d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
