// This script adds styles that completely disable the dark hover effects
document.addEventListener('DOMContentLoaded', function() {
  // Create a style element
  const styleElement = document.createElement('style');
  styleElement.id = 'fix-hover-styles';
  
  // Add CSS rules to disable hover effects
  styleElement.textContent = `
    /* Completely disable hover background changes */
    .budget-table tr:hover,
    .budget-table tr:hover td,
    .budget-table tr:hover th,
    .budget-table tbody tr:hover,
    .budget-table tbody tr:hover td,
    .budget-table tr td:hover,
    .budget-table tr.fixed-costs-row:hover,
    .budget-table tr.extraordinary-costs-row:hover {
      background-color: inherit !important;
      filter: brightness(1.0) !important;
    }
    
    /* For the rows with blue backgrounds */
    tr.fixed-costs-row:hover td,
    tr.extraordinary-costs-row:hover td {
      background-color: #e9eef5 !important;
      opacity: 1.0 !important;
    }
    
    /* For the rows with white backgrounds */
    tr.income-row:hover td,
    tr.variable-costs-row:hover td {
      background-color: #f8f8f8 !important;
      opacity: 1.0 !important;
    }
    
    /* For the net income row with green background */
    tr.net-income-row:hover td {
      background-color: #c7f9d9 !important;
      opacity: 1.0 !important;
    }
    
    /* Remove any background transitions */
    .budget-table tr,
    .budget-table tr td,
    .budget-table tr th {
      transition: none !important;
    }
  `;
  
  // Append the style element to the head of the document
  document.head.appendChild(styleElement);
  
  // Apply these styles every 250ms to ensure they override anything else
  setInterval(() => {
    // Check if our style element still exists
    if (!document.getElementById('fix-hover-styles')) {
      document.head.appendChild(styleElement);
    }
    
    // Also apply styles to all cells directly
    const cells = document.querySelectorAll('.budget-table td');
    cells.forEach(cell => {
      const row = cell.closest('tr');
      
      // Get the current background color
      let bgColor = 'white';
      if (row.classList.contains('fixed-costs-row') || row.classList.contains('extraordinary-costs-row')) {
        bgColor = '#f2f2f7';
      } else if (row.classList.contains('net-income-row')) {
        bgColor = '#dcfce7';
      }
      
      // Set the background color
      cell.style.backgroundColor = bgColor;
    });
  }, 250);
});
