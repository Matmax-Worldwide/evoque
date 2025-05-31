// src/components/loyaltyprogram/displays/FeaturedRewardsCarousel.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import FeaturedRewardsCarousel from './FeaturedRewardsCarousel';
// Import FeaturedCarouselRewardItem from the centralized types
import { type FeaturedCarouselRewardItem } from '@/types/loyalty';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt || ''} />;
    },
}));

jest.mock('@/components/ui/carousel', () => ({
    Carousel: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-mock">{children}</div>,
    CarouselContent: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-content-mock">{children}</div>,
    CarouselItem: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-item-mock">{children}</div>,
    CarouselNext: () => <button data-testid="carousel-next-mock">Next</button>,
    CarouselPrevious: () => <button data-testid="carousel-previous-mock">Prev</button>,
}));

// Updated mockRewards with killaRequired
const mockRewards: FeaturedCarouselRewardItem[] = [
  { id: '1', name: 'Free Coffee Large', killaRequired: 500, imageUrl: '/coffee.jpg', category: 'Beverages' }, // Updated
  { id: '2', name: '$10 Gift Card', killaRequired: 1000, imageUrl: '/giftcard.jpg', category: 'Vouchers' }, // Updated
  { id: '3', name: 'Premium T-Shirt', killaRequired: 1500, imageUrl: '/tshirt.jpg', category: 'Merchandise' }, // Updated
  { id: '4', name: 'Early Access Pass', killaRequired: 2000, category: 'Experiences' }, // Updated
];

describe('FeaturedRewardsCarousel', () => {
  it('renders the title and description', () => {
    render(<FeaturedRewardsCarousel rewards={mockRewards} title="Our Top Picks" description="Selected just for you." />);
    expect(screen.getByText('Our Top Picks')).toBeInTheDocument();
    expect(screen.getByText('Selected just for you.')).toBeInTheDocument();
  });

  it('renders reward items correctly using mocked carousel', () => {
    render(<FeaturedRewardsCarousel rewards={mockRewards} />);
    expect(screen.getByTestId('carousel-mock')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-content-mock')).toBeInTheDocument();

    const items = screen.getAllByTestId('carousel-item-mock');
    expect(items.length).toBe(mockRewards.length);

    expect(screen.getByText('Free Coffee Large')).toBeInTheDocument();
    // Check for the text "500" and then ensure "KLA" is present, likely in a sibling span
    const killaValueElement = screen.getByText((content, element) => {
        // Check if the element's text content starts with "500" and is within the correct structure
        return element?.tagName.toLowerCase() === 'p' && content.startsWith('500');
    });
    expect(killaValueElement).toBeInTheDocument();
    expect(killaValueElement.textContent).toContain('500 KLA');


    expect(screen.getByAltText('Free Coffee Large')).toHaveAttribute('src', '/coffee.jpg');
    expect(screen.getByText('Beverages')).toBeInTheDocument();
    expect(screen.getAllByText('Redeem')[0]).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    render(<FeaturedRewardsCarousel rewards={[]} isLoading={true} itemsToShow={3} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Free Coffee Large')).not.toBeInTheDocument();
  });

  it('renders a message when no rewards are provided', () => {
    render(<FeaturedRewardsCarousel rewards={[]} />);
    expect(screen.getByText('No featured rewards available at the moment. Check back soon!')).toBeInTheDocument();
  });

  it('renders CarouselNext and CarouselPrevious buttons when rewards length is greater than itemsToShow', () => {
    render(<FeaturedRewardsCarousel rewards={mockRewards} itemsToShow={2} />);
    expect(screen.getByTestId('carousel-next-mock')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-previous-mock')).toBeInTheDocument();
  });

  it('does not render CarouselNext and CarouselPrevious buttons when rewards length is not greater than itemsToShow', () => {
    render(<FeaturedRewardsCarousel rewards={mockRewards.slice(0,2)} itemsToShow={2} />);
    expect(screen.queryByTestId('carousel-next-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('carousel-previous-mock')).not.toBeInTheDocument();
  });
});
