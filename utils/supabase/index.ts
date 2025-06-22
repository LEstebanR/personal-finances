import { createClient as createBrowserClient } from './client'

/**
 * Cliente de Supabase para usar en Client Components
 * No requiere await - se puede usar directamente
 *
 * @example
 * ```typescript
 * import { supabaseClient } from '@/utils/supabase'
 *
 * const { data, error } = await supabaseClient().from('users').select('*')
 * ```
 */
export const supabaseClient = () => {
  return createBrowserClient()
}

// Re-exportar el cliente del browser
export { createClient as createBrowserClient } from './client'
