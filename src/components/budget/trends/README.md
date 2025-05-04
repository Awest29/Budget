# Spending Trends Chart

## Overview

The Spending Trends Chart component visualizes actual transaction data to show spending patterns across different categories over time. This chart is used in the Budget Analysis tab to provide a visual representation of how actual spending compares to the budget.

## Implementation Details

### Data Flow

1. **Transaction Data Source**: The chart uses actual transaction data fetched from the database via the `useBudgetAnalysisTransactions` hook.
2. **Budget Data**: The budget values are shown in the separate Budget vs Actual Comparison table above the chart.
3. **Chart Data Processing**: Transactions are filtered, grouped, and processed to create a stacked area chart showing spending by category for each month.

### Key Components

- **SpendingTrendsChart**: Main component that renders the chart and handles data processing.
- **useBudgetAnalysisTransactions**: Hook that fetches transaction data for the entire year.
- **ModernBudgetComparisonPage**: Parent component that integrates the chart into the Budget Analysis tab.

## Issue Resolution

The chart previously displayed incorrect data for certain categories (e.g., showing 38,235 for Travel in March when the budget amount was 6,237). This issue was resolved by:

1. **Improved Transaction Data Handling**: Created a dedicated hook to properly fetch and manage transaction data.
2. **Clearer Visual Distinction**: Added explanatory text to clarify that the chart shows actual spending while the budget table shows planned values.
3. **Enhanced Error Handling**: Added proper loading states, error handling, and empty state messaging.
4. **Debugging Support**: Added detailed logging to track transaction processing for better troubleshooting.

## Chart Behavior

- The chart always shows data from January up to the selected month (selected in the month dropdown).
- Each month displays its own discrete spending amount (not cumulative or YTD).
- Transactions are grouped by category and subcategory for detailed visualization.
- The top filter buttons allow users to switch between different category types (Fixed, Variable, Extraordinary, Income).

## Debugging Features

The chart includes debugging features to help understand data discrepancies:

1. **Console Debugging**: The component logs detailed breakdowns of category transactions in the browser console, including subcategory totals and sample transactions.

2. **Enhanced Tooltips**: When the "Show Details" button is active, tooltips display a breakdown of subcategories with their actual transaction amounts, helping identify which subcategories contribute to the total.

3. **Budget Comparison**: The tooltip also shows the budget amount for the category, making it easy to compare with the actual transaction total.

4. **Toggle Button**: The "Show Details/Hide Details" button allows you to quickly switch between basic and detailed tooltips.

When investigating discrepancies like the Travel expense (38,235 in chart vs. 6,237 in budget table), these debugging features can help pinpoint exactly which subcategories or transactions are causing the difference.

## Notes for Developers

- The chart intentionally uses absolute values for expenses to show the magnitude of spending (all values appear as positive in the chart).
- Budget values are negative for expenses in the data model, while the chart displays them as positive for better visualization.
- If no transactions are available, the chart will display an appropriate message rather than an empty chart.
- The actual vs. budget discrepancy is a feature, not a bug - it highlights the difference between planned spending and actual behavior.
