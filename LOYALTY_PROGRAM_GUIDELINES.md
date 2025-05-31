# Guidelines for Creating the `src/app/[locale]/loyaltyprogram` Module

**Goal:** Replicate the structure and patterns of `src/app/[locale]/bookings`.

The new `loyaltyprogram` module should mirror the structure, patterns, and conventions observed in the `src/app/[locale]/bookings` module.

---

**1. Directory & File Structure:**
    *   **Root:** `src/app/[locale]/loyaltyprogram/`
    *   **Layout:** `src/app/[locale]/loyaltyprogram/layout.tsx`
    *   **Main Page:** `src/app/[locale]/loyaltyprogram/page.tsx`
    *   **Sub-Features (Example: `history`):**
        *   Directory: `src/app/[locale]/loyaltyprogram/history/`
        *   Page: `src/app/[locale]/loyaltyprogram/history/page.tsx`
        *   Test: `src/app/[locale]/loyaltyprogram/history/page.test.tsx`
    *   *(Repeat sub-feature structure for `rewards`, `tiers`, etc.)*
    *   **Main Page Test:** `src/app/[locale]/loyaltyprogram/page.test.tsx`

**2. Layout File (`layout.tsx`):**
    *   `'use client';`
    *   Component: `LoyaltyProgramLayout({ children, params })`
    *   Props: `children: React.ReactNode`, `params: Promise<{ locale: string }>`
    *   Locale: `const { locale } = use(params);` (import `use` from `react`)
    *   **Optional Sidebar:**
        *   Create `LoyaltyProgramSidebar` in `src/components/loyaltyprogram/`.
        *   Include in layout: `<LoyaltyProgramSidebar locale={locale} />`.
    *   **Optional Context Providers:** Wrap `{children}` if module-specific contexts are needed (e.g., `LoyaltyContext`).
    *   **Structure Example:**
        ```tsx
        // src/app/[locale]/loyaltyprogram/layout.tsx
        'use client';
        import { use } from 'react';
        // import LoyaltyProgramSidebar from '@/components/loyaltyprogram/LoyaltyProgramSidebar';
        // import { LoyaltyContextProvider } from '@/contexts/LoyaltyContext';

        interface LoyaltyProgramLayoutProps {
          children: React.ReactNode;
          params: Promise<{ locale: string }>;
        }

        export default function LoyaltyProgramLayout({ children, params }: LoyaltyProgramLayoutProps) {
          const { locale } = use(params);
          return (
            // <LoyaltyContextProvider>
              <div className="flex h-screen bg-gray-50"> {/* Base structure */}
                {/* <LoyaltyProgramSidebar locale={locale} /> */}
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            // </LoyaltyContextProvider>
          );
        }
        ```

**3. Main Page File (`page.tsx` at module root):**
    *   `'use client';`
    *   Serves as a dashboard/overview.
    *   **UI:** Use `@/components/ui/` (Cards, Tabs, Buttons) & `lucide-react` icons.
    *   **Tabs:** Strongly recommended for sections (Overview, History, Rewards).
        *   `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
    *   **Data:** Fetch overview data (`graphqlClient` in `useEffect`), manage loading/error states.
    *   **Components:** Use/create specialized components in `src/components/loyaltyprogram/` (e.g., `PointsSummaryDisplay`).
    *   **Conceptual Structure Example:**
        ```tsx
        // src/app/[locale]/loyaltyprogram/page.tsx
        'use client';
        import React, { useState, useEffect } from 'react';
        import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
        // ... other necessary imports: Card, Button, icons, graphqlClient, types ...
        // import PointsSummaryDisplay from '@/components/loyaltyprogram/PointsSummaryDisplay';

        export default function LoyaltyProgramPage() {
          const [activeTab, setActiveTab] = useState('overview');
          // ... states for data, loading, error ...

          useEffect(() => { /* Fetch overview data using graphqlClient */ }, []);

          return (
            <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
              <h1 className="text-3xl font-bold">Loyalty Program</h1>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="history">Points History</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
                  {/* Other triggers */}
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  {/* Display overview components, e.g., <PointsSummaryDisplay /> */}
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  {/* Content for points history */}
                </TabsContent>
                <TabsContent value="rewards" className="mt-4">
                  {/* Content for rewards catalog */}
                </TabsContent>
                {/* Other TabsContent sections */}
              </Tabs>
            </div>
          );
        }
        ```

**4. Sub-Feature Pages (e.g., `history/page.tsx`):**
    *   `'use client';`
    *   Focus on one specific loyalty aspect.
    *   **Data:** Fetch feature-specific data (`graphqlClient` in `useEffect`), manage loading/error.
    *   **Components:** Use shared UI and create new ones in `src/components/loyaltyprogram/` (e.g., `PointsHistoryTable.tsx`).

**5. Component Strategy:**
    *   **Reuse:** Leverage components from `@/components/ui/` and icons from `lucide-react`.
    *   **New:** Create loyalty-specific, reusable components in a new directory: `src/components/loyaltyprogram/` (e.g., `PointsBalanceCard.tsx`, `RewardListItem.tsx`, `TierProgressIndicator.tsx`).
    *   **Imports:** Use clear import paths, e.g., `@/components/loyaltyprogram/YourComponent`.

**6. Data Fetching:**
    *   **Primary Client:** Use the existing `graphqlClient` for all API interactions.
    *   **Method:** Fetch data primarily within `useEffect` hooks in client components.
    *   **User Experience:** Implement proper loading states (e.g., display spinners, skeleton loaders) and clear error handling (e.g., display error messages, use `toast` notifications via `sonner` if available).

**7. State Management:**
    *   **Local Component State:** Use React hooks (`useState`, `useEffect`, `useMemo`).
    *   **Shared Module-level State (if needed):** If complex state needs to be shared across multiple loyalty components, consider creating a `LoyaltyContext` (e.g., in `src/contexts/LoyaltyContext.tsx`) and use its provider in `loyaltyprogram/layout.tsx`.

**8. Styling:**
    *   **Tailwind CSS:** Use Tailwind CSS utility classes directly in JSX for all styling, maintaining consistency with the rest of the application.

**9. Testing:**
    *   **Frameworks & Libraries:** Use Jest and `@testing-library/react`.
    *   **File Location:** Co-locate test files (`*.test.tsx`) with the components or pages they test.
    *   **Mocking:** Mock child components and external dependencies (like `graphqlClient` or specific data manager components) to ensure tests are focused and not brittle.
    *   **Assertions:** Test for correct rendering, display of data, and user interactions where applicable.

**10. TypeScript & Interfaces:**
    *   **Language:** Use TypeScript for all new code.
    *   **Type Definitions:** Define TypeScript interfaces for props, state, and data structures related to the loyalty program (e.g., `LoyaltyPoints`, `RewardItem`, `TierInfo`).
    *   **Location of Types:** These can be placed in a dedicated `types/loyalty.ts` file or co-located within component files if they are very specific and not widely reused.

**11. Navigation:**
    *   **Next.js Tools:** Use `useRouter()` from `next/navigation` for programmatic navigation and the `<Link>` component from `next/link` for declarative navigation links.
    *   **Locale Parameter:** Ensure the `locale` dynamic segment is correctly included and passed in all navigation paths and links.
```
