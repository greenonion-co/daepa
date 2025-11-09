"use client";
import { SIDEBAR_ITEMS } from "../constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchKeywordStore } from "../store/searchKeyword";
import UserButton from "./UserButton";

const Menubar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setSearchKeyword } = useSearchKeywordStore();

  return (
    <div className="flex h-[52px] items-center justify-between">
      <div className="flex items-center">
        <button
          type="button"
          className="mr-10 cursor-pointer font-bold"
          onClick={() => router.push("/pet")}
        >
          브리더스룸
        </button>
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            className={cn(
              "cursor-pointer px-3 py-1.5",
              item.url === pathname ? "font-bold text-black" : "font-semibold text-gray-500",
            )}
            key={item.title}
            href={item.url}
          >
            {item.title}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {pathname === "/pet" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="펫 이름으로 검색하세요"
                className="h-8 rounded-lg bg-gray-100 pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchKeyword(e.currentTarget.value);
                  }
                }}
              />
            </div>
          </div>
        )}

        <UserButton />
      </div>
    </div>
  );
};

export default Menubar;
