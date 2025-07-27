import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface DropdownMenuIconProps {
  selectedId: string | number;
  menuItems: {
    icon: React.ReactNode;
    label: string;
    onClick: (e: React.MouseEvent) => void;
  }[];
}
const DropdownMenuIcon = ({ selectedId, menuItems }: DropdownMenuIconProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-4 w-4 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
    </DropdownMenu>
  );
};

export default DropdownMenuIcon;
