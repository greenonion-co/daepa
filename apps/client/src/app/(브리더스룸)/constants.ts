import { Bell, Bubbles, DollarSign, Film, Heart, Home, Inbox, TreeDeciduous } from "lucide-react";
import { FormStep, SelectorConfig } from "./register/types";
import {
  PetDtoGrowth,
  PetDtoSex,
  PetDtoSpecies,
  UserDtoStatus,
  UserNotificationDtoType,
} from "@repo/api-client";

export const REGISTER_PAGE = {
  FIRST: 1,
  SECOND: 2,
};

export const FORM_STEPS: FormStep[] = [
  {
    title: "개체 이름 /관리번호",
    field: {
      name: "name",
      type: "text",
      required: true,
      placeholder: "개체 이름 /관리번호를 입력해주세요",
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "성별",
    field: {
      name: "sex",
      type: "select",
      placeholder: "성별을 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "크기",
    field: {
      name: "growth",
      type: "select",
      placeholder: "크기를 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "모프",
    field: {
      name: "morphs",
      type: "multipleSelect",
      placeholder: "모프를 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "종",
    field: {
      name: "species",
      type: "select",
      required: true,
      placeholder: "종을 선택해주세요",
      validation: (value) => value.length > 0,
    },
  },
];

export const OPTION_STEPS: FormStep[] = [
  {
    title: "형질",
    field: {
      name: "traits",
      type: "multipleSelect",
      placeholder: "형질을 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "사진",
    field: {
      name: "photos",
      type: "file",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "부모 개체 정보",
    field: {
      name: "parents",
      type: "parentSearch",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "생년월일",
    field: {
      name: "hatchingDate",
      type: "date",
      required: true,
      placeholder: "생년월일을 입력해주세요",
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "체중",
    field: {
      name: "weight",
      type: "number",
      required: true,
      unit: "g",
      placeholder: "체중을 입력해주세요",
      validation: (value) => !isNaN(Number(value)) && Number(value) > 0,
    },
  },
  {
    title: "먹이",
    field: {
      name: "foods",
      type: "multipleSelect",
      placeholder: "먹이를 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },

  {
    title: "상세 설명",
    field: {
      name: "desc",
      type: "textarea",
      required: false,
    },
  },
];

export const EGG_REGISTER_STEPS: FormStep[] = [
  {
    title: "상세 설명",
    field: {
      name: "desc",
      type: "textarea",
      required: false,
    },
  },
  {
    title: "수량",
    field: {
      name: "clutchCount",
      type: "number",
      unit: "개",
      required: true,
      placeholder: "수량을 입력해주세요",
      validation: (value) => !isNaN(Number(value)) && Number(value) > 0,
    },
  },

  {
    title: "차수",
    field: {
      name: "clutch",
      type: "number",
      unit: "차",
      required: false,
      placeholder: "차수를 입력해주세요",
    },
  },
  {
    title: "부모 개체 정보",
    field: {
      name: "parents",
      info: "최소 1개 이상 선택해주세요",
      type: "parentSearch",
      required: false,
    },
  },
  {
    title: "해칭일",
    field: {
      name: "layingDate",
      type: "date",
      required: true,
      placeholder: "해칭일을 입력해주세요",
    },
  },
  {
    title: "종",
    field: {
      name: "species",
      type: "select",
      required: true,
      placeholder: "종을 선택해주세요",
      validation: (value) => value.length > 0,
    },
  },
];

export const EGG_EDIT_STEPS: FormStep[] = [
  // {
  //   title: "이름/관리번호",
  //   field: {
  //     name: "name",
  //     type: "text",
  //     required: true,
  //     placeholder: "개체 이름/관리번호를 입력해주세요",
  //     validation: (value) => value.length > 0,
  //   },
  // },
  {
    title: "종",
    field: {
      name: "species",
      type: "select",
      required: true,
      placeholder: "종을 선택해주세요",
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "해칭일",
    field: {
      name: "layingDate",
      type: "date",
      required: true,
      placeholder: "해칭일을 입력해주세요",
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "차수",
    field: {
      name: "clutch",
      type: "number",
      unit: "차",
      required: false,
      placeholder: "차수를 입력해주세요",
      validation: (value) => !isNaN(Number(value)) && Number(value) > 0,
    },
  },
  {
    title: "구분",
    field: {
      name: "clutchOrder",
      type: "number",
      unit: "번",
      required: true,
      placeholder: "수량을 입력해주세요",
      validation: (value) => !isNaN(Number(value)) && Number(value) > 0,
    },
  },
  {
    title: "상세 설명",
    field: {
      name: "desc",
      type: "textarea",
      required: false,
    },
  },
];

export const MORPH_LIST_BY_SPECIES: Record<keyof typeof SPECIES_KOREAN_INFO, string[]> = {
  CR: [
    "노멀",
    "루왁",
    "루왁 릴리",
    "릴리 세이블",
    "릴리화이트",
    "릴리100%헷아잔틱",
    "릴잔틱",
    "세이블",
    "슈퍼페이블 릴리",
    "슈퍼 세이블",
    "아잔틱",
    "초초",
    "카푸치노",
    "프라푸치노",
    "하이포",
    "100%헷아잔틱",
    "100%헷초초",
  ],
  LE: ["노멀", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
  FT: ["노멀", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
  KN: ["노멀", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
  LC: ["노멀", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
  GG: ["노멀", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
};

export const SALE_STATUS_KOREAN_INFO = {
  NFS: "판매 안함",
  ON_SALE: "판매 중",
  ON_RESERVATION: "예약 중",
  SOLD: "판매 완료",
};

export const TABLE_HEADER = {
  name: "이름",
  species: "종",
  morphs: "모프",
  traits: "형질",
  sex: "성별",
  growth: "크기",
  weight: "몸무게",
  mother: "모",
  father: "부",
  hatchingDate: "생년월일",
  desc: "설명",
  foods: "먹이",
  isPublic: "공개 여부",
  adoption_status: "분양 상태",
};

export const SPECIES_KOREAN_INFO: Record<PetDtoSpecies, string> = {
  CR: "크레스티드 게코",
  LE: "레오파드 게코",
  FT: "펫테일 게코",
  KN: "납테일 게코",
  LC: "리키에너스",
  GG: "가고일 게코",
};

export const GENDER_KOREAN_INFO: Record<PetDtoSex, string> = {
  M: "수컷",
  F: "암컷",
  N: "미구분",
};

export const GROWTH_KOREAN_INFO: Record<PetDtoGrowth, string> = {
  EGG: "알",
  BABY: "베이비",
  JUVENILE: "아성체",
  PRE_ADULT: "준성체",
  ADULT: "성체",
  DEAD: "사망",
};

export const FOOD_LIST = ["판게아 인섹트", "귀뚜라미", "냉동귀뚜라미", "누에", "지렙 인섹트"];

export const SELECTOR_CONFIGS: Record<
  "species" | "growth" | "sex" | "traits" | "foods",
  SelectorConfig
> = {
  species: {
    title: "종 선택",
    selectList: Object.keys(SPECIES_KOREAN_INFO),
  },
  growth: {
    title: "크기 선택",
    selectList: ["EGG", "BABY", "JUVENILE", "PRE_ADULT", "ADULT"],
  },
  sex: {
    title: "성별 선택",
    selectList: Object.keys(GENDER_KOREAN_INFO),
  },
  traits: {
    title: "형질 선택",
    selectList: ["노멀", "크림시클", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
  },
  foods: {
    title: "먹이 선택",
    selectList: FOOD_LIST,
  },
};

export const SIDEBAR_ITEMS = [
  {
    title: "마이펫",
    url: "/pet",
    icon: Home,
  },
  // {
  //   title: "알 등록",
  //   url: "/register/egg",
  //   icon: Egg,
  // },
  {
    title: "개체 등록",
    url: "/register/1",
    icon: Inbox,
  },
  {
    title: "분양룸",
    url: "/adoption",
    icon: DollarSign,
  },
  {
    title: "메이팅룸",
    url: "/mating",
    icon: Heart,
  },
  {
    title: "알림",
    url: "/noti",
    icon: Bell,
  },
  {
    title: "해칭룸",
    url: "/hatching",
    icon: Bubbles,
  },
  {
    title: "쇼츠",
    url: "/shorts",
    icon: Film,
  },
  {
    title: "가족관계도",
    url: "/familyTree",
    icon: TreeDeciduous,
  },
];

export const FOOD_BADGE_COLORS: Record<string, string> = {
  "판게아 인섹트": "bg-indigo-300",
  귀뚜라미: "bg-gray-300",
  누에: "bg-yellow-300",
  "지렙 인섹트": "bg-blue-100",
};

export const FOOD_BADGE_TEXT_COLORS: Record<string, string> = {
  "판게아 인섹트": "text-indigo-900",
  귀뚜라미: "text-gray-900",
  누에: "text-yellow-900",
  "지렙 인섹트": "text-blue-900",
};

export const NOTIFICATION_TYPE: Record<UserNotificationDtoType, { label: string; color: string }> =
  {
    parent_request: {
      label: "부모 연동 요청",
      color: "bg-gray-200 text-gray-900",
    },
    parent_accept: {
      label: "부모 연동 수락",
      color: "bg-green-600",
    },
    parent_reject: {
      label: "부모 연동 거절",
      color: "bg-red-600",
    },
    owner_transfer: {
      label: "주인 이전",
      color: "bg-blue-600",
    },
    owner_accept: {
      label: "주인 수락",
      color: "bg-green-600",
    },
    owner_reject: {
      label: "주인 거절",
      color: "bg-red-600",
    },
  };

export const STATUS_MAP = {
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

export const USER_STATUS_MAP: Record<UserDtoStatus, string> = {
  pending: "정보 미입력",
  active: "활성",
  inactive: "비활성",
  suspended: "정지",
  deleted: "삭제",
};
