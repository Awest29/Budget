// src/components/budget/EnhancedBudgetWarning.tsx

import React, { useState } from 'react';
import { AlertCircle, ArrowDownRight, ArrowUpRight, LineChart, TrendingDown, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface BudgetWarningProps {
  month: string;
  netIncome: {
    actual: number;
    budget: number;
    deviation?: number;
    percentage?: number;
  };
  topExpenses: Array<{
    category: string;
    actual: number;
    budget: number;
    percentage: number;
    subcategories?: Array<{
      name: string;
      actual: number;
      budget: number;
      percentage: number;
    }>;
  }>;
  historicalNetIncome?: number[];
  savingsSuggestions?: Array<{
    category: string;
    suggestion: string;
    impact: number;
  }>;
  annualImpact?: {
    currentProjection: number;
    afterSavings: number;
  };
  onBreakdownClick?: () => void;
}

export function EnhancedBudgetWarning({
  month,
  netIncome,
  topExpenses,
  historicalNetIncome = [],
  savingsSuggestions = [],
  annualImpact,
  onBreakdownClick
}: BudgetWarningProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Calculate any missing values
  if (netIncome.deviation === undefined) {
    netIncome.deviation = netIncome.actual - netIncome.budget;
  }
  
  if (netIncome.percentage === undefined && netIncome.budget !== 0) {
    netIncome.percentage = (netIncome.deviation / netIncome.budget) * 100;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
      <div className="flex items-start">
        <AlertCircle className="text-amber-500 mt-0.5 mr-3 h-5 w-5 flex-shrink-0" />
        <div className="w-full">
          <div className="flex justify-between items-start">
            <h3 className="text-amber-800 font-medium text-lg">Budget Warning</h3>
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="text-amber-700 hover:text-amber-900"
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
          
          <p className="text-amber-700 mb-2">
            {month} shows lower than expected net income. Consider reviewing variable costs for potential savings.
          </p>
          
          {/* Basic metrics row - always visible */}
          <div className="mt-3 flex flex-col sm:flex-row gap-4 text-sm">
            <div className="bg-white/50 p-3 rounded-md flex-1">
              <span className="text-gray-600">Net Income:</span> 
              <span className="font-medium ml-1 text-red-600">{netIncome.actual.toLocaleString()}</span> 
              <span className="text-gray-500 ml-1">(vs {netIncome.budget.toLocaleString()} budget)</span>
              <div className="mt-1 flex items-center text-red-600">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                <span>{Math.abs(netIncome.percentage || 0).toFixed(1)}% below budget</span>
              </div>
            </div>
            
            {topExpenses.length > 0 && (
              <div className="bg-white/50 p-3 rounded-md flex-1">
                <span className="text-gray-600">Top Expense:</span> 
                <span className="font-medium ml-1">{topExpenses[0].category}</span> 
                <span className="text-red-600 ml-1">+{topExpenses[0].percentage.toFixed(1)}%</span>
                <div className="mt-1 flex items-center text-red-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>{(topExpenses[0].actual - topExpenses[0].budget).toLocaleString()} over budget</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Interactive actions row */}
          <div className="mt-4 flex flex-wrap justify-between items-center">
            {savingsSuggestions.length > 0 && (
              <button 
                onClick={() => setShowTips(!showTips)} 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center bg-white/60 py-1 px-3 rounded-md shadow-sm hover:bg-white/80 transition-colors"
              >
                <Info className="h-4 w-4 mr-1" />
                {showTips ? "Hide Saving Tips" : "View Saving Tips"}
              </button>
            )}
            
            <button 
              onClick={onBreakdownClick} 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center bg-white/60 py-1 px-3 rounded-md shadow-sm hover:bg-white/80 transition-colors"
            >
              <LineChart className="h-4 w-4 mr-1" />
              View Expense Breakdown
            </button>
          </div>
          
          {/* Saving tips section - toggleable */}
          {showTips && savingsSuggestions.length > 0 && (
            <div className="mt-3 bg-white/40 p-3 rounded-md border border-amber-100">
              <h4 className="font-medium text-amber-800 mb-2">Recommended Savings</h4>
              <ul className="space-y-2">
                {savingsSuggestions.map((item, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">• {item.suggestion}</span>
                    <span className="font-medium text-green-600">${item.impact.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-3 pt-2 border-t border-amber-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Potential monthly impact:</span>
                  <span className="font-medium text-green-600">
                    ${savingsSuggestions.reduce((sum, item) => sum + item.impact, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Expanded detailed section */}
          {expanded && (
            <div className="mt-4 space-y-4">
              {/* Historical chart section */}
              {historicalNetIncome.length > 0 && (
                <div className="bg-white/40 p-3 rounded-md">
                  <h4 className="font-medium text-amber-800 mb-2">Net Income Trend (Last {historicalNetIncome.length} Months)</h4>
                  <div className="h-16 relative">
                    {/* Simple chart visualization */}
                    <div className="flex items-end h-full justify-between">
                      {historicalNetIncome.map((value, i) => {
                        const normalizedHeight = (value / Math.max(...historicalNetIncome)) * 100;
                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">${value}</div>
                            <div 
                              style={{height: `${normalizedHeight}%`}} 
                              className={`w-8 rounded-t-sm ${i === historicalNetIncome.length - 1 ? 'bg-red-400' : 'bg-blue-400'}`}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Top expense breakdown */}
              {topExpenses.length > 0 && topExpenses[0].subcategories && topExpenses[0].subcategories.length > 0 && (
                <div className="bg-white/40 p-3 rounded-md">
                  <h4 className="font-medium text-amber-800 mb-2">{topExpenses[0].category} Breakdown</h4>
                  <div className="space-y-2">
                    {topExpenses[0].subcategories.map((subcat, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="flex-1">{subcat.name}</div>
                        <div className="flex-1 text-right">${subcat.actual.toLocaleString()}</div>
                        <div className="flex-1 text-right text-gray-500">Budget: ${subcat.budget.toLocaleString()}</div>
                        <div className="flex-1 text-right text-red-600">+{subcat.percentage.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Annual impact projection */}
              {annualImpact && (
                <div className="bg-white/40 p-3 rounded-md">
                  <h4 className="font-medium text-amber-800 mb-2">Annual Projection</h4>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">Current annual projection:</span>
                    <span className="font-medium text-red-600">${annualImpact.currentProjection.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">After implementing savings:</span>
                    <span className="font-medium text-red-600">${annualImpact.afterSavings.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 mr-1 text-green-600" />
                      <span>Potential improvement: ${Math.abs(annualImpact.currentProjection - annualImpact.afterSavings).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedBudgetWarning;