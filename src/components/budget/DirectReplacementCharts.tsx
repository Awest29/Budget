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

// Currency formatter
const currencyFormatter = (value: number) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// Modern, professional colors
const COLORS = {
  alex: '#4285F4', // Google Blue
  madde: '#34A853', // Google Green
  retail: '#4285F4',
  food: '#34A853',
  medical: '#FBBC05', // Google Yellow
  travel: '#EA4335',  // Google Red
  other: '#9AA0A6'    // Google Grey
};

// Pie chart colors
const PIE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#5F6368', '#9AA0A6'];

export function DirectReplacementCharts({ categories, transactions, selectedMonth }: ChartProps) {
  // Check if there's any data
  if (!categories || categories.length === 0) {
    return (
      <div 
        style={{
          padding: '24px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}
      >
        <h3 style={{ color: '#334155', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          No data available for {selectedMonth}
        </h3>
        <p style={{ color: '#64748b' }}>Please select a different month or ensure data is loaded.</p>
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
    .sort((a, b) => (b.Alex + b.Madde) - (a.Alex + a.Madde))
    .slice(0, 7); // Limit to top 7 for better visualization

  // Only render if we have data
  if (variableExpensesData.length === 0) {
    return (
      <div 
        style={{
          padding: '24px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}
      >
        <h3 style={{ color: '#334155', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          No variable expenses for {selectedMonth}
        </h3>
        <p style={{ color: '#64748b' }}>No variable expenses recorded for this period.</p>
      </div>
    );
  }

  // Prepare data for Top Spending Categories Pie Chart
  const pieChartData = categories
    .filter(cat => cat.type === 'variable')
    .map(category => ({
      name: category.name,
      value: Math.abs(category.totalAlex + category.totalMadde),
    }))
    .sort((a, b) => b.value - a.value);
  
  // Combine smaller categories
  const topCategories = pieChartData.slice(0, 4);
  const otherCategories = pieChartData.slice(4);
  
  const combinedPieData = [
    ...topCategories,
    ...(otherCategories.length > 0 ? [{
      name: 'Other',
      value: otherCategories.reduce((sum, cat) => sum + cat.value, 0)
    }] : [])
  ];

  // KPI data calculations
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

  // Chart container style
  const chartContainerStyle = {
    backgroundColor: 'white', 
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0',
    marginBottom: '24px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  // Chart header style
  const chartHeaderStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: 'white'
  };

  // Chart title style
  const chartTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#334155',
    margin: 0
  };

  // Chart content style
  const chartContentStyle = {
    padding: '20px',
    backgroundColor: 'white'
  };

  // Chart wrapper style
  const chartWrapperStyle = {
    height: '360px',
    backgroundColor: 'white'
  };

  // KPI card style
  const kpiCardStyle = {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0'
  };

  // KPI title style
  const kpiTitleStyle = {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px',
    fontWeight: 500
  };

  // KPI value style
  const kpiValueStyle = {
    fontSize: '20px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '4px'
  };

  // KPI subvalue style
  const kpiSubvalueStyle = {
    fontSize: '13px',
    color: '#94a3b8'
  };

  // Legend style
  const legendStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '16px'
  };

  // Legend item style
  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#64748b'
  };

  // Legend color style
  const legendColorStyle = (color: string) => ({
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    backgroundColor: color,
    marginRight: '6px'
  });

  // Custom Legend component
  const CustomLegend = ({ payload }: { payload: any[] }) => (
    <div style={legendStyle}>
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} style={legendItemStyle}>
          <div style={legendColorStyle(entry.color)}></div>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );

  // KPI Card component
  const KpiCard = ({ title, value, subValue }: { title: string, value: string, subValue?: string }) => (
    <div style={kpiCardStyle}>
      <div style={kpiTitleStyle}>{title}</div>
      <div style={kpiValueStyle}>{value}</div>
      {subValue && <div style={kpiSubvalueStyle}>{subValue}</div>}
    </div>
  );

  // Custom tooltip component for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          padding: '12px',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: '#334155' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: entry.color,
                marginRight: '8px'
              }}></div>
              <span style={{ color: '#334155' }}>
                {entry.name}: {currencyFormatter(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          padding: '12px',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
            {payload[0].name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: payload[0].color,
              marginRight: '8px'
            }}></div>
            <span style={{ color: '#334155' }}>
              Amount: {currencyFormatter(payload[0].value)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: payload[0].color,
              marginRight: '8px'
            }}></div>
            <span style={{ color: '#334155' }}>
              Percentage: {(payload[0].percent * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate percentages for the spending distribution KPI
  const alexPercentage = (alexTotal + maddeTotal) > 0 
    ? ((alexTotal / (alexTotal + maddeTotal)) * 100).toFixed(1) 
    : '0';
    
  const maddePercentage = (alexTotal + maddeTotal) > 0 
    ? ((maddeTotal / (alexTotal + maddeTotal)) * 100).toFixed(1) 
    : '0';

  return (
    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
      {/* Variable Expenses Comparison */}
      <div style={chartContainerStyle}>
        <div style={chartHeaderStyle}>
          <h3 style={chartTitleStyle}>Variable Expenses Comparison - {selectedMonth}</h3>
        </div>
        <div style={chartContentStyle}>
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={variableExpensesData}
                margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#334155', fontSize: 12 }}
                  tickLine={{ stroke: '#e2e8f0' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#334155', fontSize: 12 }}
                  tickLine={{ stroke: '#e2e8f0' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={currencyFormatter}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend content={(props) => <CustomLegend payload={props.payload} />} />
                <Bar 
                  dataKey="Alex" 
                  fill={COLORS.alex} 
                  radius={[4, 4, 0, 0]}
                  name="Alex" 
                />
                <Bar 
                  dataKey="Madde" 
                  fill={COLORS.madde} 
                  radius={[4, 4, 0, 0]}
                  name="Madde" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Spending Categories */}
      <div style={chartContainerStyle}>
        <div style={chartHeaderStyle}>
          <h3 style={chartTitleStyle}>Top Variable Expense Categories</h3>
        </div>
        <div style={chartContentStyle}>
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={combinedPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {combinedPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                  <Label
                    value={`${currencyFormatter(combinedPieData.reduce((sum, entry) => sum + entry.value, 0))}`}
                    position="center"
                    fill="#334155"
                    style={{ fontSize: '20px', fontWeight: 'bold' }}
                  />
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '16px',
        backgroundColor: 'white'
      }}>
        <KpiCard
          title="Highest Expense Category"
          value={highestExpense.name}
          subValue={`${currencyFormatter(highestExpense.Alex + highestExpense.Madde)} total`}
        />

        <KpiCard
          title="Biggest Spender"
          value={biggestSpender}
          subValue={`${currencyFormatter(biggestAmount)} spent`}
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

export default DirectReplacementCharts;