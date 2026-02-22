import Image from "next/image";

const statusMap: Record<string, { light: string; dark: string }> = {
  approved: {
    light: "/status/checkmark-circle-green-filled.svg",
    dark: "/status/checkmark-circle-green-filled_dark.svg",
  },
  pending: {
    light: "/status/inprogress.svg",
    dark: "/status/inprogress_dark.svg",
  },
};

export default function ParentStatusIcon({ status }: { status: string }) {
  const config = statusMap[status];
  if (!config) return null;
  return (
    <>
      <Image
        src={config.light}
        alt={status}
        width={14}
        height={14}
        className="shrink-0 dark:hidden"
      />
      <Image
        src={config.dark}
        alt={status}
        width={14}
        height={14}
        className="hidden shrink-0 dark:block"
      />
    </>
  );
}
