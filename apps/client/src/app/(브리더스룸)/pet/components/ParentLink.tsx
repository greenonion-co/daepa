import { PetSummaryDto } from "@/types/pet";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/ParentSearchSelector";

const ParentLink = ({ parent, label }: { parent: PetSummaryDto | undefined; label: string }) => {
  return (
    <div className="flex-1">
      <dt className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      {parent?.photo || label === "부" ? (
        <Link
          href={`/pet/${parent?.petId || ""}`}
          className="group block h-full w-full transition-opacity hover:opacity-95"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={parent?.photo || "/default-pet-image.png"}
                alt={String(parent?.petId) || "-"}
                fill
                className="object-cover"
              />
            </div>
            <span className="relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-40">
              {parent?.name || "-"}
            </span>
          </div>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();

              overlay.open(({ isOpen, close }) => (
                <ParentSearchSelector
                  isOpen={isOpen}
                  onClose={close}
                  onSelect={(item) => {
                    console.log("🚀 ~ ParentLink ~ item:", item);
                    close();
                  }}
                />
              ));
            }}
          >
            <Search className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ParentLink;
