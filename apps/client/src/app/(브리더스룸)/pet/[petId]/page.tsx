import { petControllerFindOne } from "@repo/api-client";
import PetDetail from "./petDetail";
import { generateQRCode, formatDateToYYYYMMDDString } from "@/lib/utils";
import { notFound } from "next/navigation";
interface PetDetailPageProps {
  params: {
    petId: string;
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const pet = await petControllerFindOne(params.petId);

  if (!pet.data) {
    notFound();
  }

  const formattedData = {
    ...pet.data,
    ...(pet.data.birthdate && {
      birthdate: formatDateToYYYYMMDDString(pet.data.birthdate),
    }),
  };

  const qrCodeDataUrl = await generateQRCode(`${"http://192.168.45.46:3000"}/pet/${params.petId}`);

  return <PetDetail pet={formattedData} qrCodeDataUrl={qrCodeDataUrl} />;
}

export default PetDetailPage;
