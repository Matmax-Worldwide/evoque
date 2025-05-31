// src/components/loyaltyprogram/forms/CategoryFilter.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryFilter, { type CategoryOption } from './CategoryFilter';

const mockCategories: CategoryOption[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'vouchers', label: 'Vouchers' },
  { value: 'merchandise', label: 'Merchandise' },
];

describe('CategoryFilter', () => {
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  it('renders the select with categories and title', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="all"
        onCategoryChange={mockOnCategoryChange}
        title="Product Categories"
      />
    );
    expect(screen.getByLabelText('Product Categories')).toBeInTheDocument(); // Label points to SelectTrigger via htmlFor
    // Check if the currently selected value is displayed by SelectValue
    // The SelectValue often displays the label of the selected option.
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders with a placeholder if no category is initially selected and categories exist', () => {
    // To test placeholder, selectedCategory should not match any option, or be undefined,
    // and the SelectValue should show placeholder text.
    // Our component defaults to the first option if selectedCategory is undefined,
    // so we test the placeholder prop on SelectValue.
    render(
      <CategoryFilter
        categories={mockCategories}
        onCategoryChange={mockOnCategoryChange}
        placeholder="Choose one..." // This placeholder is for the SelectValue component
      />
    );
    // SelectValue will display the label of categories[0].value (All Categories) due to currentSelection logic
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    // The actual placeholder text "Choose one..." would be visible if `currentSelection` was empty AND `placeholder` was passed to `SelectValue`
    // However, our `currentSelection` logic ensures it's never empty if `categories` is not empty.
    // If `SelectValue` itself shows the placeholder prop when no value matches, this could be tested differently.
    // For now, this confirms the default selection behavior.
  });

  it('calls onCategoryChange with the new value when a category is selected', async () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="all"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const selectTrigger = screen.getByRole('combobox'); // SelectTrigger often has role 'combobox'
    fireEvent.mouseDown(selectTrigger); // Open the dropdown

    // Wait for items to be available if they are rendered asynchronously or in a portal
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument(); // Check if an option is visible
    });

    const electronicsOption = screen.getByText('Electronics'); // This gets the SelectItem by its displayed text
    fireEvent.click(electronicsOption);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('electronics');
  });

  it('does not render if no categories are provided', () => {
    const { container } = render(
      <CategoryFilter categories={[]} onCategoryChange={mockOnCategoryChange} />
    );
    expect(container.firstChild).toBeNull(); // Component should return null
  });

  it('defaults to the first category if selectedCategory is invalid or undefined', () => {
    const { rerender } = render( // Use rerender to test with undefined selectedCategory
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="invalid-category" // This category does not exist
        onCategoryChange={mockOnCategoryChange}
      />
    );
    // SelectValue should display the label of the first category ('All Categories')
    expect(screen.getByText('All Categories')).toBeInTheDocument();

    rerender(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory={undefined} // Undefined selected category
        onCategoryChange={mockOnCategoryChange}
      />
    );
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });
});
