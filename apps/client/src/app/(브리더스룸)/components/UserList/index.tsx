import Loading from "@/components/common/Loading";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { userControllerGetUserListSimple, UserSimpleDto } from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import UserItem from "./UserItem";

interface UserListProps {
  selectedUserId?: string;
  onSelect: (user: UserSimpleDto) => void;
}

const UserList = ({ selectedUserId, onSelect }: UserListProps) => {
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const [userSearchQuery, setUserSearchQuery] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [userControllerGetUserListSimple.name, userSearchQuery],
    queryFn: ({ pageParam = 1 }) =>
      userControllerGetUserListSimple({ page: pageParam, itemPerPage, keyword: userSearchQuery }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data.data),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="relative">
      <div className="flex w-full items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="사용자 이름으로 검색하세요"
            className="h-10 rounded-lg border-none bg-gray-100 pl-9 text-[14px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setUserSearchQuery(e.currentTarget.value);
              }
            }}
          />
        </div>
      </div>

      <ScrollArea className="h-[200px] py-2">
        <div>
          {data?.map((item) => (
            <UserItem
              key={item.userId}
              item={item}
              isSelected={selectedUserId === item.userId}
              onSelect={onSelect}
            />
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref} className="h-20 text-center">
            {isFetchingNextPage ? (
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
  );
};

export default UserList;
