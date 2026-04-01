import { Checkbox } from "@/components/ui/checkbox";
import FormItem from "../FormItem";

interface BreederToggleProps {
  isBreeder: boolean;
  onChange: (isBreeder: boolean) => void;
}

export const BreederToggle = ({ isBreeder, onChange }: BreederToggleProps) => {
  return (
    <FormItem
      label="브리더"
      content={
        <div className="flex h-[32px] items-center">
          <Checkbox
            checked={isBreeder}
            onCheckedChange={(checked) => onChange(!!checked)}
            className="h-5 w-5 border-amber-400 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
          />
        </div>
      }
    />
  );
};
