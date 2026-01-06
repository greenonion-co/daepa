import { Bubbles, DollarSign, Home } from "lucide-react";
import { FormStep } from "./pet/types/form.type";
import {
  EggDetailDtoStatus,
  PetAdoptionDtoMethod,
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
      type: "image",
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
  {
    title: "개체 이름",
    field: {
      name: "name",
      type: "name",
      required: true,
      placeholder: "개체 이름을 입력해주세요",
      validation: (value) => value.length > 0,
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

export const MORPH_LIST_BY_SPECIES: Record<PetDtoSpecies, Record<string, string>> = {
  CR: {
    노멀: "노멀",
    릴리화이트: "릴리화이트",
    아잔틱: "아잔틱",
    릴잔틱: "릴잔틱",
    카푸치노: "카푸치노",
    프라푸치노: "프라푸치노",
    세이블: "세이블",
    릴리세이블: "릴리세이블",
    초초: "초초",
    릴리초초: "릴리초초",
    하이포: "하이포",
    파이드: "파이드",
    마블링: "마블링",
    모노크롬: "모노크롬",
    카푸아잔틱: "카푸아잔틱",
    세이블아잔틱: "세이블아잔틱",
    슈퍼카푸치노: "슈퍼카푸치노",
    슈퍼세이블: "슈퍼세이블",
    슈퍼세이블릴리: "슈퍼세이블릴리",
    루왁: "루왁",
    루왁릴리: "루왁릴리",
    설악: "설악",
    슈퍼하이포: "슈퍼하이포",
    "100%헷아잔틱": "100%헷아잔틱",
    "66%헷아잔틱": "66%헷아잔틱",
    "50%헷아잔틱": "50%헷아잔틱",
    "100%헷초초": "100%헷초초",
    "66%헷초초": "66%헷초초",
    "50%헷초초": "50%헷초초",
  },
  LE: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  FT: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  KN: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  LC: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  GG: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
};

export const TRAIT_LIST_BY_SPECIES: Record<PetDtoSpecies, Record<string, string>> = {
  CR: {
    트익할: "트익할",
    차콜: "차콜",
    팬텀: "팬텀",
    풀핀: "풀핀",
    쿼드: "쿼드",
    핀스트라이프: "핀스트라이프",
    드리피: "드리피",
    화이트스팟: "화이트스팟",
    솔리드백: "솔리드백",
    엠티백: "엠티백",
    SS: "SS",
    SPT: "SPT",
    퓨어화이트: "퓨어화이트",
    화이트포트홀: "화이트포트홀",
    크림: "크림",
    크림시클: "크림시클",
    달마시안: "달마시안",
    슈퍼달마시안: "슈퍼달마시안",
    트라이: "트라이",
    할리퀸: "할리퀸",
    익스트림할리퀸: "익스트림할리퀸",
    바이: "바이",
    레드: "레드",
    탠저린: "탠저린",
    스트로베리: "스트로베리",
    옐로우: "옐로우",
    패턴리스: "패턴리스",
    브린들: "브린들",
    벅스킨: "벅스킨",
    플레임: "플레임",
    할로윈: "할로윈",
  },
  LE: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  FT: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  KN: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  LC: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
  GG: {
    노멀: "노멀",
    하리퀸: "하리퀸",
    다크: "다크",
    파이어: "파이어",
    트라이컬러: "트라이컬러",
    기타: "기타",
  },
};

export const SALE_STATUS_KOREAN_INFO = {
  NONE: "미정",
  NFS: "분양 안함(NFS)",
  ON_SALE: "분양 가능",
  ON_RESERVATION: "예약 중",
  SOLD: "분양 완료",
};

export const TABLE_HEADER = {
  name: "이름",
  species: "종",
  morphs: "모프",
  traits: "형질",
  sex: "성별",
  growth: "크기",
  weight: "몸무게",
  father: "부개체",
  mother: "모개체",
  hatchingDate: "해칭일",
  desc: "설명",
  foods: "먹이",
  isPublic: "공개",
  adoption_status: "분양 상태",
  pet_name: "이름",
  pet_species: "종",
  pet_morphs: "모프",
  pet_hatchingDate: "출생일",
  status: "분양 상태",
  buyer_name: "입양자",
  adoptionDate: "분양 날짜",
  price: "가격",
  memo: "메모",
};

export const SPECIES_KOREAN_ALIAS_INFO: Record<PetDtoSpecies, string> = {
  CR: "크레",
  LE: "레게",
  FT: "펫테일",
  KN: "납테일",
  LC: "리키",
  GG: "가고일",
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

export const GROWTH_KOREAN_INFO: Partial<Record<PetDtoGrowth, string>> = {
  BABY: "베이비",
  JUVENILE: "아성체",
  PRE_ADULT: "준성체",
  ADULT: "성체",
};

export const EGG_STATUS_KOREAN_INFO: Record<EggDetailDtoStatus, string> = {
  UNFERTILIZED: "무정란",
  FERTILIZED: "유정란",
  HATCHED: "해칭완료",
  DEAD: "중지란",
};

export const FOOD_KOREAN_INFO: Record<string, string> = {
  "판게아 인섹트": "판게아 인섹트",
  "지렙 인섹트": "지렙 인섹트",
  바이탈밀: "바이탈밀",
  "리핀리치스 리조또": "리핀리치스 리조또",
  귀뚜라미: "귀뚜라미",
  냉동귀뚜라미: "냉동귀뚜라미",
  누에: "누에",
};

export const ADOPTION_METHOD_KOREAN_INFO: Record<PetAdoptionDtoMethod, string> = {
  PICKUP: "직거래",
  DELIVERY: "택배",
  WHOLESALE: "도매",
  EXPORT: "수출",
};

export const SELECTOR_CONFIGS: Record<
  "species" | "growth" | "sex" | "foods" | "eggStatus" | "adoptionStatus" | "adoptionMethod",
  { title: string; selectList: { key: string; value: string }[] }
> = {
  species: {
    title: "종",
    selectList: [
      {
        key: "CR",
        value: "크레스티드 게코",
      },
      // TODO!: 추후 다른 종도 노출
      // {
      //   key: "LE",
      //   value: "레오파드 게코",
      // },
      // {
      //   key: "FT",
      //   value: "펫테일 게코",
      // },
      // {
      //   key: "KN",
      //   value: "납테일 게코",
      // },
      // {
      //   key: "LC",
      //   value: "리키에너스",
      // },
      // {
      //   key: "GG",
      //   value: "가고일 게코",
      // },
    ],
  },
  growth: {
    title: "크기",
    selectList: [
      {
        key: "ADULT",
        value: "성체",
      },
      {
        key: "PRE_ADULT",
        value: "준성체",
      },
      {
        key: "JUVENILE",
        value: "아성체",
      },

      {
        key: "BABY",
        value: "베이비",
      },
    ],
  },
  sex: {
    title: "성별",
    selectList: [
      {
        key: "M",
        value: "수컷",
      },

      {
        key: "F",
        value: "암컷",
      },
      {
        key: "N",
        value: "미구분",
      },
    ],
  },

  foods: {
    title: "먹이",
    selectList: [
      {
        key: "판게아 인섹트",
        value: "판게아 인섹트",
      },
      {
        key: "귀뚜라미",
        value: "귀뚜라미",
      },
      {
        key: "냉동귀뚜라미",
        value: "냉동귀뚜라미",
      },
      {
        key: "누에",
        value: "누에",
      },
      {
        key: "지렙 인섹트",
        value: "지렙 인섹트",
      },
    ],
  },
  eggStatus: {
    title: "알 상태",
    selectList: [
      {
        key: "UNFERTILIZED",
        value: "무정란",
      },
      {
        key: "FERTILIZED",
        value: "유정란",
      },
      {
        key: "HATCHED",
        value: "해칭완료",
      },
      {
        key: "DEAD",
        value: "중지란",
      },
    ],
  },
  adoptionStatus: {
    title: "분양 상태",
    selectList: [
      {
        key: "NONE",
        value: "미정",
      },
      {
        key: "NFS",
        value: "분양 안함(NFS)",
      },
      {
        key: "ON_SALE",
        value: "분양 가능",
      },
      {
        key: "ON_RESERVATION",
        value: "예약 중",
      },
      {
        key: "SOLD",
        value: "분양 완료",
      },
    ],
  },
  adoptionMethod: {
    title: "거래 방식",
    selectList: [
      {
        key: "NONE",
        value: "미정",
      },
      {
        key: "PICKUP",
        value: "직거래",
      },
      {
        key: "DELIVERY",
        value: "택배",
      },
      {
        key: "WHOLESALE",
        value: "도매",
      },
      {
        key: "EXPORT",
        value: "수출",
      },
    ],
  },
};

export const SIDEBAR_ITEMS = [
  {
    title: "홈",
    url: "/pet",
    icon: Home,
  },
  {
    title: "해칭룸",
    url: "/hatching",
    icon: Bubbles,
  },
  {
    title: "분양룸",
    url: "/adoption",
    icon: DollarSign,
  },
];

export const NOTIFICATION_MESSAGE: Record<UserNotificationDtoType, string> = {
  parent_request: "님이 회원님에게 부모 연동 요청을 보냈습니다.",
  parent_accept: "님이 부모 연동 요청을 수락했습니다.",
  parent_reject: "님이 부모 연동 요청을 거절했습니다.",
  parent_cancel: "님이 부모 연동 요청을 취소했습니다.",
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
    parent_cancel: {
      label: "부모 연동 취소",
      color: "bg-gray-600",
    },
  };

export const STATUS_MAP = {
  pending: {
    label: "대기중",
    color: "bg-yellow-600 ",
  },
  rejected: {
    label: "거절됨",
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

export const ACCEPT_IMAGE_FORMATS: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
};

export const DUPLICATE_CHECK_STATUS = {
  NONE: "none",
  CHECKING: "checking",
  AVAILABLE: "available",
  DUPLICATE: "duplicate",
};

export const STATISTICS_COLORS = {
  fertilized: "#f59e0b", // 따뜻한 앰버 (생명력)
  unfertilized: "#6b7280", // 중성 그레이
  hatched: "#10b981", // 에메랄드 그린 (성공)
  dead: "#ef4444", // 레드 (사망)
  pending: "#8b5cf6", // 바이올렛
  male: "#3182f6", // 블루 (더 선명)
  female: "#f14452", // 핑크 (더 선명)
  unknown: "#94a3b8", // 중성 그레이
};

export const ADOPTION_STATISTICS_COLORS = {
  none: "#94a3b8",
  revenue: "#ef4444",
  count: "#193cb9",
  pickup: "#1447e6",
  delivery: "#165dfc",
  wholesale: "#2b7fff",
  export: "#9cb9e5ff",
  averagePrice: "#10b981",
};
