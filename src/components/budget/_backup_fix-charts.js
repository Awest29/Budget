// Direct DOM manipulation to fix chart backgrounds
// This script should be loaded after the charts are rendered

// Function to fix chart backgrounds
function fixChartBackgrounds() {
  // Target the chart containers
  const chartContainers = document.querySelectorAll('.budget-charts-container, [class*="ModernCollapsible"] [class*="CollapsibleContent"] > div');
  
  // Set white background on all chart containers
  chartContainers.forEach(container => {
    container.style.backgroundColor = 'white';
    
    // Apply to all child elements
    const allChildren = container.querySelectorAll('*');
    allChildren.forEach(child => {
      // Only change background if it's not already white
      const style = window.getComputedStyle(child);
      const bgColor = style.backgroundColor;
      
      if (bgColor.includes('rgb(51, 65, 85)') || bgColor.includes('#334155')) {
        child.style.backgroundColor = 'white';
      }
    });
  });
  
  // Target the SVG elements directly
  const svgElements = document.querySelectorAll('svg');
  svgElements.forEach(svg => {
    // Find and change the background rectangle
    const bgRect = svg.querySelector('rect:first-child');
    if (bgRect) {
      bgRect.setAttribute('fill', 'white');
    }
  });
  
  // Target specific chart elements known to have dark backgrounds
  const chartElements = document.querySelectorAll('.recharts-surface, .recharts-wrapper, .recharts-responsive-container');
  chartElements.forEach(element => {
    element.style.backgroundColor = 'white';
  });
  
  // Fix the text colors for better visibility on white background
  const textElements = document.querySelectorAll('.recharts-text, .recharts-cartesian-axis-tick-value, .recharts-legend-item-text');
  textElements.forEach(element => {
    element.style.fill = '#334155';
    element.style.color = '#334155';
  });
  
  // Fix chart titles
  const chartTitles = document.querySelectorAll('[class*="Title"], [class*="title"], h3');
  chartTitles.forEach(title => {
    title.style.color = '#334155';
  });
}

// Run the function after the page loads and charts are rendered
document.addEventListener('DOMContentLoaded', fixChartBackgrounds);

// Also run when the window is fully loaded
window.addEventListener('load', fixChartBackgrounds);

// For React apps, we might need to run this after component updates
// Run every 500ms for the first 5 seconds to catch chart renderings
let attempts = 0;
const interval = setInterval(() => {
  fixChartBackgrounds();
  attempts++;
  if (attempts >= 10) {
    clearInterval(interval);
  }
}, 500);

// Export the function to be used directly if needed
export default fixChartBackgrounds;
