// Test page to verify minimal save format
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContextV3';

const TestSaveFormat: React.FC = () => {
  const { projects, createProject, saveOrientationData } = useProject();
  const [testResult, setTestResult] = useState<string>('');
  
  const runTest = () => {
    setTestResult('Running test...\n');
    
    // Create a test project
    const projectId = createProject('Test Project', {
      identifier: 'com.test.skin',
      console: { console: 'Game Boy Color', gameTypeIdentifier: 'com.delta.game.gbc', shortName: 'GBC' },
      device: { model: 'iPhone 13', logicalWidth: 390, logicalHeight: 844, physicalWidth: 1170, physicalHeight: 2532, ppi: 460 }
    });
    
    setTestResult(prev => prev + `Created project: ${projectId}\n`);
    
    // Add some controls
    saveOrientationData({
      controls: [
        {
          id: 'test-1',
          inputs: ['a'],
          frame: { x: 100, y: 200, width: 50, height: 50 },
          label: 'A'
        },
        {
          id: 'test-2',
          inputs: ['b'],
          frame: { x: 160, y: 200, width: 50, height: 50 },
          label: 'B'
        }
      ]
    });
    
    setTestResult(prev => prev + 'Added controls\n');
    
    // Check localStorage
    const v2Data = localStorage.getItem('emuskin-projects-v2');
    if (v2Data) {
      const parsed = JSON.parse(v2Data);
      setTestResult(prev => prev + `\nStored data:\n${JSON.stringify(parsed, null, 2)}\n`);
      
      // Check what's NOT stored (UI state)
      const hasUIState = JSON.stringify(parsed).includes('"id":"test-1"') || 
                        JSON.stringify(parsed).includes('"label":"A"');
      
      setTestResult(prev => prev + `\nUI state stripped: ${!hasUIState ? 'YES ✓' : 'NO ✗'}\n`);
      setTestResult(prev => prev + `Data size: ${v2Data.length} bytes\n`);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Save Format Test</h1>
      
      <div className="mb-4">
        <button
          onClick={runTest}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Test
        </button>
      </div>
      
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
        {testResult || 'Click "Run Test" to verify the minimal save format'}
      </pre>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Current Projects ({projects.length}):</h2>
        <ul className="list-disc pl-5">
          {projects.map(p => (
            <li key={p.id}>
              {p.name} - {p.console?.shortName || 'No console'} - {p.device?.model || 'No device'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TestSaveFormat;