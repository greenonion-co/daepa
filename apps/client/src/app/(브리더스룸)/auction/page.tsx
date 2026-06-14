import { redirect } from "next/navigation";

// 경매 진입점은 분양룸의 '경매' 탭으로 일원화됨.
// 기존 /auction 링크·북마크·알림 딥링크 호환을 위해 탭으로 리다이렉트한다.
export default function AuctionPage() {
  redirect("/adoption?tab=auction");
}
