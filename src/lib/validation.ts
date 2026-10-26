import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail")
      .email("E-mail inválido"),
    password: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail")
    .email("E-mail inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail")
      .email("E-mail inválido"),
    code: z
      .string()
      .trim()
      .length(6, "O código deve ter 6 dígitos"),
    newPassword: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "O código deve ter 6 dígitos"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
export const DEFAULT_CALIBRATION_FACTOR = 450; 

export const createDeviceSchema = z.object({
  identifier: z
    .string()
    .trim()
    .regex(
      MAC_ADDRESS_PATTERN,
      "Informe o identificador no formato XX:XX:XX:XX:XX:XX",
    ),
  name: z
    .string()
    .trim()
    .min(2, "Dê um nome para o dispositivo"),
  description: z
    .string()
    .trim()
    .min(2, "Informe onde o dispositivo está instalado"),
  calibrationFactor: z.coerce
    .number()
    .positive("O fator de calibração deve ser maior que zero"),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = createDeviceSchema.omit({
  identifier: true,
});

export type UpdateDeviceFormInput = z.infer<typeof updateDeviceSchema>;

export const consumerUnitSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome para a residência"),
  street: z.string().trim().min(1, "Informe a rua"),
  number: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, "Informe um número válido"),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().min(1, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .min(2, "Use a sigla do estado (ex: SP)")
    .max(2, "Use a sigla do estado (ex: SP)"),
  zipCode: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{5}-?\d{3}$/.test(value), "CEP inválido"),
  numberResidents: z.coerce
    .number()
    .int()
    .positive("Informe um número de moradores maior que zero")
    .max(10, "O máximo é de 10 moradores"),
  dailyConsumptionLimit: z.coerce
    .number()
    .positive("O limite diário deve ser maior que zero"),
  hourlyConsumptionLimit: z.coerce
    .number()
    .positive("O limite por hora deve ser maior que zero"),
  leakDurationMinutes: z.coerce
    .number()
    .positive("Informe um tempo de vazamento maior que zero"),
});

export type ConsumerUnitFormInput = z.infer<typeof consumerUnitSchema>;

export function firstFieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
): Partial<Record<keyof T, string>> {
  const fieldErrors: Partial<Record<keyof T, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T | undefined;
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
