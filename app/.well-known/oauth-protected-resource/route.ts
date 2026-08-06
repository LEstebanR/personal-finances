import { baseURL } from '@/lib/oauth'
import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler'

export const GET = protectedResourceHandler({
  authServerUrls: [baseURL],
  resourceUrl: `${baseURL}/api/mcp`,
})

export const OPTIONS = metadataCorsOptionsRequestHandler()
