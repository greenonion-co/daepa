/**
 * 작업 함수 배열을 주어진 동시성으로 실행.
 *
 * fan-out 비동기 처리(R2 batch, 외부 API 일괄 호출 등)에서 무제한 `Promise.all`이
 * 외부 시스템 burst·connection pool 점유·메모리 폭증을 일으키는 것을 막기 위한 limiter.
 *
 * 각 작업은 **자체 try/catch로 실패를 흡수**해야 한다. worker 안에서 reject가 일어나면
 * 그 worker는 멈춰 나머지 작업을 더 빨리 처리하지 못하게 된다.
 *
 * @example
 *   const jobs = items.map((item) => async () => {
 *     try {
 *       await externalCall(item);
 *     } catch (e) {
 *       console.error(`item=${item.id} 실패:`, e);
 *     }
 *   });
 *   await runWithConcurrency(jobs, 10);
 */
export async function runWithConcurrency<T>(
  jobs: Array<() => Promise<T>>,
  concurrency: number,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, jobs.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= jobs.length) return;
        await jobs[i]();
      }
    },
  );
  await Promise.all(workers);
}
