// src/utils/mountain.ts
export function baseMountainName(raw: unknown): string {
  if (!raw) return "";
  let s = String(raw).trim();

  // 괄호/대괄호/중괄호 안 내용 제거: "덕유산(향적봉)" → "덕유산"
  s = s.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, "");

  // '산'이 있으면 그 글자까지 자르기: "지리산 천왕봉" → "지리산"
  const i = s.indexOf("산");
  if (i !== -1) s = s.slice(0, i + 1);

  return s.replace(/\s+/g, " ").trim();
}