/**
 * 로컬스토리지 기반 스트릭(연속 읽기) 시스템
 * - 신문 열람 시 recordActivity() 호출
 * - 연속된 날에 호출해야 스트릭 유지 (1일 이상 건너뛰면 리셋)
 */

const STREAK_KEY = "dream_streak";
const LAST_ACTIVE_KEY = "dream_last_active";
const BEST_STREAK_KEY = "dream_best_streak";

export interface StreakData {
  days: number;
  lastActive: string | null;
  bestStreak: number;
  isActiveToday: boolean;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function getStreak(): StreakData {
  if (typeof window === "undefined") {
    return { days: 0, lastActive: null, bestStreak: 0, isActiveToday: false };
  }

  const days = parseInt(localStorage.getItem(STREAK_KEY) || "0");
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  const bestStreak = parseInt(localStorage.getItem(BEST_STREAK_KEY) || "0");
  const isActiveToday = lastActive === todayStr();

  // 스트릭이 끊겼으면 0으로 리셋
  if (lastActive && lastActive !== todayStr() && lastActive !== yesterdayStr()) {
    localStorage.setItem(STREAK_KEY, "0");
    return { days: 0, lastActive, bestStreak, isActiveToday: false };
  }

  return { days, lastActive, bestStreak, isActiveToday };
}

export function recordActivity(): StreakData {
  if (typeof window === "undefined") {
    return { days: 0, lastActive: null, bestStreak: 0, isActiveToday: false };
  }

  const today = todayStr();
  const { days, lastActive, bestStreak } = getStreak();

  // 오늘 이미 기록됨
  if (lastActive === today) {
    return { days, lastActive, bestStreak, isActiveToday: true };
  }

  let newDays: number;
  if (!lastActive || (lastActive !== yesterdayStr() && lastActive !== today)) {
    newDays = 1; // 처음 또는 스트릭 끊김
  } else {
    newDays = days + 1; // 연속
  }

  const newBest = Math.max(newDays, bestStreak);

  localStorage.setItem(STREAK_KEY, String(newDays));
  localStorage.setItem(LAST_ACTIVE_KEY, today);
  localStorage.setItem(BEST_STREAK_KEY, String(newBest));

  return { days: newDays, lastActive: today, bestStreak: newBest, isActiveToday: true };
}
