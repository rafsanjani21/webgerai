import "./globals.css"; // Baris ini WAJIB ada agar desain terbaca

export const metadata = {
  title: "GERAI",
  description: "Web Responsif GERAI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}