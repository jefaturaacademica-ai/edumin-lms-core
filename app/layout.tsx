import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Edumin | Aula Virtual",
  description: "La plataforma de aprendizaje de Edumin.",
  icons: {
    icon: "https://www.edumin.pe/icon.png?icon.3w1v6vfpp897a.png",
    shortcut: "https://www.edumin.pe/icon.png?icon.3w1v6vfpp897a.png",
    apple: "https://www.edumin.pe/icon.png?icon.3w1v6vfpp897a.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
