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
