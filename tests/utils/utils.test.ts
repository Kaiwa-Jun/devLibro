import { getDifficultyInfo, getDifficultyLabel } from "@/lib/utils";
import { Smile, Meh, Frown } from "lucide-react";

// date-fnsのモック
jest.mock("date-fns", () => ({
  format: jest.fn().mockImplementation(() => "2023年5月15日"),
}));

jest.mock("date-fns/locale", () => ({
  ja: {},
}));

describe("getDifficultyInfo", () => {
  it("returns correct info for difficulty level 1", () => {
    const info = getDifficultyInfo(1);
    expect(info.label).toBe("簡単");
    expect(info.icon).toBe(Smile);
    expect(info.color).toBe("difficulty-easy");
  });

  it("returns correct info for difficulty level 3", () => {
    const info = getDifficultyInfo(3);
    expect(info.label).toBe("普通");
    expect(info.icon).toBe(Meh);
    expect(info.color).toBe("difficulty-normal");
  });

  it("returns correct info for difficulty level 5", () => {
    const info = getDifficultyInfo(5);
    expect(info.label).toBe("難しい");
    expect(info.icon).toBe(Frown);
    expect(info.color).toBe("difficulty-hard");
  });

  it("returns default info for invalid difficulty level", () => {
    const info = getDifficultyInfo(0); // 無効な値
    expect(info.label).toBe("不明");
    expect(info.icon).toBe(Meh);
    expect(info.color).toBe("difficulty-unknown");
  });
});

describe("getDifficultyLabel", () => {
  it("returns correct labels for different difficulty levels", () => {
    expect(getDifficultyLabel(1)).toBe("簡単");
    expect(getDifficultyLabel(2)).toBe("やや簡単");
    expect(getDifficultyLabel(3)).toBe("普通");
    expect(getDifficultyLabel(4)).toBe("やや難しい");
    expect(getDifficultyLabel(5)).toBe("難しい");
    expect(getDifficultyLabel(0)).toBe("不明"); // 無効な値
  });
});
