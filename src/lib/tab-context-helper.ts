import { useEffect } from 'react';
import { useTabContext } from '@/contexts/TabContext';

/**
 * Hook para sincronizar un estado local de tabs con el contexto global de tabs
 */

/**
 * Custom React hook to synchronize tab state between a local component's
 * React state and the global `TabContext`.
 *
 * This hook ensures that if the tab changes in the local state, the global
 * context is updated, and conversely, if the tab changes in the global context
 * (e.g., due to another component or direct context manipulation), the local
 * state is also updated.
 *
 * It employs two `useEffect` hooks for this bi-directional synchronization:
 * 1. The first `useEffect` listens for changes in `localTab`. If `localTab`
 *    differs from `contextTab` (the active tab in `TabContext`), it calls
 *    `setContextTab` to update the global context.
 * 2. The second `useEffect` listens for changes in `contextTab`. If `contextTab`
 *    differs from `localTab`, it calls `setLocalTab` to update the local state.
 *
 * @param localTab - The current active tab identifier (string) in the local component's state.
 * @param setLocalTab - The state setter function (typically from `React.useState`) for the `localTab`.
 *                      This function should accept a string argument representing the new active tab.
 */
export function useSyncTabState(localTab: string, setLocalTab: (tab: string) => void) {
  const { activeTab: contextTab, setActiveTab: setContextTab } = useTabContext();

  // Sincronizar cambios locales al contexto global
  useEffect(() => {
    if (localTab !== contextTab) {
      setContextTab(localTab);
    }
  }, [localTab, contextTab, setContextTab]);

  // Sincronizar cambios del contexto global al estado local
  useEffect(() => {
    if (contextTab !== localTab) {
      setLocalTab(contextTab);
    }
  }, [contextTab, localTab, setLocalTab]);
} 