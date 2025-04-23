import React, { createContext, useContext, useState, useEffect } from "react";

// Define available themes
export type ThemeName = "cyber" | "matrix" | "ocean" | "blood" | "royal";

// Theme colors
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: {
    main: string;
    sidebar: string;
    card: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Theme data
const themes: Record<ThemeName, ThemeColors> = {
  cyber: {
    primary: "#6a11cb",
    secondary: "#2575fc",
    accent: "#fc25e3",
    background: {
      main: "#0f1225",
      sidebar: "#1a1f38",
      card: "#262b44",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b8bacc",
      accent: "#fc25e3",
    },
    border: "#3a4067",
    success: "#0cdf9a",
    warning: "#ffb347",
    error: "#ff5e5e",
    info: "#0cbedf",
  },
  matrix: {
    primary: "#0D7A0D",
    secondary: "#1FAF1F",
    accent: "#00FF41",
    background: {
      main: "#0a0d0a",
      sidebar: "#0f160f",
      card: "#162616",
    },
    text: {
      primary: "#00FF41",
      secondary: "#0D7A0D",
      accent: "#00FF41",
    },
    border: "#1FAF1F",
    success: "#00FF41",
    warning: "#FFB347",
    error: "#FF5E5E",
    info: "#33B2FF",
  },
  ocean: {
    primary: "#0052D4",
    secondary: "#4364F7",
    accent: "#00CCFF",
    background: {
      main: "#071B2F",
      sidebar: "#0E2A47",
      card: "#113a63",
    },
    text: {
      primary: "#ffffff",
      secondary: "#B4D4FF",
      accent: "#00CCFF",
    },
    border: "#184a7e",
    success: "#0CDF9A",
    warning: "#FFB347",
    error: "#FF5E5E",
    info: "#00CCFF",
  },
  blood: {
    primary: "#8E0E00",
    secondary: "#B22222",
    accent: "#FF3E3E",
    background: {
      main: "#1A0000",
      sidebar: "#2D0A0A",
      card: "#3D1414",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#FFD7D7",
      accent: "#FF3E3E",
    },
    border: "#5E2222",
    success: "#00CC4E",
    warning: "#FFC837",
    error: "#FF2E2E",
    info: "#3E92FF",
  },
  royal: {
    primary: "#B88746",
    secondary: "#D4AF37",
    accent: "#FFD700",
    background: {
      main: "#10151C",
      sidebar: "#1C2331",
      card: "#2A3447",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#E6DFCC",
      accent: "#FFD700",
    },
    border: "#3C465C",
    success: "#00CC4E",
    warning: "#FFAA00",
    error: "#FF5E5E",
    info: "#00A3FF",
  },
};

// Theme context
interface ThemeContextType {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get theme from local storage or use default
  const [theme, setTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem("novaseo-theme");
    return (savedTheme as ThemeName) || "cyber";
  });

  // Update local storage and document classes when theme changes
  useEffect(() => {
    localStorage.setItem("novaseo-theme", theme);
    
    // Set theme class on document
    document.documentElement.classList.remove(
      "theme-cyber",
      "theme-matrix",
      "theme-ocean",
      "theme-blood",
      "theme-royal"
    );
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Set theme color meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themes[theme].primary);
    }
  }, [theme]);

  // Update theme
  const handleSetTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: themes[theme],
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};