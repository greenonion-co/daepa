import { FORM_STEP } from "./types";

export const USER_NAME = "낸시";

export const FORM_STEPS: FORM_STEP[] = [
  {
    title: "종",
    fields: [
      {
        name: "species",
        type: "species",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
  {
    title: "모프",
    fields: [
      {
        name: "morph",
        type: "morph",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
  {
    title: "크기",
    fields: [
      {
        name: "size",
        type: "size",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
  {
    title: "성별",
    fields: [
      {
        name: "gender",
        type: "select",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
];

export const OPTION_STEPS: FORM_STEP[] = [
  {
    title: "사진",
    fields: [
      {
        name: "photo",
        type: "file",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },

  {
    title: "부모 개체 정보",
    fields: [
      {
        name: "parentSearch",
        type: "parentSearch",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
  {
    title: "해칭일",
    fields: [
      {
        name: "hatchingDate",
        type: "date",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
  {
    title: "체중",
    fields: [
      {
        name: "weight",
        type: "number",
        required: true,
        validation: (value) => !isNaN(Number(value)) && Number(value) > 0,
      },
    ],
  },
  {
    title: "개체 이름/관리번호",
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        validation: (value) => value.length > 0,
      },
    ],
  },
  {
    title: "상세 설명",
    fields: [
      {
        name: "description",
        type: "textarea",
        required: false,
      },
    ],
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
