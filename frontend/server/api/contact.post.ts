// server/api/contact.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { useRuntimeConfig } from '#imports'      // ← pull useRuntimeConfig from Nuxt

export default defineEventHandler(async (event) => {
  const { name, email, message } = await readBody(event)

  // Basic validation
  if (!name || !email || !message) {
    throw createError({ statusCode: 422, statusMessage: 'All fields are required.' })
  }

  const config = useRuntimeConfig()
  const resp = await $fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      from: config.contactFrom,
      to: [config.contactTo],
      subject: `New contact from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
`
    }
  })

  return { success: true }
})
