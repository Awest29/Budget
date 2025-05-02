import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartProps {
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string;
}

// Add missing interfaces
interface SubHeader {
    id: string;
    name: string;
    Alex: number;
    Madde: number;
    transactions?: Transaction[];
  }
  
  interface Category {
    id: string;
    name: string;
    type: 'income' | 'fixed' | 'variable' | 'extraordinary';
    subHeaders: SubHeader[];
    totalAlex: number;
    totalMadde: number;
  }
  
  interface Transaction {
    id: string;
    transaction_date: string;
    description: string;
    amount: number;
    category_id: string | null;
    sub_header_id: string | null;
    account_type: string;
    owner: string;
  }
  
  interface ChartProps {
    categories: Category[];
    transactions: Transaction[];
    selectedMonth: string;
  }

  export function BudgetCharts({ categories, transactions, selectedMonth }: ChartProps) {
    // Check if there's any data
    if (!categories || categories.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No data available for {selectedMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please select a different month or ensure data is loaded.</p>
          </CardContent>
        </Card>
      );
    }
  
    // Prepare data for Variable Expenses Comparison
    const variableExpensesData = categories
      .filter(cat => cat.type === 'variable' && (cat.totalAlex !== 0 || cat.totalMadde !== 0))
      .map(category => ({
        name: category.name,
        Alex: Math.abs(category.totalAlex),
        Madde: Math.abs(category.totalMadde),
      }));
  
    // Only render if we have data
    if (variableExpensesData.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No variable expenses for {selectedMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No variable expenses recorded for this period.</p>
          </CardContent>
        </Card>
      );
    }
  
    // Rest of your chart code...

  // Prepare data for Top Spending Categories Pie Chart
  const totalSpendingByCategory = categories
    .filter(cat => cat.type === 'variable')
    .map(category => ({
      name: category.name,
      value: Math.abs(category.totalAlex + category.totalMadde),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Fix type errors in formatters and labels
const renderCustomLabel = ({ name, percent }: { name: string; percent: number }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };
  
  const customTooltipFormatter = (value: number) => value.toLocaleString('en-US');

  return (
    <div className="space-y-8">
      {/* Variable Expenses Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Variable Expenses Comparison - {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={variableExpensesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('en-US')} />
                <Legend />
                <Bar dataKey="Alex" fill="#0088FE" name="Alex" />
                <Bar dataKey="Madde" fill="#00C49F" name="Madde" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Variable Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalSpendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {totalSpendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString('en-US')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Highest Variable Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variableExpensesData.length > 0 ? 
                variableExpensesData.reduce((max, cat) => 
                  (cat.Alex + cat.Madde) > (max.Alex + max.Madde) ? cat : max
                ).name : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Biggest Spender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variableExpensesData.reduce((sum, cat) => sum + cat.Alex, 0) >
               variableExpensesData.reduce((sum, cat) => sum + cat.Madde, 0) 
                ? 'Alex' : 'Madde'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Most Active Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories
                .filter(cat => cat.type === 'variable')
                .reduce((max, cat) => 
                  (cat.subHeaders.reduce((sum, sub) => sum + (sub.transactions?.length || 0), 0) >
                   max.subHeaders.reduce((sum, sub) => sum + (sub.transactions?.length || 0), 0)) 
                    ? cat : max
                ).name}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}