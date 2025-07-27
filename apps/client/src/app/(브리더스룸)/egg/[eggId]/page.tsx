"use client";

import { eggControllerFindOne } from "@repo/api-client";
import EggDetail from "../ EggDetail";
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
    queryKey: [eggControllerFindOne.name, eggId],
    queryFn: () => eggControllerFindOne(eggId),
    select: (response) => response.data,
    enabled: !!eggId,
  });

  if (!data) return null;

  return <EggDetail egg={data} />;
};

export default EggDetailPage;
