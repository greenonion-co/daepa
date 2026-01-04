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
        "group flex flex-col rounded-xl p-2 text-left",
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
          </div>

          <BadgeList
            items={item.morphs}
            badgeSize={"sm"}
            maxDisplay={3}
            badgeClassName="dark:bg-gray-800 dark:text-gray-200"
          />
          <BadgeList
            items={item.traits}
            badgeSize={"sm"}
            maxDisplay={3}
            variant="outline"
            badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
      </div>
    </button>
  );
};

export default PetItem;
