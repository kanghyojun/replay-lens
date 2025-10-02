'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ViewAllButtonProps {
  showAll: boolean;
  onToggle: () => void;
  totalCount?: number;
}

export function ViewAllButton({ showAll, onToggle, totalCount }: ViewAllButtonProps) {
  return (
    <div className="mt-4 flex justify-center">
      <Button variant="outline" onClick={onToggle}>
        {showAll ? (
          <>
            <ChevronUp className="h-4 w-4 mr-2" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            View All{totalCount !== undefined && ` (${totalCount} rows)`}
          </>
        )}
      </Button>
    </div>
  );
}
