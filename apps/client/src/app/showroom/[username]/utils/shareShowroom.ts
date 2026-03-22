import { toast } from "@/lib/toast";
import { isNativeApp, requestShare } from "@/lib/native-bridge";

export async function shareShowroom(name: string) {
  const url = `${window.location.origin}/@${encodeURIComponent(name)}`;
  if (isNativeApp()) {
    requestShare(url, `${name}의 쇼룸`);
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("쇼룸 링크가 복사되었습니다");
  } catch {
    toast.error("링크 복사에 실패했습니다");
  }
}
