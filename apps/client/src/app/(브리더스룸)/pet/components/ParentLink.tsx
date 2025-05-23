import { BadgeCheck, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/ParentSearchSelector";
import { Button } from "@/components/ui/button";
import Dialog from "../../components/Form/Dialog";
import { PetParentDto } from "@repo/api-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ParentLink = ({
  label,
  data,
  onSelect,
  onUnlink,
}: {
  label: "부" | "모";
  data?: PetParentDto;
  onSelect: (item: PetParentDto & { message: string }) => void;
  onUnlink: () => void;
}) => {
  console.log("🚀 ~ data:", data);
  const deleteParent = () => {
    if (!data?.petId) return;

    onUnlink();
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();

    overlay.open(({ isOpen, close }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          deleteParent();
          close();
        }}
        title="부모 연동 해제"
        description={`${label} 개체와의 연동을 해제하시겠습니까?`}
      />
    ));
  };

  return (
    <div className="flex-1">
      <dt className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}

        {data?.status && (
          <Badge
            variant="outline"
            className={cn(
              STATUS_MAP[data?.status].color,
              "rounded-full font-semibold text-gray-100",
            )}
          >
            {data?.status === "approved" && <BadgeCheck className="h-4 w-4 text-gray-100" />}

            {STATUS_MAP[data?.status].label}
          </Badge>
        )}
      </dt>

      {data?.petId ? (
        <div className="group relative block h-full w-full transition-opacity hover:opacity-95">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 z-10 h-6 w-6 rounded-full bg-black/50 p-0 hover:bg-black/70"
            onClick={handleUnlink}
          >
            <X className="h-4 w-4 text-white" />
          </Button>

          <Link href={`/pet/${data.petId}`} className="flex flex-col items-center gap-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={data.photo || "/default-pet-image.png"}
                alt={String(data.petId) || "-"}
                fill
                className="object-cover"
              />
            </div>
            <span className="relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-40">
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

              overlay.open(({ isOpen, close }) => (
                <ParentSearchSelector
                  isOpen={isOpen}
                  onClose={close}
                  onSelect={(item) => {
                    close();
                    onSelect(item);
                  }}
                  sex={label === "부" ? "M" : "F"}
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

const STATUS_MAP = {
  pending: {
    label: "요청 대기중",
    color: "bg-yellow-600 ",
  },
  rejected: {
    label: "요청 거절됨",
    color: "bg-red-700",
  },
  approved: {
    label: "연동됨",
    color: "bg-green-700",
  },
  deleted: {
    label: "삭제됨",
    color: "bg-red-700",
  },
  cancelled: {
    label: "취소됨",
    color: "bg-gray-600",
  },
};
