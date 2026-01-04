import FormItem from "../FormItem";
import { ToggleButton } from "./ToggleButton";

interface PublicToggleProps {
  isPublic: boolean;
  isEditMode: boolean;
  onChange: (isPublic: boolean) => void;
}

export const PublicToggle = ({ isPublic, isEditMode, onChange }: PublicToggleProps) => {
  return (
    <FormItem
      label="공개 여부"
      content={
        <div className="flex h-[32px] items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <ToggleButton isActive={isPublic} isDisabled={!isEditMode} onClick={() => onChange(true)}>
            공개
          </ToggleButton>
          <ToggleButton
            isActive={!isPublic}
            isDisabled={!isEditMode}
            onClick={() => onChange(false)}
          >
            비공개
          </ToggleButton>
        </div>
      }
    />
  );
};
