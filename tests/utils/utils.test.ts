import { Frown, Meh, Smile } from 'lucide-react';

import { getDifficultyInfo, getDifficultyLabel } from '@/lib/utils';

// date-fnsのモック
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation(() => '2023年5月15日'),
}));

jest.mock('date-fns/locale', () => ({
  ja: {},
}));

describe('getDifficultyInfo', () => {
  it('returns correct info for difficulty level 1', () => {
    const info = getDifficultyInfo(1);
    expect(info.label).toBe('とても簡単だった');
    expect(info.icon).toBe(Smile);
    expect(info.color).toBe('difficulty-easy');
  });

  it('returns correct info for difficulty level 3', () => {
    const info = getDifficultyInfo(3);
    expect(info.label).toBe('普通だった');
    expect(info.icon).toBe(Meh);
    expect(info.color).toBe('difficulty-normal');
  });

  it('returns correct info for difficulty level 5', () => {
    const info = getDifficultyInfo(5);
    expect(info.label).toBe('とても難しかった');
    expect(info.icon).toBe(Frown);
    expect(info.color).toBe('difficulty-hard');
  });

  it('returns default info for invalid difficulty level', () => {
    const info = getDifficultyInfo(0); // 無効な値
    expect(info.label).toBe('不明');
    expect(info.icon).toBe(Meh);
    expect(info.color).toBe('difficulty-unknown');
  });
});

describe('getDifficultyLabel', () => {
  it('returns correct labels for different difficulty levels', () => {
    expect(getDifficultyLabel(1)).toBe('とても簡単だった');
    expect(getDifficultyLabel(2)).toBe('簡単だった');
    expect(getDifficultyLabel(3)).toBe('普通だった');
    expect(getDifficultyLabel(4)).toBe('難しかった');
    expect(getDifficultyLabel(5)).toBe('とても難しかった');
    expect(getDifficultyLabel(0)).toBe('不明'); // 無効な値
  });
});
