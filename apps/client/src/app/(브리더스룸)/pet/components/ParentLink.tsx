import { Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/selector/parentSearch";
import { Button } from "@/components/ui/button";
import Dialog from "../../components/Form/Dialog";
import { PetParentDto, PetSummaryDto } from "@repo/api-client";
import { cn } from "@/lib/utils";
import ParentStatusBadge from "../../components/ParentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

const ParentLink = ({
  label,
  currentPetOwnerId = "",
  data,
  editable = true,
  onSelect,
  onUnlink,
}: {
  label: "부" | "모";
  currentPetOwnerId?: string;
  data?: PetParentDto;
  editable?: boolean;
  onSelect?: (item: PetSummaryDto & { message?: string }) => void;
  onUnlink?: () => void;
}) => {
  const pathname = usePathname();
  const isRegisterPage = pathname.includes("register");
  const deleteParent = () => {
    if (!data?.petId) return;

    onUnlink?.();
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();

    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          deleteParent();
          close();
        }}
        title="부모 연동 해제"
        description={`${label} 개체와의 연동을 해제하시겠습니까?`}
        onExit={unmount}
      />
    ));
  };

  return (
    <div className="flex-1">
      <dt className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}

        {data?.status && (
          <ParentStatusBadge
            status={data.status}
            isMyPet={data.owner.userId === currentPetOwnerId}
          />
        )}
      </dt>

      {data?.petId ? (
        <div className="group relative block h-full w-full transition-opacity hover:opacity-95">
          {!data?.status && data.owner.userId === currentPetOwnerId && (
            <Badge
              variant="outline"
              className="absolute left-1 top-1 z-10 bg-blue-50 text-xs font-bold"
            >
              My
            </Badge>
          )}

          {editable && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 z-10 h-6 w-6 rounded-full bg-black/50 p-0 hover:bg-black/70"
              onClick={handleUnlink}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          )}

          <Link
            href={`/pet/${data.petId}`}
            passHref={false}
            onClick={(e) => {
              e.stopPropagation();
              if (isRegisterPage) e.preventDefault();
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={data.photo || "/default-pet-image.png"}
                alt={String(data.petId) || "-"}
                fill
                className="object-cover"
              />
            </div>
            <span
              className={cn(
                "relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:opacity-40",
                label === "모" ? "after:bg-red-400" : "after:bg-[#247DFE]",
              )}
            >
              {data.name || "-"}
            </span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              if (!editable) return;

              overlay.open(({ isOpen, close, unmount }) => (
                <ParentSearchSelector
                  isOpen={isOpen}
                  onClose={close}
                  onSelect={(item) => {
                    close();
                    onSelect?.(item);
                  }}
                  sex={label === "부" ? "M" : "F"}
                  onExit={unmount}
                />
              ));
            }}
          >
            {editable ? (
              <Search className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
            ) : (
              <div className="text-center text-sm text-gray-400">미등록</div>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ParentLink;
