# Skin Name Not Updating After Save

## Issue Summary
When changing the name of a skin (e.g., away from "New Skin") and saving, the name doesn't update in the UI. The name should be reflected in both the JSON preview and the title UI element after saving.

## Steps to Reproduce
1. Create a new skin (defaults to "New Skin")
2. Change the skin name to something else (e.g., "My Custom Skin")
3. Save the project
4. Observe that the name doesn't update in:
   - JSON preview panel
   - Title UI element

## Expected Behavior
- After saving, the new skin name should be visible in the JSON preview
- The title UI element should reflect the updated name
- All UI components should show the current skin name consistently

## Current Behavior
- The name remains as "New Skin" in UI elements
- JSON preview may not reflect the updated name
- Inconsistent name display across the interface

## Affected Components
- JSON preview panel
- Title/header UI element
- Possibly other name display locations

## Priority
**MEDIUM** - UI consistency issue that affects user experience

## Technical Notes
This appears to be a state synchronization issue where:
1. The name is saved to storage correctly
2. But UI components are not re-rendering with the updated name
3. May need to check state updates in ProjectContext or relevant components

## Related Files
- JSON preview component
- Title/header component  
- ProjectContext state management
- Save/update logic in Editor

## Date Created
2025-08-26