// src/components/loyaltyprogram/tables/TierComparisonTable.tsx
'use client';

import React from 'react';
import { Tier } from '@/types/loyalty';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircleIcon, ShieldCheckIcon, StarIcon } from 'lucide-react'; // Example icons for tiers/benefits

interface TierComparisonTableProps {
  tiers: Tier[];
  currentTierId?: string;
  title?: string;
  description?: string;
}

// Helper to get an icon based on tier name or a default
const getTierIcon = (tierName?: string) => {
  if (!tierName) return <StarIcon className="h-6 w-6 text-yellow-500" />; // Default
  if (tierName.toLowerCase().includes('gold') || tierName.toLowerCase().includes('platinum')) return <StarIcon className="h-6 w-6 text-yellow-500" />;
  if (tierName.toLowerCase().includes('silver')) return <ShieldCheckIcon className="h-6 w-6 text-gray-400" />;
  return <ShieldCheckIcon className="h-6 w-6 text-blue-500" />; // Default for bronze etc.
};


const TierComparisonTable: React.FC<TierComparisonTableProps> = ({
  tiers,
  currentTierId,
  title = "Compare Our Killa Tiers",
  description = "Find the tier that best suits your engagement and unlock exclusive benefits.",
}) => {
  if (!tiers || tiers.length === 0) {
    return <p className="text-center py-8 text-gray-500">No tier information available to compare.</p>;
  }

  // Sort tiers by minKillaToAchieve to ensure logical order in the table
  const sortedTiers = [...tiers].sort((a, b) => a.minKillaToAchieve - b.minKillaToAchieve);

  // Define the attributes we want to compare in rows
  // This is more for conceptual organization; we'll build rows directly for better JSX control.
  // const attributes = [
  //   { id: 'icon', label: 'Icon' },
  //   { id: 'minKilla', label: 'Killa to Achieve' },
  //   { id: 'multiplier', label: 'Earning Multiplier' },
  // ];

  const maxBenefitsToShow = 3; // Show top N benefits in the table, more on tier page

  return (
    <Card className="shadow-xl w-full overflow-hidden">
      <CardHeader className="bg-gray-50/50">
        <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">{title}</CardTitle>
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 min-w-[150px] shadow-sm">
                  Feature
                </th>
                {sortedTiers.map(tier => (
                  <th
                    key={tier.id}
                    scope="col"
                    className={`px-4 py-3.5 text-center text-sm font-semibold
                      ${tier.id === currentTierId ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700'}
                      min-w-[150px]`}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* Tier Icon - Visual Row */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 sticky left-0 bg-white z-10 shadow-sm">Tier Icon</td>
                {sortedTiers.map(tier => (
                  <td key={`${tier.id}-icon`} className={`px-4 py-3 text-center ${tier.id === currentTierId ? 'bg-indigo-50' : ''}`}>
                    <div className="flex justify-center items-center">
                      {getTierIcon(tier.name)}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Min Killa to Achieve */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 sticky left-0 bg-white z-10 shadow-sm">Killa to Achieve</td>
                {sortedTiers.map(tier => (
                  <td key={`${tier.id}-minKilla`} className={`px-4 py-3 text-center text-sm text-gray-600 ${tier.id === currentTierId ? 'bg-indigo-50 font-semibold' : ''}`}>
                    {tier.minKillaToAchieve.toLocaleString()} KLA
                  </td>
                ))}
              </tr>

              {/* Earning Multiplier */}
               <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 sticky left-0 bg-white z-10 shadow-sm">Killa Multiplier</td>
                {sortedTiers.map(tier => (
                  <td key={`${tier.id}-multiplier`} className={`px-4 py-3 text-center text-sm text-gray-600 ${tier.id === currentTierId ? 'bg-indigo-50 font-semibold' : ''}`}>
                    {tier.multiplier ? `${tier.multiplier}x` : 'Standard'}
                  </td>
                ))}
              </tr>

              {/* Benefits - List first few benefits */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 align-top sticky left-0 bg-white z-10 shadow-sm">Key Benefits</td>
                {sortedTiers.map(tier => (
                  <td key={`${tier.id}-benefits`} className={`px-4 py-3 text-sm text-gray-600 align-top ${tier.id === currentTierId ? 'bg-indigo-50' : ''}`}>
                    <ul className="space-y-1 text-left">
                      {tier.benefits && tier.benefits.length > 0 ? (
                        tier.benefits.slice(0, maxBenefitsToShow).map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400 italic">No specific benefits listed.</li>
                      )}
                      {tier.benefits && tier.benefits.length > maxBenefitsToShow && (
                        <li className="text-xs text-blue-500 mt-1">
                          + {tier.benefits.length - maxBenefitsToShow} more...
                        </li>
                      )}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Add more attribute rows here if needed */}

            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TierComparisonTable;
