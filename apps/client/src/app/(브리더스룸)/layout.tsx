import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppSidebar />
      <main className="min-h-screen w-full p-2">
        <SidebarTrigger />
        {children}
      </main>
    </>
  );
}
