"use client";

import { petControllerFindOne, PetDto } from "@repo/api-client";
import PetDetail from "./petDetail";
import { generateQRCode, formatDateToYYYYMMDDString } from "@/lib/utils";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import Loading from "@/components/common/Loading";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);
  const [pet, setPet] = useState<PetDto | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const petResponse = await petControllerFindOne(petId);

        if (!petResponse.data) {
          notFound();
        }

        const formattedData = {
          ...petResponse.data,
          ...(petResponse.data.birthdate && {
            birthdate: formatDateToYYYYMMDDString(petResponse.data.birthdate),
          }),
        };

        setPet(formattedData as PetDto);

        const qrCode = await generateQRCode(`${"http://192.168.45.46:3000"}/pet/${petId}`);
        setQrCodeDataUrl(qrCode);
      } catch (error) {
        console.error("Error fetching pet data:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [petId]);

  if (loading) {
    return <Loading />;
  }

  if (!pet) {
    return null;
  }

  return <PetDetail pet={pet} qrCodeDataUrl={qrCodeDataUrl} />;
}

export default PetDetailPage;
