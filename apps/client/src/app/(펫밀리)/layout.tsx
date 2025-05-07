export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  <div id="page" className="mx-auto min-h-screen max-w-[640px] bg-amber-50">
    {children}
  </div>;
}
