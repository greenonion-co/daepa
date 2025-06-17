import { cn } from "@/lib/utils";
import { PetDtoSex } from "@repo/api-client";
import { ArrowLeftRight } from "lucide-react";
import LinkButton from "../../components/LinkButton";
import { NotificationDetailJson } from "../store/noti";

const NotiTitle = ({
  receiverPet,
  senderPet,
  hasLink = false,
}: {
  receiverPet: NotificationDetailJson["receiverPet"];
  senderPet: NotificationDetailJson["senderPet"];
  hasLink?: boolean;
}) => {
  const nameStyle = (sex?: PetDtoSex) =>
    cn(
      "relative font-bold after:absolute after:bottom-1 after:left-0.5 after:-z-10 after:h-[70%] after:w-full after:opacity-40",
      sex === "F"
        ? "after:bg-red-400/60"
        : sex === "M"
          ? "after:bg-[#247DFE]/50"
          : "after:bg-muted-foreground/30",
    );
  return (
    <div className="flex items-center gap-2">
      {hasLink && "petId" in receiverPet ? (
        <LinkButton
          href={`/pet/${receiverPet?.petId}`}
          label={receiverPet?.name}
          tooltip="프로필로 이동"
        />
      ) : (
        <div className={nameStyle("sex" in receiverPet ? receiverPet.sex : "N")}>
          {receiverPet?.name}
        </div>
      )}
      <ArrowLeftRight className="h-4 w-4" />
      <div className="flex items-center">
        {"eggId" in senderPet && <span className="text-xs">🥚</span>}
        <div className={nameStyle("sex" in senderPet ? senderPet.sex : "N")}>{senderPet?.name}</div>
      </div>
    </div>
  );
};

export default NotiTitle;
