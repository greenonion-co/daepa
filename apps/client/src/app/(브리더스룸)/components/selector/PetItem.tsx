import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { cn } from "@/lib/utils";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "../BadgeList";

const PetItem = ({
  item,
  handlePetSelect,
  disabled,
}: {
  item: PetParentDtoWithMessage;
  handlePetSelect: (pet: PetParentDtoWithMessage) => void;
  disabled?: boolean;
}) => {
  return (
    <button
      key={item.petId}
      type="button"
      className={cn(
        "group flex flex-col rounded-xl text-left",
        disabled ? "pointer-events-none cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        handlePetSelect(item);
      }}
    >
      <div className="flex w-full flex-col items-center gap-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <PetThumbnail petId={item.petId} alt={item.name} maxSize={90} />
        </div>
        <div className="flex w-full flex-col gap-1">
          <div className="text-center">
            <span className="relative text-center font-semibold after:absolute after:-bottom-[1px] after:left-1 after:h-[12px] after:w-full after:bg-transparent after:opacity-40 after:content-[''] group-hover:after:bg-[#247DFE] dark:text-gray-100">
              {item.name}
            </span>
            {item.owner?.name && (
              <p className="text-xs text-gray-600 dark:text-gray-500">@{item.owner.name}</p>
            )}
          </div>

          <BadgeList variant={"outline"} items={item.morphs} badgeSize={"sm"} maxDisplay={3} />
          <BadgeList items={item.traits} badgeSize={"sm"} maxDisplay={3} variant="secondary" />
        </div>
      </div>
    </button>
  );
};

export default PetItem;
