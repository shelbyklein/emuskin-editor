// Database debugger component to visualize user database structure
import React, { useState, useEffect } from 'react';
import { userDatabase } from '../utils/userDatabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAllLocalStorageProjects } from '../utils/localStorageProjects';

export const DatabaseDebugger: React.FC = () => {
  const [showDebugger, setShowDebugger] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<'userdb' | 'localstorage' | 'all'>('all');
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  if (!user) return null;

  const databaseStructure = userDatabase.getDatabaseStructure();
  const currentUserData = userDatabase.getUser(user.email);
  const localStorageProjects = getAllLocalStorageProjects();

  // Get all localStorage keys that start with 'emuskin'
  const getEmuskinLocalStorageKeys = () => {
    return Object.keys(localStorage).filter(key => key.startsWith('emuskin'));
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to delete ALL projects from the database? This cannot be undone!')) {
      return;
    }

    setIsResetting(true);
    try {
      // 1. Clear MongoDB
      const token = localStorage.getItem('emuskin-auth-token');
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token?.replace(/"/g, '')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset MongoDB');
      }

      const result = await response.json();
      
      // 2. Clear userDatabase projects for current user
      userDatabase.clearUserProjects(user.email);
      
      // 3. Clear all localStorage projects
      const localStorageKeys = getEmuskinLocalStorageKeys();
      const projectKeys = localStorageKeys.filter(key => key.startsWith('emuskin_local_project_'));
      projectKeys.forEach(key => localStorage.removeItem(key));
      
      showSuccess(`Complete reset! MongoDB: ${result.projectsDeleted} projects deleted. LocalStorage: ${projectKeys.length} projects cleared.`);
      
      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Reset error:', error);
      showError('Failed to complete reset');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearUserDatabase = () => {
    if (!confirm('Clear all project references from userDatabase? This will NOT delete actual projects.')) {
      return;
    }
    
    userDatabase.clearUserProjects(user.email);
    showSuccess('User database project references cleared');
    setShowDebugger(false);
    setTimeout(() => setShowDebugger(true), 100); // Force re-render
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebugger(!showDebugger)}
        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
      >
        DB Debug
      </button>

      {showDebugger && (
        <div className="absolute bottom-10 right-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-[500px] max-h-[600px] overflow-auto">
          <h3 className="font-bold mb-4">Database Debugger</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all' 
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('userdb')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'userdb' 
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              User Database
            </button>
            <button
              onClick={() => setActiveTab('localstorage')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'localstorage' 
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              LocalStorage
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {/* Current User Summary */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Current User Summary:</h4>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>UserDB Projects:</strong> {currentUserData?.projects.length || 0}</p>
                  <p><strong>LocalStorage Projects:</strong> {localStorageProjects.length}</p>
                  <p><strong>Login Count:</strong> {currentUserData?.loginCount || 0}</p>
                </div>
              </div>

              {/* Data Sources Status */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Data Sources:</h4>
                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <span>MongoDB (Cloud)</span>
                    <span className="text-green-600 dark:text-green-400">Connected</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <span>User Database (localStorage)</span>
                    <span className="text-blue-600 dark:text-blue-400">{Object.keys(JSON.parse(databaseStructure)).length} users</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <span>Project Storage (localStorage)</span>
                    <span className="text-blue-600 dark:text-blue-400">{localStorageProjects.length} projects</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'userdb' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm">User Database Structure:</h4>
                <button
                  onClick={handleClearUserDatabase}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                >
                  Clear Project Refs
                </button>
              </div>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                {databaseStructure}
              </pre>
            </div>
          )}

          {activeTab === 'localstorage' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm mb-2">LocalStorage Data:</h4>
              
              {/* LocalStorage Projects */}
              <div>
                <h5 className="text-xs font-medium mb-1">Projects ({localStorageProjects.length}):</h5>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-40 overflow-y-auto">
                  {localStorageProjects.length > 0 ? (
                    <ul className="space-y-1">
                      {localStorageProjects.map(project => (
                        <li key={project.id} className="flex justify-between">
                          <span>{project.name}</span>
                          <span className="text-gray-500">ID: {project.id}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No local projects</p>
                  )}
                </div>
              </div>

              {/* All Emuskin Keys */}
              <div>
                <h5 className="text-xs font-medium mb-1">All Emuskin Keys:</h5>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-40 overflow-y-auto">
                  <ul className="space-y-0.5">
                    {getEmuskinLocalStorageKeys().map(key => (
                      <li key={key} className="font-mono text-xs">{key}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TEMPORARY RESET BUTTON - REMOVE AFTER USE */}
          <div className="mt-6 pt-4 border-t border-red-300 dark:border-red-700">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              {isResetting ? 'Resetting...' : '🗑️ COMPLETE RESET (MongoDB + LocalStorage)'}
            </button>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              This will delete ALL projects from MongoDB AND clear localStorage data!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};