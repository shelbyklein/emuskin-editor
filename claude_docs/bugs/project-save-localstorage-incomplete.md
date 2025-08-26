# Project Save to localStorage Incomplete

## Issue Description
Saving a project doesn't properly save all JSON parameters to localStorage. When loading a saved project, only the game screen displays and it's positioned incorrectly.

## Symptoms
- Project save appears to complete successfully
- On reload/load, only game screen element shows
- Game screen is not positioned correctly
- Other control elements (buttons, d-pad, etc.) are missing
- JSON parameters not fully persisted to localStorage

## Expected Behavior
- All project data should be saved to localStorage
- On load, all controls should be restored in their correct positions
- Game screen should maintain proper positioning

## Current Behavior
- Partial save to localStorage
- Missing control elements on load
- Incorrect game screen positioning

## Context
- Related to save/load functionality in Editor component
- localStorage persistence mechanism not capturing complete project state
- May be related to the console logs showing "Total controls: 0" after save

## Files Likely Involved
- Editor.tsx (save/load logic)
- localStorage utilities
- Project state management

## Priority
High - Core functionality broken, prevents proper project persistence

## Investigation Needed
- Check what data is actually being saved to localStorage
- Verify save operation includes all control mappings
- Confirm load operation properly restores all saved data