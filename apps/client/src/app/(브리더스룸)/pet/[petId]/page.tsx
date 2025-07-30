"use client";

import { petControllerFindPetByPetId } from "@repo/api-client";
import PetDetail from "./petDetail";
import { generateQRCode } from "@/lib/utils";
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
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  useEffect(() => {
    const fetchQrCode = async () => {
      const qrCode = await generateQRCode(`${"http://192.168.45.46:3000"}/pet/${petId}`);
      setQrCodeDataUrl(qrCode);
    };
    fetchQrCode();
  }, [petId]);

  if (!data) return null;

  return <PetDetail pet={data} qrCodeDataUrl={qrCodeDataUrl} />;
}

export default PetDetailPage;
