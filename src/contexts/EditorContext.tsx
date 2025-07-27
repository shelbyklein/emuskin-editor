// Editor settings context
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);

  const updateSettings = (updates: Partial<EditorSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <EditorContext.Provider value={{ settings, updateSettings }}>
      {children}
    </EditorContext.Provider>
  );
};