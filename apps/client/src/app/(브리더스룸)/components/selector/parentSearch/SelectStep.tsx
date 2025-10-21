import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PetItem from "../PetItem";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { PetControllerFindAllFilterType as PetListType } from "@repo/api-client";

const SelectStep = ({
  pets,
  handlePetSelect,
  hasMore,
  isFetchingMore,
  showTab,
  loaderRefAction,
  onTabChange,
}: {
  pets: PetParentDtoWithMessage[];
  handlePetSelect: (pet: PetParentDtoWithMessage) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  showTab: boolean;
  loaderRefAction: (node?: Element | null) => void;
  onTabChange: (tab: PetListType) => void;
}) => {
  const { user } = useUserStore();
  const [tab, setTab] = useState<PetListType>(PetListType.MY);

  return (
    <div className="h-full overflow-y-auto">
      <Tabs
        defaultValue={PetListType.MY}
        className="w-full"
        onValueChange={(value) => {
          setTab(value as PetListType);
          onTabChange(value as PetListType);
        }}
      >
        {showTab && (
          <TabsList className="grid h-12 w-full grid-cols-2 rounded-full p-1">
            <TabsTrigger
              value={PetListType.MY}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full text-sm text-zinc-600 data-[state=active]:font-bold dark:text-zinc-200"
            >
              내 개체
            </TabsTrigger>
            <TabsTrigger
              value={PetListType.NOT_MY}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full text-sm text-zinc-600 data-[state=active]:font-bold dark:text-zinc-200"
            >
              타인의 개체
            </TabsTrigger>
          </TabsList>
        )}

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="mb-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {pets
              ?.filter((pet) =>
                tab === PetListType.MY
                  ? pet.owner?.userId === user?.userId
                  : pet.owner?.userId !== user?.userId,
              )
              .map((pet) => (
                <PetItem key={pet.petId} item={pet} handlePetSelect={handlePetSelect} />
              ))}
          </div>
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
      </Tabs>
    </div>
  );
};

export default SelectStep;
