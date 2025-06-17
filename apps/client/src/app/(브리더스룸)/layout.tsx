import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import NotiButton from "./noti/components/NotiButton";
import UserButton from "../(user)/UserButton";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppSidebar />
      <main className="min-h-screen w-full p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <NotiButton />
          </div>
          <UserButton />
        </div>
        {children}
      </main>
    </>
  );
}
