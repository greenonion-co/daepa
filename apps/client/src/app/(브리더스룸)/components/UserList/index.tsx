import Loading from "@/components/common/Loading";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brUserControllerGetUsers, SafeUserDto } from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import UserItem from "./UserItem";
import { Button } from "@/components/ui/button";

interface UserListProps {
  selectedUserId?: string;
  onSelect: (user: SafeUserDto) => void;
}

const UserList = ({ selectedUserId, onSelect }: UserListProps) => {
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const [keyword, setKeyword] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [brUserControllerGetUsers.name, userSearchQuery],
    queryFn: ({ pageParam = 1 }) =>
      brUserControllerGetUsers({ page: pageParam, itemPerPage, keyword: userSearchQuery }),
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
      <div className="relative flex items-center gap-2">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="사용자 이름으로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-10 placeholder:text-sm"
        />
        <Button
          onClick={(e) => {
            e.preventDefault();
            setUserSearchQuery(keyword);
          }}
          className="h-10"
        >
          검색
        </Button>
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
