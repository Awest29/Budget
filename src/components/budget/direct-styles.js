// Direct styling script to be executed when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Apply the alternating row colors directly
  function applyRowColors() {
    // Get the budget-table
    const budgetTable = document.querySelector('.budget-table');
    if (!budgetTable) return;
    
    // Get all the main category rows
    const headerRow = budgetTable.querySelector('thead tr');
    const incomeRow = budgetTable.querySelector('tr.income-row');
    const fixedCostsRow = budgetTable.querySelector('tr.fixed-costs-row');
    const variableCostsRow = budgetTable.querySelector('tr.variable-costs-row');
    const extraordinaryCostsRow = budgetTable.querySelector('tr.extraordinary-costs-row');
    const netIncomeRow = budgetTable.querySelector('tr.net-income-row');
    
    // Apply the light blue background (#e6efff) to header, fixed costs, and extraordinary costs
    if (headerRow) setBackgroundColor(headerRow, '#e6efff');
    if (fixedCostsRow) setBackgroundColor(fixedCostsRow, '#e6efff');
    if (extraordinaryCostsRow) setBackgroundColor(extraordinaryCostsRow, '#e6efff');
    
    // Apply white background to income, variable costs, and net income
    if (incomeRow) setBackgroundColor(incomeRow, '#ffffff');
    if (variableCostsRow) setBackgroundColor(variableCostsRow, '#ffffff');
    if (netIncomeRow) setBackgroundColor(netIncomeRow, '#ffffff');
    
    // Ensure all other rows have transparent background
    const allRows = budgetTable.querySelectorAll('tr:not(.income-row):not(.fixed-costs-row):not(.variable-costs-row):not(.extraordinary-costs-row):not(.net-income-row)');
    allRows.forEach(row => {
      if (row !== headerRow) {
        setBackgroundColor(row, 'transparent');
      }
    });
    
    // Apply the proper border to net income row
    if (netIncomeRow) {
      const cells = netIncomeRow.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.borderTop = '2px solid #94a3b8';
      });
    }
  }
  
  function setBackgroundColor(row, color) {
    row.style.backgroundColor = color;
    
    // Also set background color for all cells in the row
    const cells = row.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.style.backgroundColor = color;
    });
  }
  
  // Apply row colors on load and periodically
  applyRowColors();
  setInterval(applyRowColors, 500); // Apply every 500ms to ensure it works
});
