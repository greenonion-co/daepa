import axios from "axios";
import { Pet, CreatePetDto } from "@/types/pet";
import { petControllerFindOne } from "@repo/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type GetAllPetResponse = {
  data: Pet[];
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    page: number;
    itemPerPage: number;
    totalCount: number;
    totalPage: number;
  };
};

export const petApi = {
  // 펫 목록 조회
  getAll: async (page = 1, itemPerPage = 10): Promise<GetAllPetResponse> => {
    const response = await axios.get(`${API_URL}/v1/pet`, {
      params: {
        page,
        itemPerPage,
      },
    });

    return response.data;
  },

  // 단일 펫 조회
  getDetail: async (id: string): Promise<Pet> => {
    const response = await petControllerFindOne(id);
    return response.data as unknown as Pet;
  },

  // 펫 등록
  create: async (data: CreatePetDto): Promise<Pet> => {
    const response = await axios.post(`${API_URL}/v1/pet`, data);
    return response.data;
  },
};
