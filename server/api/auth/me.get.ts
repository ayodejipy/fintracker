import { getUserSession } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)

    if (!session?.user) {
      return null
    }

    return {
      user: session.user,
    }
  }
  catch (error) {
    console.error('Session check error:', error)
    return null
  }
})
