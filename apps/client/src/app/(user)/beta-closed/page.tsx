"use client";

const BetaClosedPage = () => {
  return (
    <div className="flex min-h-[calc(100dvh-52px)] w-full items-center justify-center dark:bg-black">
      <div className="w-[90vw] max-w-md text-center">
        <div className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          BREEDY 베타테스트 기간입니다
        </div>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          브리디를 사용해보고 싶으시다면
          <br />
          정식 출시 알림을 신청해주세요!
        </p>
        <a
          href="https://forms.gle/PfJKCk4ViuYSSPSm7"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          정식 출시 알림 신청
        </a>
      </div>
    </div>
  );
};

export default BetaClosedPage;
