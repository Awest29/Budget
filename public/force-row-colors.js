// This script forces the alternating row colors using direct DOM manipulation
window.addEventListener('DOMContentLoaded', function() {
  // Force the alternating row colors
  function forceRowColors() {
    // Get all tables on the page
    const tables = document.querySelectorAll('.budget-table');
    
    tables.forEach(table => {
      // Apply to the header row (all tables should have this)
      const headerRow = table.querySelector('thead tr');
      if (headerRow) {
        applyBackgroundToRow(headerRow, '#f2f2f7');
      }
      
      // Apply to specific category rows by class
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        if (row.classList.contains('income-row')) {
          applyBackgroundToRow(row, '#ffffff');
        } 
        else if (row.classList.contains('fixed-costs-row')) {
          applyBackgroundToRow(row, '#f2f2f7');
        }
        else if (row.classList.contains('variable-costs-row')) {
          applyBackgroundToRow(row, '#ffffff');
        }
        else if (row.classList.contains('extraordinary-costs-row')) {
          applyBackgroundToRow(row, '#f2f2f7');
        }
        else if (row.classList.contains('net-income-row')) {
          applyBackgroundToRow(row, '#dcfce7');
          
          // Add border to net income row
          const cells = row.querySelectorAll('td');
          cells.forEach(cell => {
            cell.style.borderTop = '2px solid #0f766e';
          });
        }
      });
    });
  }
  
  // Apply hover effects
  function applyHoverEffects() {
    // Add a style element to override any hover styles
    const styleElement = document.createElement('style');
    styleElement.id = 'hover-styles';
    styleElement.textContent = `
      /* Disable default hover effects */
      .budget-table tr:hover,
      .budget-table tr:hover td,
      .budget-table tbody tr:hover td {
        background-color: inherit !important;
      }
      
      /* Apply specific hover effects for each row type */
      .budget-table tr.income-row:hover td {
        background-color: #f8f8f8 !important;
      }
      
      .budget-table tr.fixed-costs-row:hover td {
        background-color: #e9eef5 !important;
      }
      
      .budget-table tr.variable-costs-row:hover td {
        background-color: #f8f8f8 !important;
      }
      
      .budget-table tr.extraordinary-costs-row:hover td {
        background-color: #e9eef5 !important;
      }
      
      .budget-table tr.net-income-row:hover td {
        background-color: #c7f9d9 !important;
      }
    `;
    
    // Remove any existing override style first
    const existingStyle = document.getElementById('hover-styles');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
    
    // Add the new style
    document.head.appendChild(styleElement);
  }
  
  // Helper function to apply background to a row and all its cells
  function applyBackgroundToRow(row, color) {
    // Apply to the row itself
    row.style.backgroundColor = color;
    
    // Apply to all cells in the row
    const cells = row.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.style.backgroundColor = color;
    });
  }
  
  // Run immediately and periodically to ensure styles are applied
  forceRowColors();
  applyHoverEffects();
  
  // Run every 500ms to ensure it overrides any other styles
  setInterval(forceRowColors, 500);
  setInterval(applyHoverEffects, 500);
});
