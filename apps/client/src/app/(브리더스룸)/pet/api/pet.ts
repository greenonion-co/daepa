import axios from "axios";
import { Pet, CreatePetDto } from "@/types/pet";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const petApi = {
  // 펫 목록 조회
  getAll: async (): Promise<Pet[]> => {
    const response = await axios.get(`${API_URL}/v1/pet`);
    return response.data;
  },

  // 단일 펫 조회
  getDetail: async (id: string): Promise<Pet> => {
    const response = await axios.get(`${API_URL}/v1/pet/${id}`);
    return response.data;
  },

  // 펫 등록
  create: async (data: CreatePetDto): Promise<Pet> => {
    const response = await axios.post(`${API_URL}/v1/pet`, data);
    return response.data;
  },
};
