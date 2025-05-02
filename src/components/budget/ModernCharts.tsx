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
  Label
} from 'recharts';
import './modern-charts.css';

// Types
interface ChartProps {
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string;
}

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

// Modern, beautiful colors inspired by Google Material Design
const COLORS = {
  alex: '#4285F4', // Google Blue
  madde: '#34A853', // Google Green
  retail: '#4285F4', // Google Blue
  food: '#34A853',  // Google Green
  medical: '#FBBC05', // Google Yellow
  travel: '#EA4335',  // Google Red
  entertainment: '#5F6368', // Google Grey
  other: '#9AA0A6'  // Google Light Grey
};

// Additional pie chart colors
const PIE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#5F6368', '#9AA0A6', '#80868B', '#BDC1C6'];

// Custom formatter for currency values
const currencyFormatter = (value: number) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// Custom Tooltip component for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div className="tooltip-value" key={`value-${index}`}>
            <div 
              className="tooltip-color" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span>{entry.name}: {currencyFormatter(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{payload[0].name}</p>
        <div className="tooltip-value">
          <div 
            className="tooltip-color" 
            style={{ backgroundColor: payload[0].payload.fill }}
          ></div>
          <span>Amount: {currencyFormatter(payload[0].value)}</span>
        </div>
        <div className="tooltip-value">
          <div className="tooltip-color" style={{ backgroundColor: payload[0].payload.fill }}></div>
          <span>Percentage: {(payload[0].percent * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Legend Component
const CustomLegend = ({ payload, colors }: { payload: any[], colors: Record<string, string> }) => {
  return (
    <div className="custom-legend">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="legend-item">
          <div 
            className="legend-color" 
            style={{ backgroundColor: colors[entry.value.toLowerCase()] || colors.other }}
          ></div>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// KPI Card Component
interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
}

const KpiCard = ({ title, value, subValue }: KpiCardProps) => (
  <div className="kpi-card">
    <h3 className="kpi-title">{title}</h3>
    <div className="kpi-value">{value}</div>
    {subValue && <div className="kpi-subvalue">{subValue}</div>}
  </div>
);

export function ModernCharts({ categories, transactions, selectedMonth }: ChartProps) {
  // Check if there's any data
  if (!categories || categories.length === 0) {
    return (
      <div className="modern-charts">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">No data available for {selectedMonth}</h3>
          </div>
          <div className="chart-content">
            <p>Please select a different month or ensure data is loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for Variable Expenses Comparison
  const variableExpensesData = categories
    .filter(cat => cat.type === 'variable' && (Math.abs(cat.totalAlex) > 0 || Math.abs(cat.totalMadde) > 0))
    .map(category => ({
      name: category.name,
      Alex: Math.abs(category.totalAlex),
      Madde: Math.abs(category.totalMadde),
    }))
    .sort((a, b) => (b.Alex + b.Madde) - (a.Alex + a.Madde)) // Sort by total amount descending
    .slice(0, 7); // Limit to top 7 for better visualization

  // Only render if we have data
  if (variableExpensesData.length === 0) {
    return (
      <div className="modern-charts">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">No variable expenses for {selectedMonth}</h3>
          </div>
          <div className="chart-content">
            <p>No variable expenses recorded for this period.</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for Expense Category Distribution (Pie Chart)
  const pieChartData = categories
    .filter(cat => cat.type === 'variable')
    .map(category => ({
      name: category.name,
      value: Math.abs(category.totalAlex + category.totalMadde),
    }))
    .sort((a, b) => b.value - a.value);
    
  // Combine small categories into "Other"
  const topCategories = pieChartData.slice(0, 4);
  const otherCategories = pieChartData.slice(4);
  
  const combinedPieData = [
    ...topCategories,
    ...(otherCategories.length > 0 ? [{
      name: 'Other',
      value: otherCategories.reduce((sum, cat) => sum + cat.value, 0)
    }] : [])
  ];

  // Prepare KPI calculations
  const highestExpense = variableExpensesData.length > 0 
    ? variableExpensesData[0] 
    : { name: 'N/A', Alex: 0, Madde: 0 };
    
  const alexTotal = variableExpensesData.reduce((sum, cat) => sum + cat.Alex, 0);
  const maddeTotal = variableExpensesData.reduce((sum, cat) => sum + cat.Madde, 0);
  const biggestSpender = alexTotal > maddeTotal ? 'Alex' : 'Madde';
  const biggestAmount = Math.max(alexTotal, maddeTotal);
  
  const mostActiveCategory = categories
    .filter(cat => cat.type === 'variable')
    .reduce((max, cat) => {
      const txCount = cat.subHeaders.reduce((sum, sub) => sum + (sub.transactions?.length || 0), 0);
      return txCount > max.count ? { name: cat.name, count: txCount } : max;
    }, { name: 'N/A', count: 0 });

  // Prepare expense share percentages
  const alexPercentage = (alexTotal + maddeTotal) > 0 
    ? ((alexTotal / (alexTotal + maddeTotal)) * 100).toFixed(1) 
    : '0';
    
  const maddePercentage = (alexTotal + maddeTotal) > 0 
    ? ((maddeTotal / (alexTotal + maddeTotal)) * 100).toFixed(1) 
    : '0';

  return (
    <div className="modern-charts" style={{ backgroundColor: 'white', borderRadius: '12px' }}>
      {/* Variable Expenses Comparison */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Variable Expenses Comparison - {selectedMonth}</h3>
        </div>
        <div className="chart-content">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={variableExpensesData}
                margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#333', fontSize: 12 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#333', fontSize: 12 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={currencyFormatter}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend 
                  content={(props) => <CustomLegend payload={props.payload} colors={COLORS} />}
                  verticalAlign="top"
                  height={36}
                />
                <Bar 
                  dataKey="Alex" 
                  fill={COLORS.alex} 
                  radius={[4, 4, 0, 0]}
                  name="Alex" 
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="Madde" 
                  fill={COLORS.madde} 
                  radius={[4, 4, 0, 0]}
                  name="Madde" 
                  animationDuration={1500}
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="axis-label">Expense Categories</div>
        </div>
      </div>

      {/* Expense Share by Person */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Expense Distribution by Person</h3>
        </div>
        <div className="chart-content">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Alex', value: alexTotal },
                    { name: 'Madde', value: maddeTotal }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={160}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  <Cell fill={COLORS.alex} stroke="#fff" strokeWidth={2} />
                  <Cell fill={COLORS.madde} stroke="#fff" strokeWidth={2} />
                  <Label
                    value={`${currencyFormatter(alexTotal + maddeTotal)}`}
                    position="center"
                    fill="#333"
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      fontFamily: '-apple-system, sans-serif'
                    }}
                  />
                  <Label
                    value="Total Spent"
                    position="centerTop"
                    fill="#666"
                    dy={20}
                    style={{
                      fontSize: '14px',
                      fontFamily: '-apple-system, sans-serif'
                    }}
                  />
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  content={(props) => <CustomLegend payload={props.payload} colors={COLORS} />}
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Top Expense Categories</h3>
        </div>
        <div className="chart-content">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={combinedPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={150}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {combinedPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          title="Highest Expense Category"
          value={highestExpense.name}
          subValue={`${currencyFormatter(highestExpense.Alex + highestExpense.Madde)} total`}
        />

        <KpiCard
          title="Biggest Spender"
          value={biggestSpender}
          subValue={`${currencyFormatter(biggestAmount)} (${biggestSpender === 'Alex' ? alexPercentage : maddePercentage}% of total)`}
        />

        <KpiCard
          title="Most Active Category"
          value={mostActiveCategory.name}
          subValue={`${mostActiveCategory.count} transactions`}
        />

        <KpiCard
          title="Spending Distribution"
          value={`Alex ${alexPercentage}% / Madde ${maddePercentage}%`}
          subValue={`Total: ${currencyFormatter(alexTotal + maddeTotal)}`}
        />
      </div>
    </div>
  );
}

export default ModernCharts;