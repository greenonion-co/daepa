export default function SectionSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900">
      <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-[200px] rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
