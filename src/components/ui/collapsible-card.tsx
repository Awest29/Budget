import React, { useState } from 'react';
import './collapsible-card.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function CollapsibleCard({ 
  title, 
  children, 
  defaultCollapsed = true,
  className = ""
}: CollapsibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className={className}>
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between p-4 collapsible-card-header border-b border-gray-700"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="flex items-center collapsible-card-title">
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 mr-2" />
          ) : (
            <ChevronDown className="h-5 w-5 mr-2" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="collapsible-card-content">
          {children}
        </CardContent>
      )}
    </Card>
  );
}