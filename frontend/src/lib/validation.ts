import { z } from "zod";

/** Shared zod primitives with Uzbek messages. Page authors compose these. */
export const zodMessages = {
  required: "Bu maydon majburiy",
  email: "Email noto'g'ri formatda",
  minPassword: "Parol kamida 8 ta belgidan iborat bo'lishi kerak",
  minName: "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
  nonNegative: "Manfiy bo'lishi mumkin emas",
};

export const emailSchema = z.string().trim().min(1, zodMessages.required).email(zodMessages.email);
export const passwordSchema = z.string().min(8, zodMessages.minPassword);
export const fullNameSchema = z.string().trim().min(2, zodMessages.minName).max(120, "Juda uzun");
export const phoneSchema = z
  .string()
  .trim()
  .max(30, "Juda uzun")
  .regex(/^[+\d\s()-]*$/, "Telefon raqami noto'g'ri")
  .optional()
  .or(z.literal(""));
export const requiredString = (label = "Bu maydon") => z.string().trim().min(1, `${label} majburiy`);
export const priceSchema = z.coerce.number().int("Butun son bo'lishi kerak").min(0, zodMessages.nonNegative);
export const ratingSchema = z.number().int().min(1, "Baho tanlang").max(5);
