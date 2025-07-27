import { EggDto, ParentDtoRole, ParentDtoStatus, PetParentDto } from "@repo/api-client";
import Link from "next/link";
import ParentStatusBadge from "./ParentStatusBadge";
import { getEggName } from "@/lib/utils";

export const TreeView = ({ node }: { node: EggDto }) => {
  return (
    <Link
      className="hover:bg-accent mb-2 flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
      href={`/egg/${node.eggId}`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            🥚
          </div>
          <h3 className="text-sm">{getEggName(node)}</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="min-w-15 flex flex-col gap-1.5">
            <ParentInfo
              type={ParentDtoRole.FATHER}
              parent={node.father}
              isMyPet={node.owner.userId === node.father?.owner?.userId}
            />
            <ParentInfo
              type={ParentDtoRole.MOTHER}
              parent={node.mother}
              isMyPet={node.owner.userId === node.mother?.owner?.userId}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

const ParentInfo = ({
  type,
  parent,
  isMyPet,
}: {
  type: ParentDtoRole;
  parent: PetParentDto | undefined;
  isMyPet: boolean;
}) => {
  const parentLabel = type === ParentDtoRole.FATHER ? "부" : "모";
  return (
    <>
      {parent ? (
        <div className="flex items-center gap-2">
          <span className="">
            {parentLabel}: {parent.name}
          </span>

          <ParentStatusBadge status={parent.status as ParentDtoStatus} isMyPet={isMyPet} />
        </div>
      ) : (
        <span className="">{parentLabel}: -</span>
      )}
    </>
  );
};
