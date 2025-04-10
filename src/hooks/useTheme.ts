import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

// Helper function to directly set editor and preview styles
const setEditorPreviewStyles = (isDark: boolean) => {
  // Get editor and preview elements
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview-container');
  
  if (editor) {
    editor.style.backgroundColor = isDark ? '#18181b' : '#ffffff';
    editor.style.color = isDark ? '#ffffff' : '#18181b';
    editor.style.borderColor = isDark ? '#3f3f46' : '#e4e4e7';
  }
  
  if (preview) {
    preview.style.backgroundColor = isDark ? '#18181b' : '#ffffff';
    preview.style.color = isDark ? '#ffffff' : '#18181b';
    preview.style.borderColor = isDark ? '#3f3f46' : '#e4e4e7';
    
    // Handle code blocks inside preview
    const codeBlocks = preview.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      (block as HTMLElement).style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
      (block as HTMLElement).style.color = isDark ? '#e2e8f0' : '#334155';
    });
    
    // Handle text elements inside preview
    const textElements = preview.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');
    textElements.forEach(el => {
      (el as HTMLElement).style.color = isDark ? '#ffffff' : '#18181b';
    });
    
    // Handle links inside preview
    const links = preview.querySelectorAll('a');
    links.forEach(link => {
      (link as HTMLElement).style.color = isDark ? '#3b82f6' : '#2563eb';
    });
  }
};

// This runs once on first load to prevent flash of wrong theme
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('inkwell-theme');
  const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // First clear any existing classes
  document.documentElement.classList.remove('light', 'dark');
  document.body.classList.remove('light', 'dark');
  
  // Set correct initial theme
  const initialTheme = storedTheme === 'light' ? 'light' : 
                      storedTheme === 'dark' ? 'dark' : 
                      systemDarkMode ? 'dark' : 'light';
                      
  document.documentElement.classList.add(initialTheme);
  document.body.classList.add(initialTheme);
  document.documentElement.setAttribute('data-theme', initialTheme);
  document.body.setAttribute('data-theme', initialTheme);
  
  // Set initial editor and preview styles
  setEditorPreviewStyles(initialTheme === 'dark');
}

export function useTheme() {
  // Initialize theme from localStorage or default to system
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    
    const saved = localStorage.getItem('inkwell-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved as Theme;
    }
    return 'system';
  });

  // Apply theme changes to the document and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const body = window.document.body;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply theme based on selection or system preference
    const applyTheme = () => {
      // First remove both classes to ensure clean state
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      
      // For debugging
      console.log('Applying theme:', theme, 'System prefers dark:', prefersDark);
      
      let appliedTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        // Apply based on system preference
        appliedTheme = prefersDark ? 'dark' : 'light';
      } else {
        // Apply explicit theme choice
        appliedTheme = theme as 'light' | 'dark';
      }
      
      // Apply to both root and body
      root.classList.add(appliedTheme);
      body.classList.add(appliedTheme);
      
      // Set data attributes too
      root.setAttribute('data-theme', appliedTheme);
      body.setAttribute('data-theme', appliedTheme);
      
      // Directly set editor and preview styles
      setEditorPreviewStyles(appliedTheme === 'dark');
      
      // Force reflow to ensure styles apply
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = '';
    };

    // Apply theme and save to localStorage
    applyTheme();
    localStorage.setItem('inkwell-theme', theme);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Define listener function
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    // Add event listener
    try {
      // Modern browsers
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, [theme]);

  // Get the actual theme (resolving 'system' to 'light' or 'dark')
  const resolvedTheme = (() => {
    if (typeof window === 'undefined') return theme === 'dark' ? 'dark' : 'light';
    
    if (theme !== 'system') return theme;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })();

  // Provide a toggle function for convenience
  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return { 
    theme, 
    setTheme,
    resolvedTheme,
    toggleTheme,
    isLight: resolvedTheme === 'light',
    isDark: resolvedTheme === 'dark',
    isSystem: theme === 'system'
  };
} 