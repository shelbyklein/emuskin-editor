# Image Base64 Conversion for Storage and Export

## Issue
Images that are uploaded need to be converted to base64 so they can be saved with the app. When exported, the images need to be converted back to PNG format for inclusion in the skin file.

## Status
- **Priority**: Medium
- **Type**: Feature Enhancement / Storage Issue
- **Created**: 2025-08-26

## Requirements
1. Convert uploaded images to base64 format for storage with project data
2. Store base64 data persistently (localStorage/cloud storage)
3. During export, convert base64 back to PNG blob for ZIP file inclusion
4. Maintain image quality during conversion process
5. Handle both background images and thumbstick images
6. Support both portrait and landscape orientations

## Technical Notes
- **Components**: ImageUploader, ExportButton, ProjectContext
- **Storage**: Currently using blob URLs which don't persist
- **Export**: Need to convert base64 → PNG blob for ZIP inclusion
- **File types**: PNG format (existing requirement)
- **Size considerations**: Base64 increases size by ~33%, consider compression

## Current Behavior
- Images are stored as blob URLs
- Blob URLs don't persist between sessions
- Export may fail if blob URLs are invalid

## Expected Outcome
- Images persist correctly between sessions
- Successful export with proper PNG files in ZIP
- No broken image references after app restart
- Consistent behavior across all image types (background, thumbstick)

## Implementation Notes
- Use FileReader API for base64 conversion on upload
- Store base64 strings in project data structure
- Convert base64 to Blob during export process
- Update both localStorage and cloud storage paths
- Consider image compression to reduce storage size