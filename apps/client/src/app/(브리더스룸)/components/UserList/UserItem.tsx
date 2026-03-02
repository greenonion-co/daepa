import { cn } from "@/lib/utils";
import { UserProfilePublicDto } from "@repo/api-client";

interface UserItemProps {
  item: UserProfilePublicDto;
  isSelected: boolean | undefined;
  onSelect: (user: UserProfilePublicDto) => void;
}

const UserItem = ({ item, isSelected, onSelect }: UserItemProps) => {
  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-lg p-2 pl-4 text-[14px] font-[500] text-gray-800 hover:cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/20",
        isSelected &&
          "bg-gray-800 text-white hover:bg-gray-800 dark:bg-blue-700 dark:hover:bg-blue-700",
      )}
      onClick={() => onSelect(item)}
    >
      {item.name}
      {item.isBiz ? (
        <span className="ml-2 inline-flex items-center rounded-full bg-[#DBEDDB] px-2 py-0.5 text-[11px] leading-none font-medium text-[#2B6A2F] dark:bg-[#1E3D1F] dark:text-[#A3D9A5]">
          사업자
        </span>
      ) : (
        <span className="ml-2 inline-flex items-center rounded-full bg-[#D3E5EF] px-2 py-0.5 text-[11px] leading-none font-medium text-[#28638D] dark:bg-[#1E3A5F] dark:text-[#A3C9E8]">
          일반
        </span>
      )}
    </div>
  );
};

export default UserItem;
