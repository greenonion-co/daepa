import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Config from './config';

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

  return `${Config.CDN_URL}/${transform}${raw}`;
};
