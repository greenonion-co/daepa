import { Home, Inbox } from "lucide-react";
import { FormStep, SelectorConfig } from "./register/types";
import { FOOD } from "@/types/pet";
import { BadgeProps } from "@mui/material";

export const USER_NAME = "낸시";

export const REGISTER_PAGE = {
  FIRST: 0,
  SECOND: 1,
};

export const FORM_STEPS: FormStep[] = [
  {
    title: "종",
    fields: {
      name: "species",
      type: "select",
      required: true,
      placeholder: "종을 선택해주세요",
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "모프",
    fields: {
      name: "morph",
      type: "morph",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "크기",
    fields: {
      name: "size",
      type: "select",
      placeholder: "크기를 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "성별",
    fields: {
      name: "gender",
      type: "select",
      placeholder: "성별을 선택해주세요",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
];

export const OPTION_STEPS: FormStep[] = [
  {
    title: "사진",
    fields: {
      name: "photo",
      type: "file",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "부모 개체 정보",
    fields: {
      name: "parentSearch",
      type: "parentSearch",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "해칭일",
    fields: {
      name: "hatchingDate",
      type: "date",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "체중",
    fields: {
      name: "weight",
      type: "number",
      required: true,
      validation: (value) => !isNaN(Number(value)) && Number(value) > 0,
    },
  },
  {
    title: "개체 이름/관리번호",
    fields: {
      name: "name",
      type: "text",
      required: true,
      validation: (value) => value.length > 0,
    },
  },
  {
    title: "상세 설명",
    fields: {
      name: "description",
      type: "textarea",
      required: false,
    },
  },
];

export const MORPH_LIST_BY_SPECIES: Record<string, string[]> = {
  "레오파드 게코": [
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
  "크레스티드 게코": ["노멀", "하리퀸", "다크", "파이어", "트라이컬러", "기타"],
};

export const SALE_KOREAN_INFO = {
  NFS: "판매 안함",
  SOLD: "판매 완료",
  ON_SALE: "판매 중",
  ON_RESERVATION: "예약 중",
  TBD: "가격 미정",
};

export const TABLE_HEADER = {
  name: "이름",
  species: "종",
  morphs: "모프",
  traits: "형질",
  sex: "성별",
  size: "크기",
  weight: "몸무게",
  mother: "모",
  father: "부",
  birthdate: "생년월일",
  photos: "사진",
  description: "설명",
  foods: "먹이",
  canBreed: "발정 여부",
  breedingCount: "산란",
  pairing: "메이팅 상대",
  saleInfo: "판매 상태",
};

export const SELECTOR_CONFIGS: Record<string, SelectorConfig> = {
  species: {
    title: "종 선택",
    selectList: ["레오파드 게코", "크레스티드 게코"],
  },
  size: {
    title: "크기 선택",
    selectList: ["베이비", "아성체", "준성체", "성체"],
  },
  gender: {
    title: "성별 선택",
    selectList: ["수컷", "암컷", "미구분"],
  },
};

export const SIDEBAR_ITEMS = [
  {
    title: "마이펫",
    url: "/pet",
    icon: Home,
  },
  {
    title: "개체 등록",
    url: "/register",
    icon: Inbox,
  },
];

export const FOOD_BADGE_COLORS: Record<FOOD, string> = {
  "판게아 인섹트": "bg-indigo-300",
  귀뚜라미: "bg-gray-300",
  누에: "bg-yellow-300",
  "지렙 인섹트": "bg-blue-100",
};

export const FOOD_BADGE_TEXT_COLORS: Record<FOOD, string> = {
  "판게아 인섹트": "text-indigo-900",
  귀뚜라미: "text-gray-900",
  누에: "text-yellow-900",
  "지렙 인섹트": "text-blue-900",
};

export const GENDER_KOREAN_INFO = {
  M: "수컷",
  F: "암컷",
  N: "미구분",
};

export const SPECIES_KOREAN_INFO = {
  CR: "크레스티드 게코",
  LF: "레오파드 게코",
};
