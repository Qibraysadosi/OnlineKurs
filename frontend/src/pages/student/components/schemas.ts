import { z } from "zod";
import { fullNameSchema, passwordSchema, phoneSchema, zodMessages } from "@/lib/validation";

/** Digits only, e.g. "8600 1234 5678 9012" -> "8600123456789012" */
export function cardDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** "8600123456789012" -> "8600 1234 5678 9012" (max 16 digits) */
export function formatCardNumber(value: string): string {
  return cardDigits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** "1229" -> "12/29" (max 4 digits) */
export function formatExpiry(value: string): string {
  const digits = cardDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function expiryIsInFuture(value: string): boolean {
  const [mm, yy] = value.split("/");
  const month = Number(mm);
  const year = 2000 + Number(yy);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export const checkoutSchema = z.object({
  card_number: z
    .string()
    .min(1, zodMessages.required)
    .refine((v) => /^\d{16}$/.test(cardDigits(v)), "Karta raqami 16 ta raqamdan iborat bo'lishi kerak"),
  expiry: z
    .string()
    .min(1, zodMessages.required)
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Muddatni OO/YY ko'rinishida kiriting")
    .refine(expiryIsInFuture, "Kartaning amal qilish muddati tugagan"),
  cvc: z.string().min(1, zodMessages.required).regex(/^\d{3,4}$/, "CVC 3 yoki 4 ta raqamdan iborat"),
  holder: z.string().trim().min(2, "Karta egasining ismini kiriting").max(60, "Juda uzun"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const profileSchema = z.object({
  full_name: fullNameSchema,
  phone: phoneSchema,
  bio: z.string().trim().max(500, "Bio 500 ta belgidan oshmasligi kerak").optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Joriy parolni kiriting"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "Yangi parolni takrorlang"),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: "Parollar mos kelmadi",
    path: ["confirm_password"],
  })
  .refine((v) => v.new_password !== v.current_password, {
    message: "Yangi parol joriy paroldan farq qilishi kerak",
    path: ["new_password"],
  });

export type PasswordFormValues = z.infer<typeof passwordChangeSchema>;
