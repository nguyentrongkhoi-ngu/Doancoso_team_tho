import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from 'react-hot-toast';
import CartProvider from "@/context/CartProvider";
import { SearchProvider } from "@/context/SearchContext";
import { ProductProvider } from "@/context/ProductContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import ChatBoxWrapper from "@/components/ChatBoxWrapper";

// Định nghĩa font chữ chính
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

// Font chữ thứ hai, dùng cho nội dung
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "E-Shop AI - Mua sắm thông minh với AI gợi ý",
  description: "Website bán hàng với AI gợi ý sản phẩm theo hành vi người dùng",
  keywords: "ecommerce, ai, recommendation, shopping, online",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="vi" className={`${poppins.variable} ${inter.variable}`}>
      <body className={`font-sans antialiased text-base-content bg-base-100/30`}>
        <SessionProvider session={session}>
          <ThemeProvider>
            <CartProvider>
              <SearchProvider>
                <ProductProvider>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow pt-32 pb-16">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <ChatBoxWrapper />
                  <Toaster position="top-right" />
                </ProductProvider>
              </SearchProvider>
            </CartProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
