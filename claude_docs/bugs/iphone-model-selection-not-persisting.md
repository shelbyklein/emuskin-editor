# Active Bugs

## Bug #001: iPhone Model Selection Not Persisting
**Date Reported:** 2025-08-26  
**Status:** Fixed  
**Priority:** High  
**Component:** SkinEditPanel / Editor

### Description
When changing the iPhone model in the SkinEditPanel and clicking 'Save', the selection does not persist. The UI reverts back to iPhone 16 Pro Max (the first device in the selection list) instead of maintaining the user's selected device.

### Steps to Reproduce
1. Open the Editor with an existing project
2. Click the settings/edit button to open SkinEditPanel
3. Select a different iPhone model (e.g., iPhone 15 or iPhone 14)
4. Click "Save Settings"
5. Observe that the device selection reverts to iPhone 16 Pro Max

### Root Cause Analysis
1. **Race condition in Editor.tsx (line 173-403)**: The useEffect that loads currentProject data includes `saveProject` in its dependency array, causing it to re-run when saveProject is called from SkinEditPanel
2. **State synchronization issue**: The device update from SkinEditPanel may not be reflected in currentProject when the useEffect re-runs
3. **Default device logic (line 656-657)**: Sets devices[0] (iPhone 16 Pro Max) as default when no device is selected

### Technical Details
- **Affected Files:**
  - `src/pages/Editor.tsx` (lines 173-403, 656-657, 1738-1784)
  - `src/components/SkinEditPanel.tsx` (lines 108-150)
- **Key Issue:** The useEffect at line 173 with dependency `[currentProject, currentProject?.currentOrientation, getOrientationData, saveProject]` re-runs when saveProject is called, potentially resetting the device before the new value is properly saved

### Proposed Fix
1. Remove `saveProject` from the useEffect dependency array to prevent re-runs during save operations
2. Add a ref flag to track when device selection is being updated to prevent overwrites
3. Improve the "isJustTimestampUpdate" check (lines 184-194) to properly handle device changes
4. Consider debouncing or using a more controlled update pattern for device selection

### Workaround
Currently, users may need to save the settings twice or refresh the page after saving to see the correct device selection.

### Related Code Snippets
```typescript
// Editor.tsx line 173-403 - problematic useEffect
useEffect(() => {
  // ... 
  if (devices.length > 0 && currentProject.device) {
    // First, set the stored device as default
    setSelectedDevice(currentProject.device.model); // line 302
    setSelectedDeviceData(currentProject.device);
    // ... auto-detection logic that may override ...
  }
}, [currentProject, currentProject?.currentOrientation, getOrientationData, saveProject]); // saveProject in deps causes re-run
```

---

### Resolution (2025-08-26)

**Fixed by removing the race condition and improving device state management:**

1. **Removed `saveProject` from useEffect dependency array (line 403)**: This was causing the useEffect to re-run every time saveProject was called, creating a race condition where the useEffect would overwrite the device selection mid-update.

2. **Enhanced isJustTimestampUpdate check (lines 184-193)**: Added check against `latestSkinData.current.device` to account for device changes that might be in progress, preventing unnecessary re-loads during updates.

3. **Added device selection safety guard (lines 305-311)**: The useEffect now prioritizes `latestSkinData.current.device` over `currentProject.device.model` to prevent overwriting user selections during save operations.

**Files Modified:**
- `src/pages/Editor.tsx` - Fixed useEffect dependency array and improved state synchronization

**Testing:** Code compiles successfully with hot reload. The race condition is eliminated by removing the circular dependency between saveProject and the useEffect.

---