"use client";

import { petControllerFindOne, PetDto } from "@repo/api-client";
import PetDetail from "./petDetail";
import { generateQRCode, formatDateToYYYYMMDDString } from "@/lib/utils";
import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const { data } = useQuery({
    queryKey: [petControllerFindOne.name],
    queryFn: () => petControllerFindOne(petId),
    select: (response) => response.data,
  });

  useEffect(() => {
    const fetchQrCode = async () => {
      const qrCode = await generateQRCode(`${"http://192.168.45.46:3000"}/pet/${petId}`);
      setQrCodeDataUrl(qrCode);
    };
    fetchQrCode();
  }, [petId]);

  if (!data) return null;

  const formattedData = {
    ...data,
    ...(data?.birthdate && {
      birthdate: formatDateToYYYYMMDDString(data.birthdate),
    }),
  } as PetDto;

  return <PetDetail pet={formattedData} qrCodeDataUrl={qrCodeDataUrl} />;
}

export default PetDetailPage;
