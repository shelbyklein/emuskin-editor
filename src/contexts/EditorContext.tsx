// Editor settings context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EditorSettings {
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

interface EditorContextType {
  settings: EditorSettings;
  updateSettings: (updates: Partial<EditorSettings>) => void;
}

const defaultSettings: EditorSettings = {
  gridEnabled: true,
  gridSize: 10,
  snapToGrid: true,
};

const SETTINGS_STORAGE_KEY = 'emuskin-editor-settings';

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};

interface EditorProviderProps {
  children: ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  // Initialize settings from localStorage or use defaults
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load editor settings:', error);
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save editor settings:', error);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<EditorSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <EditorContext.Provider value={{ settings, updateSettings }}>
      {children}
    </EditorContext.Provider>
  );
};