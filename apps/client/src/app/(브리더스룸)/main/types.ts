export type PET_INFO = {
  id: string;
  name: string;
};

export type PET = {
  id: string;
  name: string;
  species: string;
  morph: string[];
  size: string;
  sex: string;
  weight: number;
  mother: PET_INFO;
  father: PET_INFO;
  birthDate: string;
  photos: string[];
  description: string;
  food: string;
  canBreed: boolean;
  breedingCount: number;
  pairing: PET_INFO;
  saleInfo: string;
};
