import { generateMcpToken, hashMcpToken } from '@/lib/mcp-auth'
import { prisma } from '@/lib/prisma'

async function main() {
  const email = process.argv[2]
  const name = process.argv[3] ?? 'default'

  if (!email) {
    console.error(
      'Usage: bun run scripts/generate-mcp-key.ts <email> [key-name]'
    )
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`No user found with email ${email}`)
    process.exit(1)
  }

  const token = generateMcpToken()

  await prisma.mcpApiKey.create({
    data: {
      userId: user.id,
      name,
      keyHash: hashMcpToken(token),
    },
  })

  console.log('MCP API key created. Save it now, it will not be shown again:')
  console.log(token)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
