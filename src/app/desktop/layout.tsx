export default function DesktopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Nanti Header Desktop Pro bisa ditaruh di sini */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
}