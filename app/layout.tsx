import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "FOLIOFIT";
const description =
  "채용공고와 포트폴리오 PDF를 함께 분석해 직무 적합도와 증거 전달력을 정리하는 모바일 커리어 서비스입니다.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "https://foliofit.chatgpt-apps.com";
  const ogImage = `${origin}/og.png`;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    icons: {
      icon: [{ url: "/app-icon.png", type: "image/png" }],
      shortcut: "/app-icon.png",
      apple: "/app-icon.png",
    },
    openGraph: {
      title,
      description,
      siteName: title,
      type: "website",
      url: origin,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "FOLIOFIT portfolio evidence social preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
