// Dialog for migrating local projects to cloud when user logs in
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContextHybrid';
import { getAllLocalStorageProjects } from '../utils/localStorageProjects';
import ConsoleIcon from './ConsoleIcon';

interface MigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const MigrationDialog: React.FC<MigrationDialogProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { migrateLocalProjectsToCloud } = useProject();
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      // Load local projects when dialog opens
      const projects = getAllLocalStorageProjects();
      setLocalProjects(projects);
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen || localProjects.length === 0) return null;

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const migratedCount = await migrateLocalProjectsToCloud();
      setMigrationComplete(true);
      
      // Auto-close after successful migration
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {migrationComplete ? 'Migration Complete!' : 'Migrate Your Local Projects'}
          </h2>
          {!migrationComplete && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We found {localProjects.length} project{localProjects.length > 1 ? 's' : ''} saved locally. 
              Would you like to save {localProjects.length > 1 ? 'them' : 'it'} to your account?
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {migrationComplete ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg text-gray-900 dark:text-white">
                Your projects have been successfully migrated to the cloud!
              </p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                You can now access them from any device.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {localProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    {project.console && (
                      <ConsoleIcon console={project.console.shortName} className="w-8 h-8 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {project.name || 'Untitled Skin'}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last modified: {new Date(project.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="text-xs font-medium">Local</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>What happens during migration?</span>
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your projects will be uploaded to your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Local copies will be removed to avoid duplicates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You'll be able to access them from any device</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>All project data and images will be preserved</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!migrationComplete && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleSkip}
                disabled={isMigrating}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isMigrating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Migrate to Cloud</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationDialog;