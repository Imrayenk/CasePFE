import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createAuthSlice } from './slices/createAuthSlice';
import { createProfileSlice } from './slices/createProfileSlice';
import { createWorkspaceSlice } from './slices/createWorkspaceSlice';
import { createCaseSlice } from './slices/createCaseSlice';
import { createSocialSlice } from './slices/createSocialSlice';
import { createNotificationSlice } from './slices/createNotificationSlice';
import { createUISlice } from './slices/createUISlice';

const useStore = create(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createProfileSlice(...a),
      ...createWorkspaceSlice(...a),
      ...createCaseSlice(...a),
      ...createSocialSlice(...a),
      ...createNotificationSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'casestudy-storage',
      // CRITICAL FIX: We strictly exclude user, socialData, and avatars from persistence.
      // This solves the stale profile load bug and prevents race conditions with Supabase.
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode,
        caseWorkspaces: state.caseWorkspaces,
        
        // Only persist current active workspace drafting so refresh doesn't wipe unsaved nodes
        summaryText: state.summaryText, 
        nodes: state.nodes, 
        edges: state.edges,
        keywords: state.keywords,
      }),
    }
  )
);

export default useStore;
