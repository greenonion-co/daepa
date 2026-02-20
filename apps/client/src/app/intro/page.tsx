"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Check, ArrowRight, ChevronDown, Home, DollarSign, Bubbles } from "lucide-react";

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
    tag: "MY개체",
    headline: "내 모든 개체를\n한 곳에서",
    desc: "복잡한 엑셀 없이 개체 정보를 체계적으로 기록하세요. 모프, 형질, 가계도까지 단 한 앱으로.",
    points: ["종·모프·형질 상세 기록", "사진으로 성장 과정 관리", "부모 연결 & 가계도 자동 생성"],
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
        <Link
          href="/sign-in"
          className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-colors hover:bg-white/90"
        >
          시작하기
        </Link>
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
            크레스티드 게코 브리더를 위한 앱
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

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/sign-in"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black shadow-2xl transition-all hover:bg-white/90 active:scale-95"
            >
              지금 시작하기 <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/12 active:scale-95"
            >
              카카오로 시작
            </Link>
          </motion.div>
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
            카카오 · 구글 계정으로 간편하게
          </motion.p>

          <motion.div variants={fadeUp} className="flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/sign-in"
              className="flex w-full items-center justify-center rounded-2xl bg-[#FEE500] py-4 text-sm font-bold text-gray-900 transition-all hover:brightness-95 active:scale-95"
            >
              카카오로 시작하기
            </Link>
            <Link
              href="/sign-in"
              className="flex w-full items-center justify-center rounded-2xl bg-white/10 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15 active:scale-95"
            >
              구글로 시작하기
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
