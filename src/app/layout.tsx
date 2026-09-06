import type { Metadata } from "next";
import "./globals.css";
import { ApiKeyProvider } from "@/context/ApiKeyContext";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { RenewModalProvider } from "@/context/RenewModalContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "MathAIO - Nền tảng Toán học All-in-One",
  description: "MathAIO Studio - Nền tảng Toán học All-in-One: Mô hình hóa hình học & lượng giác AI, soạn giáo án chuẩn 5512",
  openGraph: {
    title: "MathAIO - Nền tảng Toán học All-in-One",
    description: "MathAIO Studio - Nền tảng Toán học All-in-One: Mô hình hóa hình học & lượng giác AI, soạn giáo án chuẩn 5512",
    siteName: "MathAIO",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <AuthProvider>
          <ApiKeyProvider>
            <RenewModalProvider>
              {children}
              <ApiKeyModal />
            </RenewModalProvider>
          </ApiKeyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
