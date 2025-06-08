import { cn } from "@/lib/utils";
import { PetDtoSex, PetSummaryDto } from "@repo/api-client";
import { ArrowLeftRight } from "lucide-react";
import LinkButton from "../../components/LinkButton";

const NotiTitle = ({
  receiverPet,
  senderPet,
  hasLink = false,
}: {
  receiverPet: PetSummaryDto;
  senderPet: PetSummaryDto;
  hasLink?: boolean;
}) => {
  const nameStyle = (sex: PetDtoSex) =>
    cn(
      "relative font-bold after:absolute after:bottom-1 after:left-0.5 after:-z-10 after:h-[70%] after:w-full after:opacity-40",
      sex === "F"
        ? "after:bg-red-400/70"
        : sex === "M"
          ? "after:bg-[#247DFE]/70"
          : "after:bg-muted-foreground/50",
    );
  return (
    <div className="flex items-center gap-2">
      {hasLink ? (
        <LinkButton
          href={`/pet/${receiverPet?.petId}`}
          label={receiverPet?.name}
          tooltip="프로필로 이동"
        />
      ) : (
        <div className={nameStyle(receiverPet?.sex)}>{receiverPet?.name}</div>
      )}
      <ArrowLeftRight className="h-4 w-4" />
      <div className="flex items-center">
        {senderPet?.eggId && <span className="text-xs">🥚</span>}
        <div className={nameStyle(senderPet?.sex)}>{senderPet?.name}</div>
      </div>
    </div>
  );
};

export default NotiTitle;
