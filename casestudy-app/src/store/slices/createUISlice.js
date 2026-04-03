export const createUISlice = (set, get) => ({
  isDarkMode: true,
  toggleDarkMode: () => set(s => {
      const newMode = !s.isDarkMode;
      document.documentElement.classList.toggle('light', !newMode);
      document.documentElement.classList.toggle('dark', newMode);
      return { isDarkMode: newMode };
  }),
  syncTheme: () => {
      const stateTheme = get().isDarkMode;
      document.documentElement.classList.toggle('light', !stateTheme);
      document.documentElement.classList.toggle('dark', stateTheme !== false);
  }
});
