import React from 'react';
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
  Cell,
  LabelList
} from 'recharts';

// Custom container styling to force white background
const ChartContainer = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div style={{ 
    backgroundColor: 'white', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px',
    marginBottom: '20px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ 
      padding: '16px 20px', 
      borderBottom: '1px solid #f1f5f9', 
      backgroundColor: 'white'
    }}>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: 600, 
        margin: 0, 
        color: '#334155'
      }}>
        {title}
      </h3>
    </div>
    <div style={{ 
      padding: '16px', 
      backgroundColor: 'white'
    }}>
      {children}
    </div>
  </div>
);

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

// Custom formatter for currency values
const currencyFormatter = (value: number) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// Custom Tooltip component for better formatting
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={`item-${index}`} style={{ 
            color: item.color,
            margin: '2px 0'
          }}>
            {item.name}: {currencyFormatter(item.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Pie Chart
const PieCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ 
          marginBottom: '5px', 
          fontWeight: 'bold',
          color: payload[0].payload.fill || payload[0].color
        }}>
          {payload[0].name}
        </p>
        <p style={{ margin: '2px 0' }}>
          Amount: {currencyFormatter(payload[0].value)}
        </p>
        <p style={{ margin: '2px 0' }}>
          Percentage: {(payload[0].percent * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function WhiteBackgroundCharts({ categories, transactions, selectedMonth }: ChartProps) {
  // Check if there's any data
  if (!categories || categories.length === 0) {
    return (
      <ChartContainer title="No Data Available">
        <p style={{ color: '#334155' }}>Please select a different month or ensure data is loaded.</p>
      </ChartContainer>
    );
  }

  // Prepare data for Variable Expenses Comparison
  const variableExpensesData = categories
    .filter(cat => cat.type === 'variable' && (cat.totalAlex !== 0 || cat.totalMadde !== 0))
    .map(category => ({
      name: category.name,
      Alex: Math.abs(category.totalAlex),
      Madde: Math.abs(category.totalMadde),
    }))
    .sort((a, b) => (b.Alex + b.Madde) - (a.Alex + a.Madde)); // Sort by total amount descending

  // Only render if we have data
  if (variableExpensesData.length === 0) {
    return (
      <ChartContainer title={`No variable expenses for ${selectedMonth}`}>
        <p style={{ color: '#334155' }}>No variable expenses recorded for this period.</p>
      </ChartContainer>
    );
  }

  // Prepare data for Top Spending Categories Pie Chart
  const totalSpendingByCategory = categories
    .filter(cat => cat.type === 'variable')
    .map(category => ({
      name: category.name,
      value: Math.abs(category.totalAlex + category.totalMadde),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Enhanced colors for better visual appeal
  const COLORS = ['#4299E1', '#38B2AC', '#F6AD55', '#F56565', '#9F7AEA'];
  
  // Custom label for pie chart that only shows for larger segments
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
    
    // Only render label if it's a significant segment (more than 10%)
    if (percent < 0.1) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '16px' }}>
      {/* Variable Expenses Comparison */}
      <ChartContainer title={`Variable Expenses Comparison - ${selectedMonth}`}>
        <div style={{ height: '360px', backgroundColor: 'white' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={variableExpensesData}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickLine={{ stroke: '#CBD5E1' }}
                axisLine={{ stroke: '#CBD5E1' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickLine={{ stroke: '#CBD5E1' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickFormatter={currencyFormatter}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 10,
                  fontSize: 12,
                  color: '#64748B'
                }}
              />
              <Bar 
                dataKey="Alex" 
                fill="#4299E1" 
                radius={[4, 4, 0, 0]}
                name="Alex" 
              />
              <Bar 
                dataKey="Madde" 
                fill="#38B2AC" 
                radius={[4, 4, 0, 0]}
                name="Madde" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Top Spending Categories */}
      <ChartContainer title="Top Variable Expense Categories">
        <div style={{ height: '360px', backgroundColor: 'white' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totalSpendingByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={150}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {totalSpendingByCategory.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieCustomTooltip />} />
              <Legend 
                formatter={(value, entry, index) => {
                  return <span style={{ color: '#64748B', fontSize: 12 }}>{value}</span>;
                }}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{
                  paddingLeft: 20,
                  fontSize: 12
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* KPI Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        backgroundColor: 'white'
      }}>
        {/* Highest Variable Expense */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          padding: '16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
            Highest Variable Expense
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>
            {variableExpensesData.length > 0 ? 
              variableExpensesData.reduce((max, cat) => 
                (cat.Alex + cat.Madde) > (max.Alex + max.Madde) ? cat : max
              ).name : 'N/A'}
          </div>
          {variableExpensesData.length > 0 && (
            <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
              {currencyFormatter(variableExpensesData[0].Alex + variableExpensesData[0].Madde)} total
            </div>
          )}
        </div>

        {/* Biggest Spender */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          padding: '16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
            Biggest Spender
          </h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>
            {variableExpensesData.reduce((sum, cat) => sum + cat.Alex, 0) >
             variableExpensesData.reduce((sum, cat) => sum + cat.Madde, 0) 
              ? 'Alex' : 'Madde'}
          </div>
          <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
            {currencyFormatter(Math.max(
              variableExpensesData.reduce((sum, cat) => sum + cat.Alex, 0),
              variableExpensesData.reduce((sum, cat) => sum + cat.Madde, 0)
            ))} spent
          </div>
        </div>

        {/* Most Active Category */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          padding: '16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
            Most Active Category
          </h4>
          {categories.filter(cat => cat.type === 'variable').length > 0 ? (
            <>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>
                {categories
                  .filter(cat => cat.type === 'variable')
                  .reduce((max, cat) => 
                    (cat.subHeaders.reduce((sum, sub) => sum + (sub.transactions?.length || 0), 0) >
                    max.subHeaders.reduce((sum, sub) => sum + (sub.transactions?.length || 0), 0)) 
                      ? cat : max
                  ).name}
              </div>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
                {categories
                  .filter(cat => cat.type === 'variable')
                  .reduce((max, cat) => {
                    const txCount = cat.subHeaders.reduce((sum, sub) => sum + (sub.transactions?.length || 0), 0);
                    return txCount > max ? txCount : max;
                  }, 0)} transactions
              </div>
            </>
          ) : (
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>N/A</div>
          )}
        </div>
      </div>
    </div>
  );
}