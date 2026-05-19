import { linking, normalizePath, linkingPrefixes } from '../src/navigation/linking';

describe('linking config', () => {
  it('prefixes는 https://breedy.kr 와 breedy:// 를 포함', () => {
    expect(linkingPrefixes).toContain('https://breedy.kr');
    expect(linkingPrefixes).toContain('breedy://');
  });

  describe('normalizePath', () => {
    it('빈 문자열은 "/"로 정규화', () => {
      expect(normalizePath('')).toBe('/');
    });

    it('이미 / 로 시작하면 그대로', () => {
      expect(normalizePath('/pet/abc')).toBe('/pet/abc');
    });

    it('/ 로 시작하지 않으면 prepend', () => {
      expect(normalizePath('pet/abc')).toBe('/pet/abc');
    });

    it('쿼리 파라미터 보존', () => {
      expect(normalizePath('/pet/abc?ref=share')).toBe('/pet/abc?ref=share');
    });
  });

  describe('getStateFromPath', () => {
    const getState = linking.getStateFromPath!;

    it('펫 상세 path → Main { path: "/pet/abc" }', () => {
      const state = getState('/pet/abc', {} as never);
      expect(state).toEqual({
        routes: [
          { name: 'Tabs', params: undefined },
          { name: 'Main', params: { path: '/pet/abc' } },
        ],
        index: 1,
      });
    });

    it('쇼룸 path + 공유 트래커', () => {
      const state = getState('/showroom/alice?ref=share', {} as never);
      expect(state).toMatchObject({
        index: 1,
        routes: [
          { name: 'Tabs' },
          { name: 'Main', params: { path: '/showroom/alice?ref=share' } },
        ],
      });
    });

    it('알림 path', () => {
      const state = getState('/notifications?id=42', {} as never);
      expect(state).toMatchObject({
        routes: [
          { name: 'Tabs' },
          { name: 'Main', params: { path: '/notifications?id=42' } },
        ],
      });
    });

    it('루트 path는 "/"', () => {
      const state = getState('', {} as never);
      expect(state).toMatchObject({
        routes: [
          { name: 'Tabs' },
          { name: 'Main', params: { path: '/' } },
        ],
      });
    });
  });
});
