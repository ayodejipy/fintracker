/**
 * Data Migration Script: Populate Category Value Field
 *
 * This script populates the new 'value' field for all existing categories
 * by generating it from the category name.
 *
 * Run with: npx tsx prisma/migrations/populate-category-values.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate category value from name
 * Converts "Food & Groceries" to "food_groceries"
 */
function generateCategoryValue(name: string): string {
  return name
    .replace(/[&,/\s]+/g, '_') // Replace &, commas, slashes, and spaces with underscore
    .replace(/[()]/g, '') // Remove parentheses
    .toLowerCase()
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

async function main() {
  console.log('🔄 Starting data migration: Populating category values...\n')

  // Get all categories
  const categories = await prisma.category.findMany({
    orderBy: [
      { type: 'asc' },
      { name: 'asc' },
    ],
  })

  console.log(`📊 Found ${categories.length} categories to update\n`)

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const category of categories) {
    try {
      // Skip if already has a value
      if (category.value) {
        console.log(`⏭️  Skipping "${category.name}" - already has value: ${category.value}`)
        skipped++
        continue
      }

      // Generate value from name
      const value = generateCategoryValue(category.name)

      // Update the category
      await prisma.category.update({
        where: { id: category.id },
        data: { value },
      })

      console.log(`✅ Updated "${category.name}" → value: "${value}" (${category.type})`)
      updated++
    }
    catch (error: any) {
      const errorMsg = `❌ Error updating "${category.name}": ${error.message}`
      console.error(errorMsg)
      errors.push(errorMsg)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📈 Migration Summary:')
  console.log(`  ✅ Updated: ${updated}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  console.log(`  ❌ Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:')
    errors.forEach(err => console.log(`  ${err}`))
  }

  console.log('='.repeat(60))
  console.log('\n✨ Data migration complete!\n')
}

main()
  .catch((error) => {
    console.error('💥 Fatal error during migration:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
