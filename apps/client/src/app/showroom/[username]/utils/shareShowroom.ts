import { sharePage } from "@/lib/share";

export async function shareShowroom(slug: string) {
  await sharePage({
    path: `/showroom/${slug}`,
    title: "BREEDY 쇼룸",
    copySuccessMessage: "쇼룸 링크가 복사되었습니다",
  });
}
