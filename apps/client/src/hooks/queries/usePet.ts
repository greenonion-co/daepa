import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petApi } from "@/app/(브리더스룸)/pet/api/pet";
import type { CreatePetDto } from "@/types/pet";

export const usePets = () => {
  return useQuery({
    queryKey: ["pets"],
    queryFn: petApi.getAll,
  });
};

export const usePet = (id: string) => {
  return useQuery({
    queryKey: ["pet", id],
    queryFn: () => petApi.getDetail(id),
  });
};

export const useCreatePet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePetDto) => petApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
};
