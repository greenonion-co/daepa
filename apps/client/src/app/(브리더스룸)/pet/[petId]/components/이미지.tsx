import { PetDto } from "@repo/api-client";
import { fetchImages } from "../data";
import ImagesContent from "./ImagesContent";

interface ImagesProps {
  pet: PetDto;
}

export default async function Images({ pet }: ImagesProps) {
  const images = await fetchImages(pet.petId);

  return <ImagesContent pet={pet} initialImages={images} />;
}
