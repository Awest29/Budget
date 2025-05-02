// src/components/budget/WhiteBackgroundCollapsible.tsx
import React, { useState, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface WhiteBackgroundCollapsibleProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  actionButton?: ReactNode;
  badge?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  level?: 1 | 2 | 3;
  customHeader?: ReactNode;
}

export function WhiteBackgroundCollapsible({
  title,
  children,
  defaultOpen = false,
  actionButton,
  badge,
  className = '',
  headerClassName = '',
  titleClassName = '',
  contentClassName = '',
  level = 1,
  customHeader
}: WhiteBackgroundCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  // Calculate padding and icon size based on level
  const getPaddingLeft = () => {
    if (level === 1) return '';
    if (level === 2) return 'pl-4';
    if (level === 3) return 'pl-8';
    return '';
  };

  const getIconSize = () => {
    if (level === 1) return 18;
    if (level === 2) return 16;
    if (level === 3) return 14;
    return 18;
  };

  return (
    <div 
      className={`collapsible ${isExpanded ? 'expanded' : ''} ${className}`} 
      style={{ backgroundColor: 'white' }}
    >
      <div
        className={`collapsible-header ${headerClassName} ${getPaddingLeft()}`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          backgroundColor: 'white', 
          color: '#334155',
          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: isExpanded ? '8px 8px 0 0' : '8px'
        }}
      >
        <div 
          className={`collapsible-title ${titleClassName}`}
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: '#334155',
            fontWeight: 600
          }}
        >
          <ChevronRight
            size={getIconSize()}
            className={`collapsible-icon transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            style={{ color: '#64748b' }}
          />
          <span style={{ marginLeft: '8px', color: '#334155' }}>{title}</span>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
        
        {/* Custom header content (for tables) */}
        {customHeader}
        
        {/* Action button (displayed on the right) */}
        {actionButton && (
          <div onClick={(e) => e.stopPropagation()}>
            {actionButton}
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div 
          className={`collapsible-content ${contentClassName}`}
          style={{ 
            backgroundColor: 'white',
            padding: '0',
            borderRadius: '0 0 8px 8px',
            border: '1px solid #e2e8f0',
            borderTop: 'none'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default WhiteBackgroundCollapsible;