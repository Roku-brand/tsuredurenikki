import { z } from "zod";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}, z.number().nullable());

const optionalScore = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}, z.number().int().min(1).max(5).nullable());

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}, z.string().nullable());

export const diaryEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: optionalText,
  body: optionalText,
  mood: optionalScore,
  stress_level: optionalScore,
  anxiety_level: optionalScore,
  fulfillment_level: optionalScore,
  physical_condition: optionalScore,
  wake_time: z
    .preprocess((value) => (typeof value === "string" && value.trim() ? value : null), z.string().nullable())
    .refine((value) => !value || /^\d{2}:\d{2}$/.test(value), "起床時間の形式が正しくありません"),
  sleep_hours: optionalNumber,
  weather: optionalText,
  breakfast: optionalText,
  lunch: optionalText,
  dinner: optionalText,
  snack: optionalText,
  meal_note: optionalText,
  good_things: optionalText,
  reflections: optionalText,
  learnings: optionalText,
  worries: optionalText,
  tomorrow_todo: optionalText,
  tomorrow_policy: optionalText,
  memo: optionalText,
  idea_note: optionalText,
  news_note: optionalText,
  body_weight: optionalNumber,
  tags: z.string().optional().default("")
});

export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;

export const searchSchema = z.object({
  keyword: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mood: z.array(z.number()).optional(),
  stressLevel: z.array(z.number()).optional(),
  sleepHoursMin: z.number().optional(),
  sleepHoursMax: z.number().optional(),
  hasMealLog: z.boolean().optional()
});
