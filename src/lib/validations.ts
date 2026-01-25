import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address"),
  countryCode: z.string().min(2, "Select a country code"),
  phone: z.string().trim().min(7, "Phone number is required (min 7 digits)"),
  country: z.string().min(2, "Country is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Course registration schema (for new users during enrollment)
export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Password reset schema
export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export const newPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// URL validation schemas
export const youtubeUrlSchema = z.string().trim().refine(
  val => !val || /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/.test(val),
  { message: "Must be a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)" }
);

export const whatsappUrlSchema = z.string().trim().refine(
  val => !val || /^https?:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]+/.test(val),
  { message: "Must be a valid WhatsApp group link (e.g., https://chat.whatsapp.com/...)" }
);
