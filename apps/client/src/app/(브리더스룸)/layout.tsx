import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

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
        <Toaster />
        {children}
      </main>
    </>
  );
}
