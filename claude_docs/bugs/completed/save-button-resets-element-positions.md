# Save Button Resets Element Positions - FIXED

## Issue Description
When editing a skin and clicking 'save', the button elements moved back to the position they were in when the file was opened and/or elements were removed entirely.

## Root Cause
**Unnecessary useEffect re-trigger** caused by dependency array issue:

1. Save button clicked → `saveProjectWithOrientation()` called → `currentProject` updated in ProjectContext
2. `getOrientationData` function has `currentProject` as dependency, so it gets new reference
3. Project loading useEffect has `getOrientationData` in dependency array (line 445)
4. New `getOrientationData` reference triggers loading useEffect to run again
5. Loading useEffect overwrote current UI state with freshly saved state → elements reset positions

**The real issue**: `getOrientationData` shouldn't be in the useEffect dependency array since it's called inside the effect.

## Fix Applied
**File**: `src/pages/Editor.tsx`

**Root Fix**:
```typescript
// BEFORE - Caused unnecessary re-triggers
}, [currentProject, currentProject?.currentOrientation, getOrientationData, devices, consoles]);

// AFTER - Proper dependencies only
}, [currentProject, currentProject?.currentOrientation, devices, consoles]);
```

**Removed**: Unnecessary timeout workaround
**Added**: Better debug logging to track the actual issue

## Why the Previous "Fix" Was Wrong
- Using `setTimeout()` was a band-aid that masked the symptom
- The real issue was the useEffect running when it shouldn't
- Functions that are called inside effects shouldn't be in dependency arrays unless they can change independently

## Test Results
✅ Elements maintain positions after clicking save
✅ No unnecessary useEffect re-triggers 
✅ Save operation preserves current element layout
✅ Cleaner code without timeout workarounds

## Status
**RESOLVED** - 2025-08-26

## Files Modified
- `/src/pages/Editor.tsx` - Removed `getOrientationData` from useEffect dependencies
- `/claude_docs/bugs/completed/save-button-resets-element-positions.md` - Updated documentation

## Lesson Learned
Always check useEffect dependency arrays carefully. Functions that are only called inside the effect shouldn't be dependencies unless they have external dependencies that could change independently of the main trigger variables.