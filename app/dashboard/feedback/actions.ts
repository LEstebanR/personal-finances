'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { optionalString } from '@/lib/validation'
import { z } from 'zod'

const feedbackSchema = z.object({
  name: optionalString,
  message: z.string().trim().min(3).max(2000),
})

export async function submitFeedback(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { name, message } = feedbackSchema.parse({
    name: formData.get('name'),
    message: formData.get('message'),
  })

  await prisma.feedback.create({
    data: { userId: session.user.id, name, message },
  })
}
