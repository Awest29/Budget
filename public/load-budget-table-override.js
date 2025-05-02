// Script to load the budget table override CSS
(function() {
  // Create a link element for the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = '/budget-table-override.css';
  link.id = 'budget-table-override-css';
  
  // Add it to the end of the head to ensure it loads after other CSS
  document.head.appendChild(link);
  
  // Function to apply direct styles to fix specific issues
  function applyDirectStyles() {
    // Wait for the table to be rendered
    const table = document.querySelector('.budget-summary-table');
    if (!table) {
      // If table is not found, try again in 100ms
      setTimeout(applyDirectStyles, 100);
      return;
    }
    
    // Apply styles to the Net Income row
    const netIncomeRow = table.querySelector('tr.net-income-row');
    if (netIncomeRow) {
      const cells = netIncomeRow.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.backgroundColor = '#dcfce7';
      });
    }
    
    // Apply styles to the first column to ensure it stays fixed and has consistent width
    const stickyColumnCells = table.querySelectorAll('th:first-child, td:first-child');
    stickyColumnCells.forEach(cell => {
      cell.style.position = 'sticky';
      cell.style.left = '0';
      cell.style.zIndex = '20';
      cell.style.boxShadow = '2px 0 5px rgba(0, 0, 0, 0.1)';
      cell.style.minWidth = '220px';
      cell.style.width = '220px';
      cell.style.maxWidth = '220px';
    });
    
    // Apply styles to the Extraordinary Costs cell to ensure it has the same width as other cells
    const extraordinaryCostsCell = table.querySelector('tr.extraordinary-costs-row td:first-child');
    if (extraordinaryCostsCell) {
      extraordinaryCostsCell.style.minWidth = '220px';
      extraordinaryCostsCell.style.width = '220px';
      extraordinaryCostsCell.style.maxWidth = '220px';
    }
    
    // Apply background colors to category type cells
    const incomeRows = table.querySelectorAll('tr.income-row, tr.category-row.income-row');
    incomeRows.forEach(row => {
      // Apply white background to all cells in income rows
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.backgroundColor = '#FFFFFF';
      });
      
      // Ensure the first cell has white background
      const firstCell = row.querySelector('td:first-child');
      if (firstCell) {
        firstCell.style.backgroundColor = '#FFFFFF';
      }
      
      // Ensure the total cell has white background
      const totalCell = row.querySelector('td.total-cell');
      if (totalCell) {
        totalCell.style.backgroundColor = '#FFFFFF';
      }
    });
    
    const fixedCostsRows = table.querySelectorAll('tr.fixed-costs-row, tr.category-row.fixed-costs-row');
    fixedCostsRows.forEach(row => {
      // Apply blue background to all cells in fixed costs rows
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.backgroundColor = '#f2f2f7';
      });
      
      // Ensure the first cell has blue background
      const firstCell = row.querySelector('td:first-child');
      if (firstCell) {
        firstCell.style.backgroundColor = '#f2f2f7';
      }
      
      // Ensure the total cell has blue background
      const totalCell = row.querySelector('td.total-cell');
      if (totalCell) {
        totalCell.style.backgroundColor = '#f2f2f7';
      }
    });
    
    const variableCostsRows = table.querySelectorAll('tr.variable-costs-row, tr.category-row.variable-costs-row');
    variableCostsRows.forEach(row => {
      // Apply white background to all cells in variable costs rows
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.backgroundColor = '#FFFFFF';
      });
      
      // Ensure the first cell has white background
      const firstCell = row.querySelector('td:first-child');
      if (firstCell) {
        firstCell.style.backgroundColor = '#FFFFFF';
      }
      
      // Ensure the total cell has white background
      const totalCell = row.querySelector('td.total-cell');
      if (totalCell) {
        totalCell.style.backgroundColor = '#FFFFFF';
      }
    });
    
    const extraordinaryCostsRows = table.querySelectorAll('tr.extraordinary-costs-row, tr.category-row.extraordinary-costs-row');
    extraordinaryCostsRows.forEach(row => {
      // Apply blue background to all cells in extraordinary costs rows
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.backgroundColor = '#f2f2f7';
      });
      
      // Ensure the first cell has blue background
      const firstCell = row.querySelector('td:first-child');
      if (firstCell) {
        firstCell.style.backgroundColor = '#f2f2f7';
      }
      
      // Ensure the total cell has blue background
      const totalCell = row.querySelector('td.total-cell');
      if (totalCell) {
        totalCell.style.backgroundColor = '#f2f2f7';
      }
    });
    
    
    // Ensure the Category Type header has a blue background
    const categoryTypeHeader = table.querySelector('th:first-child');
    if (categoryTypeHeader) {
      categoryTypeHeader.style.backgroundColor = '#f2f2f7';
    }
  }
  
  // Apply direct styles when the DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDirectStyles);
  } else {
    applyDirectStyles();
  }
  
  // Also apply styles when the window is resized
  window.addEventListener('resize', applyDirectStyles);
})();
