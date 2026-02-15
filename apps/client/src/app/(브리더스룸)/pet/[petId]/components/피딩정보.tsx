import { PetDto } from "@repo/api-client";
import { fetchFeedings } from "../data";
import FeedingInfoContent from "./FeedingInfoContent";

interface FeedingInfoProps {
  pet: PetDto;
}

export default async function FeedingInfo({ pet }: FeedingInfoProps) {
  const feedings = await fetchFeedings(pet.petId);

  return (
    <FeedingInfoContent
      petId={pet.petId}
      ownerId={pet.owner.userId ?? ""}
      initialFeedings={feedings}
      defaultFoods={pet.foods}
    />
  );
}
