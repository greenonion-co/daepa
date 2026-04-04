import { useEffect } from "react";
import { viewLogControllerRecordView } from "@repo/api-client";

export function useViewLog(resourceType: string, resourceId: string) {
  useEffect(() => {
    viewLogControllerRecordView(resourceType, resourceId).catch(() => {});
  }, [resourceType, resourceId]);
}
