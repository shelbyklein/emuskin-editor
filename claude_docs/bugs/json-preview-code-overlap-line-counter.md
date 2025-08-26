# JSON Preview Code Element Overlaps Line Counter

## Issue
In the JSON preview component, the `<code>` element needs margin on the left so it doesn't overlap with the line counter. Currently, the line numbers and the JSON code text are overlapping, making both difficult to read.

## Status
- **Priority**: Low
- **Type**: UI/UX Bug
- **Created**: 2025-08-26

## Requirements
1. Add left margin to the `<code>` element in JsonPreview component
2. Ensure line numbers are clearly separated from JSON content
3. Maintain readability of both line numbers and JSON code
4. Test in both light and dark modes

## Technical Notes
- **Component**: JsonPreview.tsx
- **Element**: `<code>` element inside the `<pre>` tag
- **Issue**: Line numbers overlay the JSON text content
- **Solution**: Add appropriate left margin/padding to code element

## Expected Outcome
- Clear visual separation between line numbers and JSON code
- Both line numbers and JSON content are fully readable
- No overlapping text in JSON preview panel
- Consistent spacing in both light and dark themes