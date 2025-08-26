# Save Button Resets Element Positions

## Issue Description
When editing a skin and clicking 'save', the button elements move back to the position they were in when the file was opened and/or the elements are removed entirely.

## Symptoms
- User moves controls/buttons to new positions on canvas
- User clicks the 'save' button
- Button elements jump back to their original positions from when project was opened
- OR elements disappear completely
- Changes made during editing session are lost visually

## Expected Behavior
- Save button should preserve current element positions
- Controls should remain in their edited positions after save
- All elements should stay visible and in place after save operation

## Current Behavior
- Elements reset to previous positions
- Some elements may disappear
- User edits are visually lost despite save operation

## Context
- Occurs during skin editing workflow
- Related to save functionality in Editor component
- May be connected to the recently fixed localStorage race condition
- Could be a state management issue between UI and saved data

## Files Likely Involved
- Editor.tsx (save/load logic)
- Canvas component (element positioning)
- ProjectContext.tsx (project state management)
- Element update handlers

## Priority
High - Core editing functionality broken, prevents users from saving their work properly

## Investigation Needed
- Check if save operation is correctly capturing current element positions
- Verify load operation after save restores correct positions
- Examine state synchronization between canvas and save data
- Look for race conditions in element position updates during save

## Reproduction Steps
1. Open existing skin project OR create new project
2. Add some controls/buttons to canvas
3. Move controls to different positions
4. Click 'save' button
5. Observe elements jumping back to original positions or disappearing

## Date Reported
2025-08-26