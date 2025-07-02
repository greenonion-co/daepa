"use client";

import { eggControllerFindOne } from "@repo/api-client";
import EggDetail from "../ EggDetail";
import { formatDateToYYYYMMDDString } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";
interface EggDetailPageProps {
  params: Promise<{
    eggId: string;
  }>;
}

const EggDetailPage = ({ params }: EggDetailPageProps) => {
  const { eggId } = use(params);

  const { data } = useQuery({
    queryKey: [eggControllerFindOne.name],
    queryFn: () => eggControllerFindOne(eggId),
    select: (response) => response.data,
  });

  if (!data) return null;

  const formattedData = {
    ...data,
    layingDate: formatDateToYYYYMMDDString(data.layingDate),
  };

  return <EggDetail egg={formattedData} />;
};

export default EggDetailPage;
