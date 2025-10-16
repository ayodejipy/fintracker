import { NotificationScheduler } from '../utils/notification-scheduler'

/**
 * Nitro plugin to run notification checks periodically
 * Checks run every hour
 */
export default defineNitroPlugin(() => {
  // Only run in production or if explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development'
  const enableScheduler = process.env.ENABLE_NOTIFICATION_SCHEDULER === 'true'

  if (!isDevelopment || enableScheduler) {
    console.log('Starting notification scheduler...')

    // Run checks every hour (3600000 ms)
    const interval = 60 * 60 * 1000 // 1 hour

    // Run initial check after 1 minute
    setTimeout(async () => {
      console.log('Running initial notification checks...')
      try {
        await NotificationScheduler.runAllChecks()
      }
      catch (error) {
        console.error('Error in initial notification checks:', error)
      }
    }, 60 * 1000) // 1 minute

    // Set up recurring checks
    setInterval(async () => {
      console.log('Running scheduled notification checks...')
      try {
        await NotificationScheduler.runAllChecks()
      }
      catch (error) {
        console.error('Error in scheduled notification checks:', error)
      }
    }, interval)

    console.log(`Notification scheduler started. Checks will run every ${interval / 60000} minutes.`)
  }
  else {
    console.log('Notification scheduler disabled in development. Set ENABLE_NOTIFICATION_SCHEDULER=true to enable.')
  }
})
