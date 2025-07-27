# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile-first web application for creating custom emulator skin files (.deltaskin/.gammaskin). Users visually define control mappings over skin images without writing JSON directly.

## Core Concepts

- **Skins**: Visual appearance provided by uploaded images
- **Controls**: Button mappings that define interaction zones (not visual styling)
- **Systems**: Supported consoles from gameTypeIdentifiers.json (gbc, gba, nds, nes, snes, n64, sg, ps1)
- **Devices**: iPhone models from iphone-sizes.json defining skin dimensions

## Key Data Files

- `assets/gameTypeIdentifiers.json`: Console systems with identifiers and shortnames
- `assets/iphone-sizes.json`: iPhone models with logical/physical dimensions and PPI
- `assets/available_buttons.json`: System-specific button mappings
- `assets/console-aspect-ratios.json`: Display aspect ratios for each console
- `assets/default_config.json`: Template for skin JSON structure with default values

## Architecture Notes

### Control Mapping System
- Users give the skin a name
- Users give the skin an "identifier", which uses Apple's reverse domain name notation (for example, "com.playcase.default.skin")
- Users select system, which loads appropriate buttons from available_buttons.json
- Controls can be standard buttons, D-pad (composite or individual), thumbsticks, or custom composite buttons
- Custom buttons allow multiple simultaneous actions (e.g., A+B together)

### Canvas Rendering
- Canvas dimensions match selected iPhone model specifications
- Control zones rendered as overlays on uploaded skin images
- Supports drag-and-drop positioning with resize handles

### JSON Generation
- Generates JSON with gameTypeIdentifier, device specs, and control mappings
- Pixel-perfect coordinates based on device dimensions
- Supports both visual editing and raw JSON view
- Uses default_config.json as the base template structure
- Populates mappingSize based on selected iPhone model
- Items array contains control definitions with position and mapping data

## Development Setup

This is currently a planning-stage project. The MVP will be:
- Frontend-only (no backend required)
- Uses LocalStorage/IndexedDB for persistence  
- Client-side ZIP generation for exports
- Built with React/Vue/Angular + mobile-first CSS framework

## Custom Button Implementation

When implementing custom buttons:
- Allow users to name their custom button
- Support multiple button inputs (e.g., ["a", "b"] for A+B)
- Consider timing options (simultaneous vs sequential)
- Generate unique identifiers for custom buttons

## JSON Structure

The generated JSON follows the structure in default_config.json:
- `name`: Skin name
- `identifier`: Unique identifier (default: "com.playcase.default.skin")
- `gameTypeIdentifier`: Set from selected console system
- `representations.iphone.edgeToEdge.portrait`:
  - `assets`: Image file references
  - `items`: Array of control definitions
  - `mappingSize`: Width/height from selected iPhone model
  - `extendedEdges`: Edge padding (default: 5px except top: 0px)

## File Export

Final output is a .zip renamed to .deltaskin or .gammaskin containing:
- JSON configuration following default_config.json structure
- All uploaded image assets
- Control mappings in the items array