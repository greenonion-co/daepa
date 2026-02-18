import PetItem from "../PetItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { PetControllerFindAllFilterType as PetListType } from "@repo/api-client";
import { CircleAlert } from "lucide-react";

const SelectStep = ({
  pets,
  handlePetSelect,
  hasMore,
  isFetchingMore,
  isLoading,
  isFetching,
  searchType,
  loaderRefAction,
}: {
  pets: PetParentDtoWithMessage[];
  handlePetSelect: (pet: PetParentDtoWithMessage) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  searchType: PetListType;
  loaderRefAction: (node?: Element | null) => void;
}) => {
  const { user } = useUserStore();
  const petList = pets?.filter((pet) =>
    searchType === PetListType.MY
      ? pet.owner?.userId === user?.userId
      : pet.owner?.userId !== user?.userId,
  );

  if (isLoading || (isFetching && !petList?.length) || !user)
    return (
      <div className="h-[calc(100vh-200px)]">
        <Loading />
      </div>
    );

  if (petList.length === 0)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center py-5 text-center text-[14px] text-gray-700 dark:text-gray-300">
        <CircleAlert className={"my-4 opacity-40"} width={60} height={60} />
        조회된 펫이 없습니다.
      </div>
    );

  return (
    <div className="h-full overflow-y-auto">
      <div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="mb-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pets
              ?.filter((pet) =>
                searchType === PetListType.MY
                  ? pet.owner?.userId === user?.userId
                  : pet.owner?.userId !== user?.userId,
              )
              .map((pet) => (
                <PetItem key={pet.petId} item={pet} handlePetSelect={handlePetSelect} />
              ))}
          </div>
          {hasMore && (
            <div ref={loaderRefAction} className="h-20 text-center">
              {isFetchingMore && <Loading />}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default SelectStep;
