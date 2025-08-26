# Active Bugs

## Bug #002: JSON Preview Not Updating When Adding Buttons
**Date Reported:** 2025-08-26  
**Status:** Active  
**Priority:** Medium  
**Component:** JSON Preview / Button Management

### Description
When adding buttons to the skin editor, the JSON preview panel is not updating to reflect the new button configurations. The buttons appear to be added to the canvas/UI but the corresponding JSON structure is not being displayed in the preview.

### Steps to Reproduce
1. Open the Editor with a project
2. Add buttons to the canvas (drag from button palette or create new buttons)
3. Check the JSON preview panel
4. Observe that the JSON preview does not show the newly added button configurations

### Expected Behavior
- JSON preview should update in real-time when buttons are added
- New button entries should appear in the "items" array of the JSON structure
- Button properties (frame, inputs, etc.) should be visible in the preview

### Actual Behavior
- JSON preview remains unchanged when buttons are added
- Button data may not be properly synchronized with the JSON generation logic

### Technical Investigation Needed
- Check if button state updates are triggering JSON regeneration
- Verify the connection between button management and JSON preview components
- Investigate if there's a missing dependency or state synchronization issue
- Look for console errors related to JSON generation

### Affected Files (Suspected)
- Components handling JSON preview generation
- Button management logic
- State synchronization between canvas and preview

### Priority Justification
Medium priority as this affects the core functionality of the JSON preview feature, which is essential for users to verify their skin configurations before export.

---