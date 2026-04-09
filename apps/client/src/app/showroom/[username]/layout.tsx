import ShowroomHeader from "./components/ShowroomHeader";

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f5f5f5] dark:bg-gray-950">
      <ShowroomHeader />
      {children}
    </div>
  );
}
