import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import NotiButton from "./noti/components/NotiButton";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppSidebar />
      <main className="min-h-screen w-full p-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <NotiButton />
        </div>
        <Toaster />
        {children}
      </main>
    </>
  );
}
