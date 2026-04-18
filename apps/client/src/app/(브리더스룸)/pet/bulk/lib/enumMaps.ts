import { SELECTOR_CONFIGS, MORPH_LIST_BY_SPECIES, TRAIT_LIST_BY_SPECIES } from "@/app/(브리더스룸)/constants";
import type { PetDtoSpecies } from "@repo/api-client";

/** 셀 드롭다운용: enum key → 한글 라벨 */
function toDisplayMap(list: { key: string; value: string }[]): Record<string, string> {
  return list.reduce<Record<string, string>>((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});
}

export const SPECIES_DISPLAY = toDisplayMap(SELECTOR_CONFIGS.species.selectList);
export const GROWTH_DISPLAY = toDisplayMap(SELECTOR_CONFIGS.growth.selectList);
export const SEX_DISPLAY = toDisplayMap(SELECTOR_CONFIGS.sex.selectList);
export const FOODS_DISPLAY = toDisplayMap(SELECTOR_CONFIGS.foods.selectList);
export const ADOPTION_STATUS_DISPLAY = toDisplayMap(SELECTOR_CONFIGS.adoptionStatus.selectList);

/** 종별 모프/형질 */
export function getMorphDisplay(species?: PetDtoSpecies | string): Record<string, string> {
  if (!species) return {};
  return MORPH_LIST_BY_SPECIES[species as PetDtoSpecies] ?? {};
}

export function getTraitDisplay(species?: PetDtoSpecies | string): Record<string, string> {
  if (!species) return {};
  return TRAIT_LIST_BY_SPECIES[species as PetDtoSpecies] ?? {};
}

/** key[] → "라벨, 라벨" 문자열로 변환 */
export function formatEnumArray(keys: string[] | undefined, displayMap: Record<string, string>): string {
  if (!keys?.length) return "";
  return keys.map((k) => displayMap[k] ?? k).join(", ");
}
