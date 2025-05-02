// src/components/ui/ModernCollapsible.tsx
import React, { useState, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ModernCollapsibleProps {
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

export function ModernCollapsible({
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
}: ModernCollapsibleProps) {
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
    <div className={`collapsible ${isExpanded ? 'expanded' : ''} ${className}`}>
      <div
        className={`collapsible-header ${headerClassName} ${getPaddingLeft()}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`collapsible-title ${titleClassName}`}>
          <ChevronRight
            size={getIconSize()}
            className={`collapsible-icon transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          {title}
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
        <div className={`collapsible-content ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export default ModernCollapsible;