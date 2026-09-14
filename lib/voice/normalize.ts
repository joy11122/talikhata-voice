/**
 * Conservative Bengali/Banglish normalization.
 * It never changes entity names; it only normalizes digits
 * and common command words.
 */

const digits: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const aliases: Array<[RegExp, string]> = [
  [/\b(baki|bakite|bakir)\b/gi, 'বাকি'],
  [/\b(joma|jama|dise|diyeche|dilo)\b/gi, 'জমা'],
  [/\b(kinlam|kenlam|kena|kinalam)\b/gi, 'কেনা'],
  [/\b(becha|bikri|bikri korlam)\b/gi, 'বিক্রি'],
  [/\b(khoroch|khoros)\b/gi, 'খরচ'],
  [/\b(stok|stock)\b/gi, 'স্টক'],
  [/\b(customer|grahok)\b/gi, 'কাস্টমার'],
  [/\b(supplier|sarbarahkari)\b/gi, 'সাপ্লায়ার'],
];

export function normalizeVoiceTranscript(
  input: string
): string {
  let s = input
    .replace(
      /[০-৯]/g,
      (c) => digits[c] ?? c
    )
    .replace(/[৳]/g, ' টাকা ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [re, to] of aliases) {
    s = s.replace(re, to);
  }

  return s;
}