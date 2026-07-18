import { z } from 'zod'

// Shared building blocks for validating Server Action input across features.
// Prisma models in this app all use uuid ids, so every foreign key/id field
// can be checked against the same shape.
export const uuidField = z.string().uuid()
export const requiredString = z.string().trim().min(1)
export const optionalString = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => value || null)

export const finiteAmount = z.number().finite()
export const positiveAmount = z.number().finite().positive()

export const validDate = z
  .date()
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: 'Invalid date',
  })
