import { Badge } from "@/components/ui/badge";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import PetThumbnail from "../PetThumbnail";
import { buildR2TransformedUrl } from "@/lib/utils";

const PetItem = ({
  item,
  handlePetSelect,
}: {
  item: PetParentDtoWithMessage;
  handlePetSelect: (pet: PetParentDtoWithMessage) => void;
}) => {
  return (
    <button
      key={item.petId}
      type="button"
      className="group flex cursor-pointer flex-col rounded-xl p-2 text-left"
      onClick={() => handlePetSelect(item)}
    >
      <div className="flex w-full flex-col items-center gap-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <PetThumbnail imageUrl={buildR2TransformedUrl(item.photos?.[0]?.url)} alt={item.name} />
        </div>
        <div className="flex w-full flex-col items-center gap-1">
          <div className="relative">
            <span className="relative font-semibold after:absolute after:-bottom-[1px] after:left-1 after:h-[12px] after:w-full after:bg-transparent after:opacity-40 after:content-[''] group-hover:after:bg-[#247DFE]">
              {item.name}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {item.morphs?.map((morph) => (
              <Badge key={morph} className="bg-blue-800 text-white">
                {morph}
              </Badge>
            ))}

            {item.traits?.map((trait) => (
              <Badge variant="outline" key={trait} className="bg-white text-black dark:bg-blue-100">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

export default PetItem;
