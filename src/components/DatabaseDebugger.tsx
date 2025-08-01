// Database debugger component to visualize user database structure
import React, { useState } from 'react';
import { userDatabase } from '../utils/userDatabase';
import { useAuth } from '../contexts/AuthContext';

export const DatabaseDebugger: React.FC = () => {
  const [showDebugger, setShowDebugger] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  const databaseStructure = userDatabase.getDatabaseStructure();
  const currentUserData = userDatabase.getUser(user.email);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebugger(!showDebugger)}
        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
      >
        DB Debug
      </button>

      {showDebugger && (
        <div className="absolute bottom-10 right-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-96 max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">User Database Structure</h3>
          
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-1">Current User:</h4>
            {currentUserData && (
              <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <p>Email: {currentUserData.email}</p>
                <p>Login Count: {currentUserData.loginCount}</p>
                <p>Projects: {currentUserData.projects.length}</p>
                <p>First Login: {new Date(currentUserData.firstLogin).toLocaleString()}</p>
                <p>Last Login: {new Date(currentUserData.lastLogin).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">Full Database:</h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
              {databaseStructure}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};