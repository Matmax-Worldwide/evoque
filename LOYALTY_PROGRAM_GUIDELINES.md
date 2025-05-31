# Loyalty Program Module Implementation Guidelines

## Loyalty Token Branding
- The official name for the loyalty currency/points is **Killa**.
- The textual symbol to be used for Killa is **KLA** (e.g., '100 KLA').
- All user-facing text, UI components, notifications, and documentation within the loyalty program module must use the 'Killa' name and 'KLA' symbol consistently where applicable.

## Directory Structure

```
src/app/[locale]/loyaltyprogram/
├── layout.tsx
├── page.tsx
├── page.test.tsx
├── overview/
│   ├── page.tsx
│   └── page.test.tsx
├── history/
│   ├── page.tsx
│   └── page.test.tsx
├── rewards/
│   ├── page.tsx
│   └── page.test.tsx
├── tiers/
│   ├── page.tsx
│   └── page.test.tsx
├── campaigns/
│   ├── page.tsx
│   └── page.test.tsx
├── settings/
│   ├── page.tsx
│   └── page.test.tsx
└── analytics/
    ├── page.tsx
    └── page.test.tsx
```

## Layout Configuration

### LoyaltyProgramLayout (`layout.tsx`)
- **Client Component**: Mark with `'use client';`
- **Props Interface**: `LoyaltyProgramLayoutProps` with `children: React.ReactNode` and `params: Promise<{ locale: string }>`
- **Locale Extraction**: Use `const { locale } = use(params);` (import `use` from `react`)
- **Context Provider**: Wrap children with `LoyaltyContextProvider` for shared state
- **Sidebar Integration**: Include `LoyaltyProgramSidebar` component with locale prop
- **Layout Structure**: Flex container with sidebar and main content area

## Main Dashboard Page (`page.tsx`)

### Structure Requirements
- **Client Component**: Mark with `'use client';`
- **Tab Navigation**: Implement using Tabs component with sections:
  - Overview (default)
  - Points History
  - Rewards Catalog
  - Tier Progress
  - Active Campaigns
- **Data Fetching**: Use `graphqlClient` in `useEffect` to fetch:
  - Current points balance
  - Tier status
  - Recent transactions
  - Available rewards count
  - Active campaigns
- **Loading States**: Implement skeleton loaders for each data section
- **Error Handling**: Display user-friendly error messages with retry options

### Required Display Components
- `PointsBalanceCard`: Shows current balance, pending points, tier status. *Note: Should display "Killa Balance" or similar, using "KLA" as the symbol (e.g., "Available Killa").*
- `QuickStatsGrid`: Displays key metrics (lifetime points, redemptions, tier progress)
- `RecentActivityFeed`: Latest 5 transactions with icons
- `FeaturedRewardsCarousel`: Highlight top rewards
- `TierProgressBar`: Visual representation of tier advancement

## Sub-Feature Pages

*Note: All sub-feature pages displaying point amounts or transactions should use "KLA" as the symbol for Killa.*

### History Page (`history/page.tsx`)
- **Components Required**:
  - `PointsHistoryTable`: Sortable, filterable transaction list
  - `TransactionFilters`: Date range, type, status filters
  - `ExportButton`: CSV/PDF export functionality
- **Data Structure**: Paginated transaction history with infinite scroll
- **Features**: Search by transaction ID, amount range filtering

### Rewards Page (`rewards/page.tsx`)
- **Components Required**:
  - `RewardsCatalog`: Grid/list view toggle
  - `RewardCard`: Individual reward display
  - `CategoryFilter`: Filter by product/service/discount
  - `RedemptionModal`: Confirmation flow
- **Features**: Sort by points required, availability, popularity
- **Real-time Updates**: WebSocket for inventory changes

### Tiers Page (`tiers/page.tsx`)
- **Components Required**:
  - `TierProgressDisplay`: Current tier with benefits
  - `TierComparisonTable`: All tiers side-by-side
  - `BenefitsHighlight`: Animated benefits showcase
  - `NextTierTeaser`: Points needed for upgrade
- **Visual Elements**: Progress rings, achievement badges

### Campaigns Page (`campaigns/page.tsx`)
- **Components Required**:
  - `ActiveCampaignsList`: Current promotions
  - `CampaignCard`: Individual campaign details
  - `MultiplierBadge`: Visual earning multipliers
  - `CountdownTimer`: For limited-time offers
- **Admin Features**: Campaign creation/editing interface

### Settings Page (`settings/page.tsx`)
- **Sections**:
  - Wallet connection management
  - Notification preferences
  - Privacy settings
  - API key management (for partners)
- **Components Required**:
  - `WalletConnector`: Web3 wallet integration
  - `NotificationToggles`: Email/SMS/push preferences
  - `APIKeyManager`: Generate/revoke keys

### Analytics Page (`analytics/page.tsx`)
- **Components Required**:
  - `PointsChart`: Line/bar charts for earning/spending
  - `EngagementMetrics`: User activity heatmaps
  - `ROICalculator`: Campaign effectiveness
  - `PredictiveInsights`: Churn risk indicators
- **Data Visualization**: Use recharts library
- **Export Options**: Reports in various formats

## Component Library Structure

```
src/components/loyaltyprogram/
├── cards/
│   ├── PointsBalanceCard.tsx
│   ├── TierStatusCard.tsx
│   └── QuickActionCard.tsx
├── tables/
│   ├── PointsHistoryTable.tsx
│   ├── RedemptionHistoryTable.tsx
│   └── TierComparisonTable.tsx
├── displays/
│   ├── TierProgressIndicator.tsx
│   ├── PointsAnimatedCounter.tsx
│   └── MultiplierBadge.tsx
├── modals/
│   ├── RedemptionModal.tsx
│   ├── TransferPointsModal.tsx
│   └── WalletConnectionModal.tsx
├── forms/
│   ├── CampaignCreationForm.tsx
│   ├── RewardCreationForm.tsx
│   └── TierConfigurationForm.tsx
├── charts/
│   ├── PointsHistoryChart.tsx
│   ├── RedemptionAnalyticsChart.tsx
│   └── TierDistributionChart.tsx
└── LoyaltyProgramSidebar.tsx
```
*Note: Components within this library that handle point display (e.g., `PointsBalanceCard`, `PointsHistoryTable`) will need to be updated to use "Killa" and "KLA" branding.*

## GraphQL Operations Required

### Queries
- `GET_LOYALTY_PROFILE`: Fetch complete user loyalty data
- `GET_POINTS_HISTORY`: Paginated transaction history
- `GET_REWARDS_CATALOG`: Available rewards with filters
- `GET_TIER_DETAILS`: All tier information
- `GET_ACTIVE_CAMPAIGNS`: Current promotions
- `GET_LOYALTY_ANALYTICS`: Dashboard metrics
*Note: Field names in GraphQL schemas related to points (e.g., `points`, `pointsRequired`) should ideally be updated to reflect the 'Killa' terminology (e.g., `killaBalance`, `killaRequired`). This change should be coordinated with backend development.*

### Mutations
- `REDEEM_REWARD`: Process reward redemption
- `TRANSFER_POINTS`: Point-to-point transfers
- `CONNECT_WALLET`: Link blockchain wallet
- `UPDATE_NOTIFICATION_PREFERENCES`: Settings updates
- `CREATE_CAMPAIGN`: Admin campaign creation
- `ISSUE_BONUS_POINTS`: Manual point adjustments

### Subscriptions
- `POINTS_BALANCE_UPDATES`: Real-time balance changes
- `REWARD_AVAILABILITY`: Inventory updates
- `CAMPAIGN_STATUS`: Campaign start/end notifications

## TypeScript Interfaces

### Core Types (`types/loyalty.ts`)
```typescript
interface LoyaltyProfile {}
interface PointsTransaction {}
interface Reward {}
interface Tier {}
interface Campaign {}
interface RedemptionRequest {}
interface WalletConnection {}
interface LoyaltyAnalytics {}
interface EarningRule {}
interface NotificationPreferences {}
```
*(These interfaces will be populated with specific properties as development progresses)*

*Note: Interface property names like `currentPoints`, `pointsTransaction`, `pointsRequired` should be updated to use 'Killa' (e.g., `currentKilla`, `killaTransaction`, `killaRequired`). The unit 'pts' (or similar) should be replaced by 'KLA'.*

### Component Props Interfaces
- Define props for each component with proper typing
- Use generic types for reusable components
- Implement strict null checks

## Context Structure

### LoyaltyContext (`contexts/LoyaltyContext.tsx`)
**State Management (Example)**:
- `currentPoints: number | null`
- `activeTier: Tier | null`
- `pendingTransactions: PointsTransaction[]`
- `selectedRewards: Reward[]`
- `notifications: string[]` // Or a more complex Notification object
- `walletStatus: 'connected' | 'disconnected' | 'connecting'`

**Actions (Example Methods on Context)**:
- `updateBalance(points: number): void`
- `processRedemption(rewardId: string): Promise<void>`
- `refreshProfile(): Promise<void>`
- `connectWallet(): Promise<void>`
- `disconnectWallet(): void`
- `queueNotification(message: string): void`

## Testing Requirements

### Test Coverage Areas
- Component rendering with various props
- User interactions (clicks, form submissions)
- Data fetching and error states (mocking `graphqlClient`)
- Context state updates and consumers
- Navigation between sections
- Responsive design breakpoints (visual testing if possible, otherwise unit tests for responsive props)

### Mock Requirements
- GraphQL client responses (`graphqlClient` methods)
- Web3 wallet interactions (ethers.js or web3.js calls)
- WebSocket connections (if used for real-time updates)
- External API calls (e.g., notification service)

## Integration Points

### External Services
- **Blockchain Integration**: Web3 provider (e.g., ethers.js) for wallet connections and contract interactions.
- **Payment Gateway**: For any hybrid payment processing related to loyalty points.
- **Analytics Service**: Event tracking for user behavior (e.g., Segment, Mixpanel).
- **Notification Service**: For Email/SMS/Push delivery (e.g., Twilio, SendGrid).
- **File Storage**: For export functionality (e.g., AWS S3, Google Cloud Storage).

### Internal Systems
- **Authentication**: Leverage existing auth context/session management.
- **User Profile**: Extend or link with current user data model.
- **Payment History**: Link with existing transactions if applicable.
- **Customer Support**: Integration with ticketing system (e.g., Zendesk, Intercom).

## Performance Optimizations

### Implementation Guidelines
- **Code Splitting**: Lazy load sub-features/routes using `next/dynamic`.
- **Data Caching**: Consider React Query or SWR for client-side data caching, optimistic updates, and background refetching if not using Apollo Client's built-in caching extensively.
- **Image Optimization**: Use `next/image` component for automatic image optimization.
- **Bundle Size**: Monitor with `webpack-bundle-analyzer` or similar tools.
- **Memoization**: Use `React.memo` for expensive components and `useMemo`/`useCallback` for props and functions.

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible and focusable in a logical order.
- **Screen Readers**: Provide proper ARIA labels, roles, and attributes for all elements, especially custom components.
- **Color Contrast**: Ensure text and UI elements meet minimum color contrast ratios.
- **Focus Management**: Implement clear visual focus indicators for interactive elements.
- **Error Messages**: Ensure error messages are descriptive, clearly associated with their respective inputs, and announced by screen readers.

## Security Considerations

### Frontend Security
- **Input Validation**: Implement client-side validation for all user inputs, complementing backend validation.
- **XSS Prevention**: Sanitize user-generated content displayed in the UI (though React generally mitigates this, be careful with `dangerouslySetInnerHTML`).
- **CSRF Protection**: Ensure backend uses CSRF tokens if applicable for form submissions/mutations.
- **Secure Storage**: Avoid storing sensitive information in `localStorage`. Use `httpOnly` cookies for session tokens managed by the backend.
- **Rate Limiting**: While primarily a backend concern, be mindful of UI patterns that could encourage rapid requests.

## Styling Guidelines

### Tailwind CSS Usage
- **Consistent Spacing**: Use the standard Tailwind spacing scale for margins, paddings, and gaps.
- **Color Palette**: Define and use a consistent color palette. Extend the Tailwind theme in `tailwind.config.js` for loyalty brand-specific colors.
- **Responsive Design**: Employ a mobile-first approach using Tailwind's responsive prefixes (sm, md, lg, xl, 2xl).
- **Dark Mode**: If dark mode is a requirement, implement it using Tailwind's dark mode variant.
- **Animation**: Use subtle transitions and animations for interactive elements to enhance UX.

## Deployment Considerations

### Environment Variables
Ensure the following environment variables (prefixed with `NEXT_PUBLIC_` for client-side access if needed) are configured:
- `NEXT_PUBLIC_BLOCKCHAIN_RPC_URL`
- `NEXT_PUBLIC_LOYALTY_CONTRACT_ADDRESS` (if applicable)
- `NEXT_PUBLIC_WEB3_PROVIDER_URL` (if different from RPC URL)
- `LOYALTY_API_ENDPOINT` (for GraphQL or other backend services)
- `WEBSOCKET_URL` (if using WebSockets for real-time updates)
```
