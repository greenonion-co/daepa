import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownMenuIconProps {
  selectedId: string | number;
  menuItems: {
    icon: React.ReactNode;
    label: string;
    onClick: (e: React.MouseEvent) => void;
  }[];
  triggerIcon?: React.ReactNode;
  forceOpen?: boolean;
}
const DropdownMenuIcon = ({ selectedId, menuItems, triggerIcon, forceOpen }: DropdownMenuIconProps) => {
  const content = (
    <DropdownMenuContent
      align="end"
      className={cn(forceOpen && "z-40")}
      sideOffset={5}
    >
      {menuItems.map((item, index) => (
        <div key={`${selectedId}-${item.label}`}>
          <DropdownMenuItem onClick={item.onClick}>
            {item.icon}
            {item.label}
          </DropdownMenuItem>
          {index < menuItems.length - 1 && <DropdownMenuSeparator />}
        </div>
      ))}
    </DropdownMenuContent>
  );

  return (
    <DropdownMenu open={forceOpen ? true : undefined} modal={!forceOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("w-8 rounded-lg hover:bg-gray-100", forceOpen && "bg-gray-100")}
        >
          <span className="sr-only">Open menu</span>
          {triggerIcon || <MoreVertical />}
        </Button>
      </DropdownMenuTrigger>
      {forceOpen ? content : <DropdownMenuPortal>{content}</DropdownMenuPortal>}
    </DropdownMenu>
  );
};

export default DropdownMenuIcon;
