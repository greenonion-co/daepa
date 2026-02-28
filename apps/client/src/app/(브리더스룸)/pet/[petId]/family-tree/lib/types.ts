import type { PetDto } from "@repo/api-client";

/** 그래프 노드에 표시할 펫 데이터 */
export interface FamilyPetData {
  petId: string;
  name?: string;
  sex?: string;
  species?: string;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isDeleted?: boolean;
  type?: string; // "EGG" | "PET"
  isPublic?: boolean;
  isOwner?: boolean;
  ownerName?: string;
}

/** 백엔드 GET /v1/pet/family-tree/:petId 응답의 단일 노드 */
export interface FamilyTreeApiNode {
  petId: string;
  fatherId: string | null;
  motherId: string | null;
  depth: number | null; // 0=루트, 1~N=후손, null=공동 부모
  name?: string;
  sex?: string;
  morphs?: string[];
  traits?: string[];
  species: string;
  hatchingDate?: string;
  type: string;
  isPublic: boolean;
  isOwner: boolean;
  ownerName?: string;
}

/** 비공개 펫 노드 (서버에서 보안 목적으로 최소 정보만 반환) */
export interface FamilyTreeHiddenNode {
  petId: string;
  hiddenStatus: string;
}

/** 서버 응답 노드 유니온 타입 */
export type FamilyTreeApiNodeOrHidden = FamilyTreeApiNode | FamilyTreeHiddenNode;

/** 비공개 노드 타입 가드 */
export function isHiddenNode(node: FamilyTreeApiNodeOrHidden): node is FamilyTreeHiddenNode {
  return "hiddenStatus" in node;
}

/** 그래프 노드 데이터 */
export interface FamilyTreeNodeData {
  petId: string;
  pet: FamilyPetData | null;
  isCenterPet: boolean;
  fatherId: string | null;
  motherId: string | null;
  isHidden?: boolean;
}

/** PetDto → FamilyPetData */
export function toPetData(pet: PetDto): FamilyPetData {
  return {
    petId: pet.petId,
    name: pet.name,
    sex: pet.sex,
    species: pet.species,
    morphs: pet.morphs,
    traits: pet.traits,
    hatchingDate: pet.hatchingDate,
    isDeleted: pet.isDeleted,
    type: pet.type,
  };
}

/** FamilyTreeApiNode → FamilyPetData */
export function apiNodeToPetData(node: FamilyTreeApiNode): FamilyPetData {
  return {
    petId: node.petId,
    name: node.name,
    sex: node.sex,
    species: node.species,
    morphs: node.morphs,
    traits: node.traits,
    hatchingDate: node.hatchingDate,
    type: node.type,
    isPublic: node.isPublic,
    isOwner: node.isOwner,
    ownerName: node.ownerName,
  };
}
