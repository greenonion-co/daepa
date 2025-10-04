import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserSimpleDto } from "@repo/api-client";
import { BadgeCheck } from "lucide-react";

interface UserItemProps {
  item: UserSimpleDto;
  isSelected: boolean | undefined;
  onSelect: (user: UserSimpleDto) => void;
}

const UserItem = ({ item, isSelected, onSelect }: UserItemProps) => {
  return (
    <div
      className={cn(
        "flex items-center rounded-lg p-2 pl-4 text-gray-800 hover:cursor-pointer hover:bg-gray-100 hover:font-semibold",
        isSelected && "bg-gray-800 font-semibold text-white hover:bg-gray-800 hover:font-semibold",
      )}
      onClick={() => onSelect(item)}
    >
      {item.name}
      {item.isBiz ? (
        <Badge className="ml-2 bg-green-500 text-white">
          <BadgeCheck />
          사업자
        </Badge>
      ) : (
        <Badge className="ml-2 bg-blue-500 text-white">일반 사용자</Badge>
      )}
    </div>
  );
};

export default UserItem;
