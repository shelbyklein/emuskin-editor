// Custom hook for managing keyboard shortcuts
import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook for managing keyboard shortcuts
 * @param shortcuts Array of shortcut configurations
 * @param deps Dependency array for the effect
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[], deps: any[] = []) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.tagName === 'SELECT' ||
                        target.isContentEditable;
    
    if (isInputField) {
      return;
    }

    // Check each shortcut configuration
    for (const shortcut of shortcuts) {
      // Skip if shortcut is disabled
      if (shortcut.enabled === false) continue;

      // Check if key matches
      if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

      // Check modifiers
      const modifiers = shortcut.modifiers || {};
      const ctrlPressed = e.ctrlKey || e.metaKey; // Handle both Ctrl and Cmd
      const shiftPressed = e.shiftKey;
      const altPressed = e.altKey;

      // Check if all required modifiers match
      const ctrlMatch = modifiers.ctrl || modifiers.meta ? ctrlPressed : !ctrlPressed;
      const shiftMatch = modifiers.shift ? shiftPressed : !modifiers.shift ? !shiftPressed : true;
      const altMatch = modifiers.alt ? altPressed : !modifiers.alt ? !altPressed : true;

      if (ctrlMatch && shiftMatch && altMatch) {
        // Prevent default if specified
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        
        // Execute handler
        shortcut.handler(e);
        break;
      }
    }
  }, [shortcuts, ...deps]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Helper function to check if a keyboard event matches a shortcut pattern
 */
export const matchesShortcut = (
  e: KeyboardEvent, 
  key: string, 
  modifiers?: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
): boolean => {
  if (e.key.toLowerCase() !== key.toLowerCase()) return false;
  
  const mods = modifiers || {};
  const ctrlPressed = e.ctrlKey || e.metaKey;
  
  const ctrlMatch = mods.ctrl || mods.meta ? ctrlPressed : !ctrlPressed;
  const shiftMatch = mods.shift ? e.shiftKey : !mods.shift ? !e.shiftKey : true;
  const altMatch = mods.alt ? e.altKey : !mods.alt ? !e.altKey : true;
  
  return ctrlMatch && shiftMatch && altMatch;
};