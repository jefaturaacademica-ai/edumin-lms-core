import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "EDUMIN | Aula Virtual",
    template: "%s | EDUMIN",
  },
  description: "La plataforma de aprendizaje de EDUMIN.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "1254x1254" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('edumin_theme_mode') || localStorage.getItem('edumin_theme');
                  if (!mode) {
                    var m = document.cookie.match(new RegExp('(^| )edumin_theme=([^;]+)'));
                    if (m) mode = m[2];
                  }
                  if (!mode) mode = 'oscuro';
                  var isDark = true;
                  if (mode === 'claro') {
                    isDark = false;
                  } else if (mode === 'sistema') {
                    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  } else {
                    isDark = true;
                  }
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'oscuro');
                  } else {
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'claro');
                  }
                  root.setAttribute('data-theme-mode', mode);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" suppressHydrationWarning>{children}</body>
    </html>
  );
}
