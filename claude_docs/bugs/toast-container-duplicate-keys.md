# Toast Container Duplicate Keys Warning

## Issue Description
React warning about duplicate keys in ToastContainer component causing potential rendering issues.

## Error Details
```
Warning: Encountered two children with the same key, `1756191233796`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

## Stack Trace
```
Error Component Stack
    at div (<anonymous>)
    at ToastContainer (ToastContainer.tsx:10:58)
    at ToastProvider (ToastContext.tsx:35:63)
    at ThemeProvider (ThemeContext.tsx:19:74)
    at div (<anonymous>)
    at App (<anonymous>)
    at ErrorBoundary (ErrorBoundary.tsx:14:5)
```

## Context
- Occurs during save operations in the skin editor
- Warning appears twice in succession
- Related to toast notifications after successful project save
- Key appears to be timestamp-based: `1756191233796`

## Reproduction Steps
1. Load the application
2. Upload a skin image
3. Click save button
4. Toast notifications appear with duplicate keys

## Files Involved
- `ToastContainer.tsx:10:58`
- `ToastContext.tsx:35:63`

## Priority
Medium - Warning only, but could lead to rendering issues

## Potential Cause
Toast notifications being generated with identical timestamps, causing key collisions in the React reconciliation process.