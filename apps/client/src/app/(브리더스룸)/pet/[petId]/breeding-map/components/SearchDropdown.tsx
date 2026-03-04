import { PetDtoSex } from "@repo/api-client";
import type { FamilyTreeNodeData } from "../lib/types";

interface ExternalPetResult {
  petId: string;
  name?: string | null;
  sex?: string;
}

interface SearchDropdownProps {
  searchFocused: boolean;
  isExternalFetching: boolean;
  searchResults: FamilyTreeNodeData[];
  externalResults: ExternalPetResult[];
  highlightedIndex: number;
  addingPetId: string | null;
  isMobile?: boolean;
  onSearchSelect: (nodeId: string) => void;
  onAddExternalTree: (petId: string) => void;
}

export default function SearchDropdown({
  searchFocused,
  isExternalFetching,
  searchResults,
  externalResults,
  highlightedIndex,
  addingPetId,
  isMobile,
  onSearchSelect,
  onAddExternalTree,
}: SearchDropdownProps) {
  if (!searchFocused) return null;

  // 검색 중 로딩
  if (isExternalFetching && searchResults.length === 0 && externalResults.length === 0) {
    return (
      <div className={`border-border bg-background/95 ${isMobile ? "w-40" : "w-52"} rounded-lg border px-3 py-2 text-xs text-gray-400 shadow-md backdrop-blur-sm`}>
        검색 중...
      </div>
    );
  }

  if (searchResults.length === 0 && externalResults.length === 0) return null;

  return (
    <div className={`border-border bg-background/95 ${isMobile ? "w-40" : "w-52"} rounded-lg border py-1 shadow-md backdrop-blur-sm`}>
      {/* 트리 내 결과 */}
      {searchResults.length > 0 && (
        <>
          {externalResults.length > 0 && (
            <div className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
              트리 내
            </div>
          )}
          {searchResults.map((n, i) => (
            <button
              key={n.petId}
              className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm ${highlightedIndex === i ? "bg-accent" : "hover:bg-accent"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onSearchSelect(n.petId);
              }}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    n.pet?.sex === "M" || n.pet?.sex === "MALE"
                      ? "#2383E2"
                      : n.pet?.sex === "F" || n.pet?.sex === "FEMALE"
                        ? "#E03E3E"
                        : "#9ca3af",
                }}
              />
              <span className="truncate">{n.pet?.name ?? "이름 없음"}</span>
            </button>
          ))}
        </>
      )}
      {/* 외부 결과 (트리에 없는 개체) */}
      {externalResults.length > 0 && (
        <>
          <div className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
            트리에 추가
          </div>
          {externalResults.map((p, i) => (
            <div
              key={p.petId}
              className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-sm ${highlightedIndex === searchResults.length + i ? "bg-accent" : "hover:bg-accent"}`}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    p.sex === PetDtoSex.MALE
                      ? "#2383E2"
                      : p.sex === PetDtoSex.FEMALE
                        ? "#E03E3E"
                        : "#9ca3af",
                }}
              />
              <span className="flex-1 truncate">{p.name ?? "이름 없음"}</span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAddExternalTree(p.petId);
                }}
                disabled={addingPetId === p.petId}
                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:hover:bg-blue-900/30"
              >
                {addingPetId === p.petId ? "..." : "+ 추가"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
