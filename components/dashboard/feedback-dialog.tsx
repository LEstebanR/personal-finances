'use client'

import { submitFeedback } from '@/app/dashboard/feedback/actions'
import { useLanguage } from '@/components/language-provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquareHeart } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Form } from '../ui/form'
import { SidebarMenuButton } from '../ui/sidebar'
import { TextField } from '../ui/text-field'
import { TextareaField } from '../ui/textarea-field'

export function FeedbackDialog() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const schema = z.object({
    name: z.string().optional(),
    message: z
      .string()
      .trim()
      .min(3, t('feedback.messageRequired'))
      .max(2000, t('feedback.messageTooLong')),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', message: '' },
  })

  const onSubmit = form.handleSubmit(async () => {
    setIsSubmitting(true)
    const formData = new FormData(formRef.current!)

    try {
      await submitFeedback(formData)
      toast.success(t('feedback.success'))
      form.reset({ name: '', message: '' })
      setIsOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error(t('feedback.failed'))
    }

    setIsSubmitting(false)
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton className="cursor-pointer">
          <MessageSquareHeart />
          {t('feedback.trigger')}
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('feedback.title')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('feedback.description')}</DialogDescription>
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <TextField
              name="name"
              label={t('feedback.nameOptional')}
              type="text"
            />
            <TextareaField
              name="message"
              label={t('feedback.messageLabel')}
              rows={5}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('feedback.sending') : t('feedback.send')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
