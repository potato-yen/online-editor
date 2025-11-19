// frontend/src/lib/utils.ts

/**
 * 一個簡單的 class 合併工具，過濾掉 false/null/undefined 的值。
 * 用法類似 clsx，但不需要額外安裝套件。
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}