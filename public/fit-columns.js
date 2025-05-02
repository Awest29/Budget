// This script will ensure all months are visible in the table
window.addEventListener('DOMContentLoaded', function() {
  // Force columns to fit the available space
  function makeColumnsVisible() {
    const tables = document.querySelectorAll('.budget-table');
    tables.forEach(table => {
      // Make font slightly larger but still compact
      table.style.fontSize = '0.8rem';
      
      // Make cells compact
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.style.padding = '3px 4px';
        cell.style.fontSize = '0.8rem';
        cell.style.whiteSpace = 'nowrap';
      });
      
      // Divide width evenly for month columns
      const headers = table.querySelectorAll('th');
      if (headers.length > 0) {
        // Category column
        headers[0].style.width = '15%';
        headers[0].style.minWidth = '130px';
        
        // Month columns (should be 12 months)
        for (let i = 1; i < headers.length; i++) {
          headers[i].style.width = '7%';
          headers[i].style.minWidth = '65px';
        }
      }
    });
    
    // Fix border above Net Income row
    const netIncomeRows = document.querySelectorAll('.net-income-row, .total-row');
    netIncomeRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.borderTop = '2px solid #94a3b8';
      });
    });
  }
  
  // Apply hover-only visibility to action icons
  function setupHoverIcons() {
    // First, hide all action icons by default
    const actionIcons = document.querySelectorAll('.cell-actions, .action-icon, .delete-icon');
    actionIcons.forEach(icon => {
      icon.style.opacity = '0';
      icon.style.visibility = 'hidden';
      icon.style.transition = 'opacity 0.2s ease';
    });
    
    // Then, add hover listeners to rows to show icons
    const rows = document.querySelectorAll('tr');
    rows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        const icons = row.querySelectorAll('.cell-actions, .action-icon, .delete-icon');
        icons.forEach(icon => {
          icon.style.opacity = '1';
          icon.style.visibility = 'visible';
        });
      });
      
      row.addEventListener('mouseleave', () => {
        const icons = row.querySelectorAll('.cell-actions, .action-icon, .delete-icon');
        icons.forEach(icon => {
          icon.style.opacity = '0';
          icon.style.visibility = 'hidden';
        });
      });
    });
  }
  
  // Apply alternating row colors
  function applyAlternatingColors() {
    // Header and specific rows get light blue
    const blueRows = document.querySelectorAll(
      '.budget-table thead tr, ' +
      '.budget-table .category-type-row, ' +
      '.budget-table .fixed-costs-row, ' +
      '.budget-table .extraordinary-costs-row'
    );
    
    blueRows.forEach(row => {
      row.style.backgroundColor = '#e6efff';
    });
    
    // Other rows get white background
    const whiteRows = document.querySelectorAll(
      '.budget-table .income-row, ' +
      '.budget-table .variable-costs-row, ' +
      '.budget-table .net-income-row'
    );
    
    whiteRows.forEach(row => {
      row.style.backgroundColor = 'white';
    });
    
    // Remove any default background colors
    const allRows = document.querySelectorAll('.budget-table tr');
    allRows.forEach(row => {
      if (!row.classList.contains('category-type-row') && 
          !row.classList.contains('fixed-costs-row') && 
          !row.classList.contains('extraordinary-costs-row') && 
          !row.classList.contains('income-row') && 
          !row.classList.contains('variable-costs-row') && 
          !row.classList.contains('net-income-row')) {
        row.style.backgroundColor = 'transparent';
      }
    });
  }
  
  // Run initially and after DOM updates
  makeColumnsVisible();
  setupHoverIcons();
  applyAlternatingColors();
  
  setTimeout(() => {
    makeColumnsVisible();
    setupHoverIcons();
    applyAlternatingColors();
  }, 300);
  
  setTimeout(() => {
    makeColumnsVisible();
    setupHoverIcons();
    applyAlternatingColors();
  }, 1000);
  
  // Use MutationObserver to watch for table changes
  const observer = new MutationObserver(() => {
    makeColumnsVisible();
    setupHoverIcons();
    applyAlternatingColors();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
