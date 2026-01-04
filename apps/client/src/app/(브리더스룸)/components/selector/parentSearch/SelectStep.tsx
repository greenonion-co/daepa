import PetItem from "../PetItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { PetControllerFindAllFilterType as PetListType } from "@repo/api-client";
import Image from "next/image";

const SelectStep = ({
  pets,
  handlePetSelect,
  hasMore,
  isFetchingMore,
  searchType,
  loaderRefAction,
}: {
  pets: PetParentDtoWithMessage[];
  handlePetSelect: (pet: PetParentDtoWithMessage) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  searchType: PetListType;
  loaderRefAction: (node?: Element | null) => void;
}) => {
  const { user } = useUserStore();

  return (
    <div className="h-full overflow-y-auto">
      <div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {pets?.filter((pet) =>
            searchType === PetListType.MY
              ? pet.owner?.userId === user?.userId
              : pet.owner?.userId !== user?.userId,
          ).length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center py-5 text-center text-[14px] text-gray-700 dark:text-gray-300">
              <Image
                src="/assets/lizard.png"
                alt="브리더스룸 로그인 로고"
                width={200}
                height={200}
              />
              조회된 펫이 없습니다.
            </div>
          ) : (
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
          )}
          {hasMore && (
            <div ref={loaderRefAction} className="h-20 text-center">
              {isFetchingMore ? (
                <div className="flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
                </div>
              ) : (
                <Loading />
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default SelectStep;
