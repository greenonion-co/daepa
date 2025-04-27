"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 개발용 임시 컴포넌트
function TempGlobalButton() {
  const pathname = usePathname();
  console.log(pathname);
  const isBr = pathname.includes("/br");
  return (
    <button className="fixed right-0 top-0 h-20 w-20 rounded-full border bg-white">
      {isBr ? <Link href="/">to 펫밀리</Link> : <Link href="/br">to 브리더룸</Link>}
    </button>
  );
}

export default TempGlobalButton;
