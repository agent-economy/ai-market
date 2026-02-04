// Root layout is a passthrough — [locale]/layout.tsx handles <html> and <body>
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
