#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'

interface TestSuite {
  name: string
  pattern: string
  description: string
  timeout?: number
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests',
    pattern: 'tests/utils/*.test.ts tests/composables/*.test.ts',
    description: 'Testing individual functions and composables',
    timeout: 30000,
  },
  {
    name: 'Component Tests',
    pattern: 'tests/components/**/*.test.ts',
    description: 'Testing Vue components in isolation',
    timeout: 45000,
  },
  {
    name: 'Server Tests',
    pattern: 'tests/server/*.test.ts tests/models/*.test.ts',
    description: 'Testing API endpoints and database models',
    timeout: 60000,
  },
  {
    name: 'Integration Tests',
    pattern: 'tests/integration/*.test.ts',
    description: 'Testing API integration with database operations',
    timeout: 90000,
  },
  {
    name: 'End-to-End Tests',
    pattern: 'tests/e2e/*.test.ts',
    description: 'Testing complete user journeys',
    timeout: 120000,
  },
  {
    name: 'Performance Tests',
    pattern: 'tests/performance/*.test.ts',
    description: 'Testing performance and load handling',
    timeout: 180000,
  },
]

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  coverage?: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  console.log(chalk.blue(`\n🧪 Running ${suite.name}...`))
  console.log(chalk.gray(`   ${suite.description}`))

  const startTime = performance.now()

  try {
    const command = `npx vitest run ${suite.pattern} --reporter=verbose --timeout=${suite.timeout || 30000}`

    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: suite.timeout || 30000,
    })

    const endTime = performance.now()
    const duration = endTime - startTime

    // Parse coverage information if available
    let coverage
    const coverageMatch = output.match(/Lines\s+:\s+([\d.]+)%.*Functions\s+:\s+([\d.]+)%.*Branches\s+:\s+([\d.]+)%.*Statements\s+:\s+([\d.]+)%/s)
    if (coverageMatch) {
      coverage = {
        lines: Number.parseFloat(coverageMatch[1]),
        functions: Number.parseFloat(coverageMatch[2]),
        branches: Number.parseFloat(coverageMatch[3]),
        statements: Number.parseFloat(coverageMatch[4]),
      }
    }

    console.log(chalk.green(`   ✅ ${suite.name} passed in ${Math.round(duration)}ms`))

    return {
      name: suite.name,
      passed: true,
      duration,
      coverage,
    }
  }
  catch (error: any) {
    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(chalk.red(`   ❌ ${suite.name} failed in ${Math.round(duration)}ms`))
    console.log(chalk.red(`   Error: ${error.message}`))

    return {
      name: suite.name,
      passed: false,
      duration,
      error: error.message,
    }
  }
}

async function runCoverageReport(): Promise<void> {
  console.log(chalk.blue('\n📊 Generating coverage report...'))

  try {
    execSync('npx vitest run --coverage', {
      encoding: 'utf8',
      stdio: 'inherit',
    })

    console.log(chalk.green('   ✅ Coverage report generated'))
    console.log(chalk.gray('   Check ./coverage/index.html for detailed report'))
  }
  catch (error: any) {
    console.log(chalk.red(`   ❌ Coverage report failed: ${error.message}`))
  }
}

async function runLinting(): Promise<boolean> {
  console.log(chalk.blue('\n🔍 Running linting checks...'))

  try {
    execSync('npx eslint . --ext .ts,.vue --max-warnings 0', {
      encoding: 'utf8',
      stdio: 'pipe',
    })

    console.log(chalk.green('   ✅ Linting passed'))
    return true
  }
  catch (error: any) {
    console.log(chalk.red('   ❌ Linting failed'))
    console.log(chalk.red(`   ${error.message}`))
    return false
  }
}

async function runTypeChecking(): Promise<boolean> {
  console.log(chalk.blue('\n🔧 Running type checking...'))

  try {
    execSync('npx tsc --noEmit', {
      encoding: 'utf8',
      stdio: 'pipe',
    })

    console.log(chalk.green('   ✅ Type checking passed'))
    return true
  }
  catch (error: any) {
    console.log(chalk.red('   ❌ Type checking failed'))
    console.log(chalk.red(`   ${error.message}`))
    return false
  }
}

function printSummary(results: TestResult[], lintPassed: boolean, typePassed: boolean): void {
  console.log(chalk.blue('\n📋 Test Summary'))
  console.log(chalk.blue('================'))

  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\n📊 Results:`)
  console.log(`   Total Suites: ${totalTests}`)
  console.log(`   ${chalk.green(`Passed: ${passedTests}`)}`)
  console.log(`   ${failedTests > 0 ? chalk.red(`Failed: ${failedTests}`) : 'Failed: 0'}`)
  console.log(`   Total Duration: ${Math.round(totalDuration)}ms`)

  console.log(`\n🔍 Code Quality:`)
  console.log(`   ${lintPassed ? chalk.green('Linting: ✅') : chalk.red('Linting: ❌')}`)
  console.log(`   ${typePassed ? chalk.green('Type Checking: ✅') : chalk.red('Type Checking: ❌')}`)

  // Coverage summary
  const coverageResults = results.filter(r => r.coverage)
  if (coverageResults.length > 0) {
    const avgCoverage = coverageResults.reduce((acc, r) => ({
      lines: acc.lines + (r.coverage?.lines || 0),
      functions: acc.functions + (r.coverage?.functions || 0),
      branches: acc.branches + (r.coverage?.branches || 0),
      statements: acc.statements + (r.coverage?.statements || 0),
    }), { lines: 0, functions: 0, branches: 0, statements: 0 })

    const count = coverageResults.length
    console.log(`\n📈 Average Coverage:`)
    console.log(`   Lines: ${Math.round(avgCoverage.lines / count)}%`)
    console.log(`   Functions: ${Math.round(avgCoverage.functions / count)}%`)
    console.log(`   Branches: ${Math.round(avgCoverage.branches / count)}%`)
    console.log(`   Statements: ${Math.round(avgCoverage.statements / count)}%`)
  }

  // Failed tests details
  const failedResults = results.filter(r => !r.passed)
  if (failedResults.length > 0) {
    console.log(chalk.red('\n❌ Failed Tests:'))
    failedResults.forEach((result) => {
      console.log(chalk.red(`   ${result.name}: ${result.error}`))
    })
  }

  // Overall status
  const allPassed = passedTests === totalTests && lintPassed && typePassed
  console.log(`\n${allPassed ? chalk.green('🎉 All tests passed!') : chalk.red('❌ Some tests failed')}`)

  if (!allPassed) {
    process.exit(1)
  }
}

async function main(): Promise<void> {
  console.log(chalk.blue('🚀 Running Comprehensive Test Suite'))
  console.log(chalk.blue('===================================='))

  const startTime = performance.now()

  // Run code quality checks first
  const lintPassed = await runLinting()
  const typePassed = await runTypeChecking()

  // Run test suites
  const results: TestResult[] = []

  for (const suite of testSuites) {
    const result = await runTestSuite(suite)
    results.push(result)

    // Stop on first failure if in CI mode
    if (!result.passed && process.env.CI) {
      console.log(chalk.red('\n🛑 Stopping on first failure (CI mode)'))
      break
    }
  }

  // Generate coverage report
  if (results.some(r => r.passed)) {
    await runCoverageReport()
  }

  const endTime = performance.now()
  const totalDuration = endTime - startTime

  console.log(chalk.blue(`\n⏱️  Total execution time: ${Math.round(totalDuration)}ms`))

  // Print summary
  printSummary(results, lintPassed, typePassed)
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 Uncaught Exception:'), error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n💥 Unhandled Rejection:'), reason)
  process.exit(1)
})

// Run the test suite
main().catch((error) => {
  console.error(chalk.red('\n💥 Test runner failed:'), error)
  process.exit(1)
})
