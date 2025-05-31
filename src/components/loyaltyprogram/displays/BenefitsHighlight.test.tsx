// src/components/loyaltyprogram/displays/BenefitsHighlight.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import BenefitsHighlight from './BenefitsHighlight';
import { GiftIcon, ShieldCheckIcon } from 'lucide-react'; // For testing custom icon

const mockBenefits: string[] = [
  'Exclusive Discounts',
  'Early Access to Sales',
  'Priority Support',
  'Birthday Bonus Killa',
];

describe('BenefitsHighlight', () => {
  it('renders a list of benefits with default icon', () => {
    render(<BenefitsHighlight benefits={mockBenefits} />);
    mockBenefits.forEach(benefit => {
      expect(screen.getByText(benefit)).toBeInTheDocument();
    });
    // Check for default icon (CheckCircleIcon) - count them
    // Lucide icons are SVGs. We can check for the presence of SVG elements.
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(mockBenefits.length);
    listItems.forEach(item => {
        // Check if an SVG is a child of the list item (very basic check)
        expect(item.querySelector('svg')).toBeInTheDocument();
        // To be more specific about CheckCircleIcon, you might need to inspect SVG paths or add data-testid
    });
  });

  it('renders a grid of benefits when layout is "grid"', () => {
    const { container } = render(<BenefitsHighlight benefits={mockBenefits} layout="grid" />);
    // Check for grid classes on the container of benefits
    // The direct child of the main div (after h3) should be the grid div
    const mainDiv = container.firstChild as HTMLElement;
    const benefitsContainer = mainDiv.childNodes[1] as HTMLElement; // 0 is h3, 1 is the ul or div
    expect(benefitsContainer.tagName.toLowerCase()).toBe('div');
    expect(benefitsContainer).toHaveClass('grid');
  });

  it('renders custom title when provided', () => {
    render(<BenefitsHighlight benefits={mockBenefits} title="Special Perks" />);
    expect(screen.getByText('Special Perks')).toBeInTheDocument();
  });

  it('renders title with tierName when no custom title is provided', () => {
    render(<BenefitsHighlight benefits={mockBenefits} tierName="Gold" />);
    expect(screen.getByText('Key Benefits of Gold Tier')).toBeInTheDocument();
  });

  it('renders default title when no tierName or custom title is provided', () => {
    render(<BenefitsHighlight benefits={mockBenefits} />);
    expect(screen.getByText('Key Benefits')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    // This test relies on being able to distinguish the custom icon.
    // If GiftIcon and CheckCircleIcon output significantly different SVG structures (e.g. different paths),
    // we could try to check for that. A common approach is to add a data-testid to the icon component if possible.
    // For this example, we'll check if the SVG rendered for GiftIcon is different from CheckCircleIcon by checking a known path data.
    // This is fragile and depends on lucide-react's internal SVG structure.
    render(<BenefitsHighlight benefits={mockBenefits.slice(0,1)} icon={GiftIcon} />); // Render with GiftIcon
    const giftIconSvg = screen.getByText(mockBenefits[0]).previousSibling as SVGSVGElement;
    expect(giftIconSvg.querySelector('path[d^="M20 12s-1.09-3-3-3"]').toBeTruthy(); // Path specific to GiftIcon

    render(<BenefitsHighlight benefits={mockBenefits.slice(0,1)} />); // Render with default CheckCircleIcon
    const checkIconSvg = screen.getByText(mockBenefits[0]).previousSibling as SVGSVGElement;
    expect(checkIconSvg.querySelector('path[d^="M22 11.08V12a10 10 0 1 1-5.93-9.14"]').toBeTruthy(); // Path specific to CheckCircleIcon
  });

  it('renders "No specific benefits" message when benefits array is empty', () => {
    render(<BenefitsHighlight benefits={[]} />);
    expect(screen.getByText('No specific benefits to highlight for this selection.')).toBeInTheDocument();
  });

  it('renders "No specific benefits" message if benefits prop is undefined', () => {
    // @ts-expect-error testing undefined prop
    const { container } = render(<BenefitsHighlight benefits={undefined} />);
    expect(container.firstChild?.textContent).toContain('No specific benefits to highlight for this selection.');
  });

  it('applies custom gridCols when layout is grid', () => {
     const { container } = render(
        <BenefitsHighlight benefits={mockBenefits} layout="grid" gridCols="grid-cols-1 md:grid-cols-3" />
    );
    const mainDiv = container.firstChild as HTMLElement;
    const benefitsContainer = mainDiv.childNodes[1] as HTMLElement; // 0 is h3, 1 is the div
    expect(benefitsContainer).toHaveClass('md:grid-cols-3');
  });
});
