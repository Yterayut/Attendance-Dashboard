import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type CustomTheme = 'default' | 'corporate' | 'ocean' | 'forest' | 'sunset';

interface ThemeConfig {
  mode: Theme;
  customTheme: CustomTheme;
  autoMode: boolean;
  autoSwitchTime: {
    darkStart: string;
    lightStart: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  customTheme: CustomTheme;
  resolvedTheme: 'light' | 'dark';
  config: ThemeConfig;
  setTheme: (theme: Theme) => void;
  setCustomTheme: (theme: CustomTheme) => void;
  updateConfig: (config: Partial<ThemeConfig>) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultConfig: ThemeConfig = {
  mode: 'light',
  customTheme: 'default',
  autoMode: true,
  autoSwitchTime: {
    darkStart: '18:00',
    lightStart: '06:00'
  }
};

const customThemes = {
  default: {
    light: {
      primary: 'from-indigo-600 to-purple-600',
      secondary: 'from-slate-50 via-blue-50 to-indigo-50',
      accent: 'bg-indigo-600',
      card: 'bg-white/60',
      text: 'text-slate-700'
    },
    dark: {
      primary: 'from-indigo-400 to-purple-400',
      secondary: 'from-gray-900 via-slate-800 to-gray-900',
      accent: 'bg-indigo-500',
      card: 'bg-gray-800/60',
      text: 'text-slate-200'
    }
  },
  corporate: {
    light: {
      primary: 'from-blue-600 to-cyan-600',
      secondary: 'from-gray-50 via-blue-50 to-cyan-50',
      accent: 'bg-blue-600',
      card: 'bg-white/70',
      text: 'text-gray-700'
    },
    dark: {
      primary: 'from-blue-400 to-cyan-400',
      secondary: 'from-gray-900 via-slate-900 to-gray-900',
      accent: 'bg-blue-500',
      card: 'bg-gray-800/70',
      text: 'text-gray-200'
    }
  },
  ocean: {
    light: {
      primary: 'from-blue-500 to-teal-500',
      secondary: 'from-blue-50 via-cyan-50 to-teal-50',
      accent: 'bg-teal-500',
      card: 'bg-white/65',
      text: 'text-slate-700'
    },
    dark: {
      primary: 'from-blue-400 to-teal-400',
      secondary: 'from-slate-900 via-blue-900 to-teal-900',
      accent: 'bg-teal-400',
      card: 'bg-slate-800/65',
      text: 'text-slate-200'
    }
  },
  forest: {
    light: {
      primary: 'from-green-600 to-emerald-600',
      secondary: 'from-green-50 via-emerald-50 to-lime-50',
      accent: 'bg-emerald-600',
      card: 'bg-white/65',
      text: 'text-slate-700'
    },
    dark: {
      primary: 'from-green-400 to-emerald-400',
      secondary: 'from-gray-900 via-green-900 to-emerald-900',
      accent: 'bg-emerald-500',
      card: 'bg-gray-800/65',
      text: 'text-slate-200'
    }
  },
  sunset: {
    light: {
      primary: 'from-orange-500 to-red-500',
      secondary: 'from-orange-50 via-red-50 to-pink-50',
      accent: 'bg-red-500',
      card: 'bg-white/65',
      text: 'text-slate-700'
    },
    dark: {
      primary: 'from-orange-400 to-red-400',
      secondary: 'from-gray-900 via-red-900 to-pink-900',
      accent: 'bg-red-400',
      card: 'bg-gray-800/65',
      text: 'text-slate-200'
    }
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const stored = localStorage.getItem('attendance-theme-config');
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('attendance-theme-config', JSON.stringify(config));
  }, [config]);

  // Resolve theme based on mode and auto settings
  useEffect(() => {
    const resolveTheme = () => {
      if (config.mode === 'light') return 'light';
      if (config.mode === 'dark') return 'dark';
      
      // Auto mode
      if (config.autoMode) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const [darkHour, darkMin] = config.autoSwitchTime.darkStart.split(':').map(Number);
        const [lightHour, lightMin] = config.autoSwitchTime.lightStart.split(':').map(Number);
        
        const darkMinutes = darkHour * 60 + darkMin;
        const lightMinutes = lightHour * 60 + lightMin;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Handle overnight periods
        if (darkMinutes > lightMinutes) {
          // Dark period crosses midnight (e.g., 18:00 to 06:00)
          return (currentMinutes >= darkMinutes || currentMinutes < lightMinutes) ? 'dark' : 'light';
        } else {
          // Light period crosses midnight (unusual case)
          return (currentMinutes >= lightMinutes && currentMinutes < darkMinutes) ? 'light' : 'dark';
        }
      }
      
      // Fallback to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    setResolvedTheme(resolveTheme());

    // Set up interval for auto mode
    if (config.mode === 'auto' && config.autoMode) {
      const interval = setInterval(resolveTheme, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [config]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    Object.keys(customThemes).forEach(theme => {
      root.classList.remove(`theme-${theme}`);
    });
    
    // Apply current theme classes
    root.classList.add(resolvedTheme);
    root.classList.add(`theme-${config.customTheme}`);
    
    // Set CSS custom properties for the current theme
    const themeColors = customThemes[config.customTheme][resolvedTheme];
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
  }, [resolvedTheme, config.customTheme]);

  const setTheme = (theme: Theme) => {
    setConfig(prev => ({ ...prev, mode: theme }));
  };

  const setCustomTheme = (theme: CustomTheme) => {
    setConfig(prev => ({ ...prev, customTheme: theme }));
  };

  const updateConfig = (newConfig: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const toggleTheme = () => {
    if (config.mode === 'auto') {
      setTheme('light');
    } else if (config.mode === 'light') {
      setTheme('dark');
    } else {
      setTheme('auto');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: config.mode,
        customTheme: config.customTheme,
        resolvedTheme,
        config,
        setTheme,
        setCustomTheme,
        updateConfig,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { customThemes };