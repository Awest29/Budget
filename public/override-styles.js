// This script will run when the page loads to override dark backgrounds
window.addEventListener('DOMContentLoaded', function() {
  // Inject a style tag with specific overrides for dark backgrounds
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    /* Override dark backgrounds in the budget table */
    .budget-table tr[style*="background-color: rgb(51, 65, 85)"],
    .budget-table tr[style*="background-color:#334155"],
    .budget-table tr[style*="background-color: #334155"],
    .budget-table tr[style*="background-color: rgb(71, 85, 105)"],
    .budget-table tr[style*="background-color:#475569"],
    .budget-table tr[style*="background-color: #475569"] {
      background-color: #f8fafc !important;
    }
    
    .budget-table tr[style*="background-color: rgb(51, 65, 85)"] td,
    .budget-table tr[style*="background-color:#334155"] td,
    .budget-table tr[style*="background-color: #334155"] td,
    .budget-table tr[style*="background-color: rgb(71, 85, 105)"] td,
    .budget-table tr[style*="background-color:#475569"] td,
    .budget-table tr[style*="background-color: #475569"] td {
      background-color: #f8fafc !important;
      color: #000000 !important;
    }
    
    /* Lighter hover effect */
    .budget-table tr[style*="background-color"]:hover td {
      background-color: #f1f5f9 !important;
      color: #000000 !important;
    }
  `;
  document.head.appendChild(styleTag);
  
  // Also set up a mutation observer to catch dynamically added elements
  const observer = new MutationObserver(function(mutations) {
    // Look for any dark background rows
    document.querySelectorAll('.budget-table tr[style*="background-color: rgb(51, 65, 85)"], .budget-table tr[style*="background-color:#334155"]').forEach(row => {
      row.style.backgroundColor = '#f8fafc';
      Array.from(row.getElementsByTagName('td')).forEach(cell => {
        cell.style.backgroundColor = '#f8fafc';
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
