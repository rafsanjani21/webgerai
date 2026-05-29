import "./globals.css"; // Baris ini WAJIB ada agar desain terbaca

export const metadata = {
  title: "Koperasi GERAI",
  description: "Web Responsif Koperasi GERAI",
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