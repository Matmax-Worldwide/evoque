// src/components/loyaltyprogram/displays/FeaturedRewardsCarousel.test.tsx
'use client';

import React from 'react';
import { render, screen }
from '@testing-library/react';
import FeaturedRewardsCarousel, { type FeaturedRewardItem } from './FeaturedRewardsCarousel';

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt || ''} />;
    },
}));

// Mock Carousel components as they might have their own complex logic/state
jest.mock('@/components/ui/carousel', () => ({
    Carousel: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-mock">{children}</div>,
    CarouselContent: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-content-mock">{children}</div>,
    CarouselItem: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel-item-mock">{children}</div>,
    CarouselNext: () => <button data-testid="carousel-next-mock">Next</button>,
    CarouselPrevious: () => <button data-testid="carousel-previous-mock">Prev</button>,
}));


const mockRewards: FeaturedRewardItem[] = [
  { id: '1', name: 'Free Coffee Large', pointsRequired: 500, imageUrl: '/coffee.jpg', category: 'Beverages' },
  { id: '2', name: '$10 Gift Card', pointsRequired: 1000, imageUrl: '/giftcard.jpg', category: 'Vouchers' },
  { id: '3', name: 'Premium T-Shirt', pointsRequired: 1500, imageUrl: '/tshirt.jpg', category: 'Merchandise' },
  { id: '4', name: 'Early Access Pass', pointsRequired: 2000, category: 'Experiences' },
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

    // Check content of one item
    expect(screen.getByText('Free Coffee Large')).toBeInTheDocument();
    expect(screen.getByText('500 pts')).toBeInTheDocument();
    expect(screen.getByAltText('Free Coffee Large')).toHaveAttribute('src', '/coffee.jpg');
    expect(screen.getByText('Beverages')).toBeInTheDocument(); // Category
    expect(screen.getAllByText('Redeem')[0]).toBeInTheDocument(); // Redeem button
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<FeaturedRewardsCarousel rewards={[]} isLoading={true} itemsToShow={3} />);
    // Skeletons for Card components
    const cardSkeletons = container.querySelectorAll('.overflow-hidden .h-48.w-full'); // Image skeleton
    expect(cardSkeletons.length).toBe(3); // itemsToShow = 3

    // Check for header skeletons (title and description)
    const headerTitleSkeletons = container.querySelectorAll('.overflow-hidden .h-5.w-3\\/4');
    expect(headerTitleSkeletons.length).toBe(3);

    // Check for content skeletons (points)
    const contentSkeletons = container.querySelectorAll('.overflow-hidden .h-8.w-1\\/3');
    expect(contentSkeletons.length).toBe(3);

    // Check for footer skeletons (buttons)
    const footerButtonSkeletons = container.querySelectorAll('.overflow-hidden .h-9.w-24');
    expect(footerButtonSkeletons.length).toBe(3 * 2); // Two buttons per card

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
