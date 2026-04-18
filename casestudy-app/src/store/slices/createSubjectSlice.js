import { apiGet, apiPost } from '../../lib/api';

export const createSubjectSlice = (set, get) => ({
  subjects: [],
  fetchSubjects: async () => {
     try {
         const data = await apiGet('/subjects');
         if (data) {
             set({ subjects: data });
         }
     } catch (error) {
         console.error("fetchSubjects error:", error);
     }
  },
  createSubject: async (name, description) => {
      try {
          const newSubject = await apiPost('/subjects', { name, description });
          await get().fetchSubjects();
          return { success: true, subject: newSubject };
      } catch (error) {
          console.error("Error creating subject:", error);
          return { success: false, error: error.message };
      }
  },
  enrollSubject: async (password) => {
      try {
          const response = await apiPost('/subjects/enroll', { password });
          await get().fetchSubjects();
          // We likely also want to fetch cases again, since we unlocked new cases.
          await get().fetchCases?.();
          return { success: true, subject: response.subject };
      } catch (error) {
          console.error("Error enrolling in subject:", error);
          return { success: false, error: error.message };
      }
  }
});
