import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatYyMmDd = (input?: string | number | Date) => {
  if (!input) return '-';
  try {
    return format(new Date(input), 'yy년 MM월 dd일', { locale: ko });
  } catch {
    return '-';
  }
};

export const buildTransformedUrl = (
  raw: string | undefined,
  transform: string = 'width=800,height=1400,format=webp',
) => {
  if (!raw) return '';
  const cdnBase =
    process.env.NEXT_PUBLIC_CDN_URL ?? 'https://daepa.store/cdn-cgi/image';

  return `${cdnBase}/${transform}${raw}`;
};
