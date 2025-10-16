# Dashboard Feature

This feature provides the main financial dashboard with comprehensive overview and visualization components.

## Components

### Main Dashboard Components

- **FinancialOverview.vue** - Key financial metrics and health score
  - Net worth, cash flow, debt, and savings overview
  - Financial health score with color-coded indicators
  - Monthly summary (income, expenses, net income)

- **ExpenseBreakdownChart.vue** - Expense category visualization
  - Category-wise expense breakdown with percentages
  - Visual bar chart representation
  - Summary statistics

- **SavingsProgressChart.vue** - Savings goals progress tracking
  - Overall savings progress visualization
  - Individual goal progress bars
  - Monthly contributions summary

- **RecentActivity.vue** - Recent transaction display
  - Last 5 transactions with icons and amounts
  - Transaction type indicators (income/expense)
  - Quick link to full transaction history

- **InsightsPanel.vue** - AI-powered financial insights
  - Automated insights based on financial patterns
  - Priority-based recommendations
  - Color-coded alerts and suggestions

- **MonthlyTrendsChart.vue** - Historical trend visualization
  - 6-month income/expense trends
  - Visual bar chart with averages
  - Month-over-month comparison

## Features

- ✅ Real-time financial data aggregation
- ✅ Interactive visualizations and charts
- ✅ Financial health scoring (0-100 scale)
- ✅ Automated insights and recommendations
- ✅ Responsive design for all screen sizes
- ✅ Nigerian Naira (₦) currency formatting
- ✅ Quick action buttons for navigation
- ✅ Loading states and error handling

## Data Integration

The dashboard integrates data from:
- **Transactions** - Income and expense tracking
- **Budgets** - Budget utilization and alerts
- **Loans** - Debt tracking and payments
- **Savings Goals** - Goal progress and contributions

## Financial Health Score

Automated scoring based on:
- **Cash Flow** (25 points) - Positive monthly cash flow
- **Budget Adherence** (25 points) - Staying within budget limits
- **Savings Progress** (25 points) - Progress toward savings goals
- **Debt Management** (25 points) - Healthy debt-to-savings ratio

## Usage

```vue
<template>
  <!-- Main dashboard page -->
  <NuxtPage />
</template>
```

The dashboard automatically loads when users navigate to `/dashboard` and provides a comprehensive overview of their financial health and activity.

## Insights Engine

The dashboard includes an intelligent insights engine that provides:
- **Cash flow warnings** for negative trends
- **Budget alerts** for overspending
- **Savings recommendations** for goal achievement
- **Debt management** suggestions
- **Positive reinforcement** for good financial habits

All insights are prioritized (high/medium/low) and color-coded for easy understanding.
