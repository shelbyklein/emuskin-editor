# Custom Agents for Emulator Skin Generator

This directory contains specialized agents to assist with different aspects of the project development.

## Available Agents

### 1. UI Designer (`/ui-designer`)
Specializes in mobile-first UI/UX design for the control mapping interface.
- Use when: Designing new UI components or improving existing interfaces
- Expertise: Touch interactions, responsive design, canvas-based editors

### 2. Skin JSON Validator (`/skin-json-validator`)
Validates generated JSON files against Delta/Gamma skin specifications.
- Use when: Implementing JSON generation or debugging export issues
- Expertise: File format validation, schema compliance, error reporting

### 3. Canvas Optimization (`/canvas-optimization`)
Optimizes canvas rendering performance for smooth interactions.
- Use when: Implementing canvas features or addressing performance issues
- Expertise: Canvas API, touch events, memory management, rendering optimization

### 4. Testing Coordinator (`/testing-coordinator`)
Creates comprehensive test plans for all features.
- Use when: Adding new features or preparing for testing phases
- Expertise: Mobile testing, touch interactions, file validation, cross-device compatibility

## Usage

To use an agent, invoke it with:
```
/agent-name
```

For example:
- `/ui-designer` - Get UI/UX recommendations
- `/skin-json-validator` - Validate JSON output
- `/canvas-optimization` - Optimize rendering performance
- `/testing-coordinator` - Create test plans

Each agent has specific domain knowledge about the emulator skin generator project and will provide targeted assistance in their area of expertise.