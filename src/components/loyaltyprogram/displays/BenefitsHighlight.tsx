// src/components/loyaltyprogram/displays/BenefitsHighlight.tsx
'use client';

import React from 'react';
import { CheckCircleIcon, StarIcon, type LucideIcon } from 'lucide-react'; // Default and example icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Optional: wrap in a card

interface BenefitsHighlightProps {
  benefits: string[];
  tierName?: string; // Optional: To display "Benefits of [Tier Name]"
  icon?: LucideIcon; // Optional: A default icon for all benefits
  layout?: 'list' | 'grid'; // Default to 'list'
  title?: string; // Overrides "Benefits of [Tier Name]" if provided
  gridCols?: string; // e.g., 'grid-cols-1 md:grid-cols-2' if layout is grid
}

const BenefitsHighlight: React.FC<BenefitsHighlightProps> = ({
  benefits,
  tierName,
  icon: DefaultIcon = CheckCircleIcon, // Default icon
  layout = 'list',
  title,
  gridCols = 'grid-cols-1 sm:grid-cols-2',
}) => {
  const displayTitle = title || (tierName ? `Key Benefits of ${tierName} Tier` : "Key Benefits");

  if (!benefits || benefits.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        <p>No specific benefits to highlight for this selection.</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{displayTitle}</h3>
      {layout === 'list' ? (
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start">
              <DefaultIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={`grid ${gridCols} gap-x-6 gap-y-3`}>
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start">
              <DefaultIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BenefitsHighlight;
