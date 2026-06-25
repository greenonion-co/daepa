"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Check, ChevronDown, Home, DollarSign, Bubbles, Globe } from "lucide-react";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/components/AppInstallPrompt/storeLinks";

/* ── 스토어 브랜드 글리프 (lucide 브랜드 아이콘 미제공) ── */
function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 814 1000" fill="currentColor" className={className} aria-hidden>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}
function GooglePlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
    </svg>
  );
}

/* ── 애니메이션 ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

/* ── 폰 목업 ── */
function PhoneMockup({ src }: { src: string }) {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      {/* 폰 프레임 */}
      <div className="relative rounded-[44px] border-[6px] border-gray-800 bg-gray-900 shadow-[0_40px_80px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
        {/* 노치 */}
        <div className="absolute top-3 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-gray-900" />
        {/* 스크린 */}
        <div className="overflow-hidden rounded-[38px]" style={{ backgroundColor: "#101012" }}>
          {/* 상태바 영역 (노치 높이만큼 확보) */}
          <div className="h-10" />
          <video src={src} autoPlay loop muted playsInline className="w-full" />
          <div className="h-10" />
        </div>
      </div>
      {/* 하단 버튼 */}
      <div className="absolute -bottom-3 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-gray-700" />
    </div>
  );
}

/* ── 기능 데이터 ── */
const features = [
  {
    id: "pet",
    icon: Home,
    tag: "개체룸",
    headline: "내 모든 개체를\n한 곳에서",
    desc: "복잡한 엑셀 없이 개체 정보를 체계적으로 기록하세요. 모프, 형질, 브리딩맵까지 단 한 앱으로.",
    points: ["종·모프·형질 상세 기록", "사진으로 성장 과정 관리", "부모 연결 & 브리딩맵 자동 생성"],
    videoSrc: "/videos/1.mov",
    dark: true,
    flip: false,
  },
  {
    id: "hatching",
    icon: Bubbles,
    tag: "브리딩룸",
    headline: "브리딩 성과를\n숫자로 확인",
    desc: "페어 관리부터 알 해칭 캘린더, 유정란율 통계까지. 데이터로 브리딩을 개선하세요.",
    points: ["페어 생성 & 메모 관리", "알 해칭 캘린더로 일정 파악", "유정란율·부화 성공률 통계"],
    videoSrc: "/videos/2.mov",
    dark: false,
    flip: true,
  },
  {
    id: "adoption",
    icon: DollarSign,
    tag: "분양룸",
    headline: "분양 수익까지\n투명하게",
    desc: "직거래, 택배, 도매, 수출 이력을 기록하고 연간 수익 추이를 그래프로 한눈에 확인하세요.",
    points: [
      "직거래·택배·도매·수출 이력 기록",
      "분양 수익 통계 & 분석",
      "연간·월별 분양 트렌드 확인",
    ],
    videoSrc: "/videos/3.mov",
    dark: true,
    flip: false,
  },
] as const;

/* ── 페이지 ── */
export default function IntroPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="w-full overflow-x-hidden bg-black text-white">
      {/* ── Nav ── */}
      <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-white/[0.08] bg-black/60 px-6 py-4 backdrop-blur-2xl backdrop-saturate-150">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold tracking-tight text-white">BREEDY</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="App Store에서 시작하기"
              className="group flex flex-col items-center gap-1"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <AppleGlyph className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-medium text-white/40 transition-colors group-hover:text-white/70">
                iOS
              </span>
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google Play에서 시작하기"
              className="group flex flex-col items-center gap-1"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <GooglePlayGlyph className="h-4 w-4" />
              </span>
              <span className="text-[9px] font-medium text-white/40 transition-colors group-hover:text-white/70">
                Android
              </span>
            </a>
            <Link
              href="/"
              aria-label="웹에서 시작하기"
              className="group flex flex-col items-center gap-1"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <Globe size={16} strokeWidth={2.5} />
              </span>
              <span className="text-[9px] font-medium text-white/40 transition-colors group-hover:text-white/70">
                Web
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
      >
        {/* 배경 — 아주 미묘한 radial gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,119,198,0.15),transparent)]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* 뱃지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            모든 브리더를 위한 앱
          </motion.div>

          {/* 헤드라인 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 text-[clamp(3rem,10vw,7rem)] leading-[1.0] font-black tracking-[-0.04em]"
          >
            개체 관리부터
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              분양까지
            </span>
          </motion.h1>

          {/* 서브 */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-10 max-w-md text-lg text-white/50 sm:text-xl"
          >
            엑셀 대신, 기록장 대신.
            <br />
            브리더를 위한 단 하나의 앱.
          </motion.p>

        </motion.div>

        {/* 스크롤 힌트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-xs text-white/20"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 기능 섹션 ── */}
      {features.map((f) => {
        const bg = f.dark ? "bg-black border-t border-white/[0.06]" : "bg-white";
        const textPrimary = f.dark ? "text-white" : "text-gray-900";
        const textSecondary = f.dark ? "text-white/50" : "text-gray-500";
        const textTag = f.dark ? "text-indigo-300" : "text-indigo-500";
        const pointText = f.dark ? "text-white/70" : "text-gray-600";
        const checkBg = f.dark ? "bg-white/10" : "bg-indigo-50";
        const checkColor = f.dark ? "text-white/60" : "text-indigo-500";

        const textSide = (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col justify-center"
          >
            <motion.div
              variants={fadeUp}
              className={`mb-4 flex items-center gap-2 text-sm font-semibold ${textTag}`}
            >
              {f.tag}
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className={`mb-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] whitespace-pre-line ${textPrimary}`}
            >
              {f.headline}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className={`mb-8 max-w-sm text-base leading-relaxed sm:text-lg ${textSecondary}`}
            >
              {f.desc}
            </motion.p>

            <motion.ul variants={stagger} className="space-y-3">
              {f.points.map((point) => (
                <motion.li
                  key={point}
                  variants={fadeUp}
                  className={`flex items-center gap-2 text-lg ${pointText}`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${checkBg}`}
                  >
                    <Check size={10} className={checkColor} strokeWidth={3} />
                  </div>
                  {point}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        );

        const mediaSide = (
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <PhoneMockup src={f.videoSrc} />
          </motion.div>
        );

        return (
          <section
            key={f.id}
            className={`${bg} flex min-h-screen items-center px-6 py-28 sm:px-12 lg:px-24`}
          >
            <div className="mx-auto grid w-full max-w-6xl items-center gap-16 sm:grid-cols-2 sm:gap-24">
              {f.flip ? (
                <>
                  {mediaSide}
                  {textSide}
                </>
              ) : (
                <>
                  {textSide}
                  {mediaSide}
                </>
              )}
            </div>
          </section>
        );
      })}

      {/* ── Bottom CTA ── */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center border-t border-white/[0.06] bg-black px-6 py-28 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="flex flex-col items-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/5 ring-1 ring-white/10"
          >
            BREEDY
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="mb-4 text-[clamp(2rem,6vw,4rem)] font-black tracking-[-0.04em] text-white"
          >
            지금 바로 시작해보세요
          </motion.h2>

          <motion.p variants={fadeUp} className="mb-10 text-base text-white/40">
            앱으로 더 편하게, 웹에서 바로 시작하세요
          </motion.p>

          <motion.div variants={fadeUp} className="flex w-full max-w-sm flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-white py-3.5 text-gray-900 transition-all hover:bg-white/90 active:scale-95"
              >
                <AppleGlyph className="h-5 w-5" />
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-medium text-gray-500">다운로드</span>
                  <span className="text-sm font-bold">App Store</span>
                </span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-white/10 py-3.5 text-white backdrop-blur-sm transition-all hover:bg-white/15 active:scale-95"
              >
                <GooglePlayGlyph className="h-5 w-5" />
                <span className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-medium text-white/50">다운로드</span>
                  <span className="text-sm font-bold">Google Play</span>
                </span>
              </a>
            </div>
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
            >
              <Globe size={16} strokeWidth={2.5} />
              웹에서 시작하기
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
