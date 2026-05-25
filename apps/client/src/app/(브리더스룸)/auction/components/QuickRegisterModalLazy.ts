// Turbopack 이 한글 route group 포함 chunk 이름을 바이트 경계 무시한 채 자르다
// panic 을 일으키는 이슈 우회용 — 짧은 ASCII-only 경로의 재수출 shim.
// Turbopack 패치 이후 제거 가능.
export { default } from "@/app/(브리더스룸)/pet/[petId]/breeding-map/components/QuickRegisterModal";
