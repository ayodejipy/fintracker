export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  console.warn('🔍 TEST: Authorization header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'MISSING')
  console.warn('🔍 TEST: All headers:', Object.fromEntries(
    Object.entries(event.node.req.headers).filter(([k]) => k.toLowerCase().includes('auth'))
  ))

  return {
    success: true,
    hasAuthHeader: !!authHeader,
    authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : null,
  }
})
