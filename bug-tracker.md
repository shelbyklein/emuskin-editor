# Bug Tracker

This file tracks known bugs and issues in the Emuskin Generator project.

## Bug Format
Each bug entry should include:
- **ID**: Unique identifier (BUG-XXX)
- **Date Reported**: When the bug was discovered
- **Status**: Open, In Progress, Fixed, Won't Fix
- **Priority**: Critical, High, Medium, Low
- **Component**: Which part of the app is affected
- **Description**: Clear description of the issue
- **Steps to Reproduce**: How to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Notes**: Any additional context or workarounds

---

## Active Bugs

(No active bugs currently tracked)

---

## Fixed Bugs

### BUG-001: Nintendo DS Screen Management Issues
- **Date Reported**: 2024-01-29
- **Status**: Fixed
- **Priority**: High
- **Component**: Screen Management / Canvas
- **Description**: When working with Nintendo DS skins, there are several issues with managing the dual screens
- **Steps to Reproduce**:
  1. Create a new skin and select Nintendo DS as the console
  2. The system auto-creates two screens (Top Screen and Bottom Screen)
  3. Try to delete or modify individual screens
  4. Switch to another console and back to DS
- **Expected Behavior**: 
  - DS should always have exactly 2 screens
  - Screens should maintain proper positioning when switching consoles
  - User should not be able to delete DS screens (only reposition/resize)
- **Actual Behavior**:
  - Users can delete individual DS screens, leaving only one
  - Switching consoles and back to DS creates duplicate screens
  - No validation to ensure DS always has 2 screens
- **Fixed In**: Implemented DS screen protection - screens cannot be deleted
- **Notes**: 
  - DS screens are now marked as non-deletable
  - Visual indicator shows DS screens are required
  - Alert prevents deletion attempts
  - Screen clearing when console changes prevents invalid configurations


### BUG-000: Example Bug (Template)
- **Date Reported**: YYYY-MM-DD
- **Status**: Fixed
- **Priority**: Low
- **Component**: Example
- **Description**: This is a template for documenting fixed bugs
- **Steps to Reproduce**: N/A
- **Expected Behavior**: N/A
- **Actual Behavior**: N/A
- **Fixed In**: Commit hash or version
- **Notes**: Keep fixed bugs for reference

---

## Bug Statistics
- **Total Open Bugs**: 0
- **Critical**: 0
- **High**: 0
- **Medium**: 0
- **Low**: 0

Last Updated: 2025-01-05