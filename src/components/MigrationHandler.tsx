// Component to handle migration from v1 to v2 on startup
import React, { useEffect, useState } from 'react';
import { migrateProjectsToV2, needsMigration } from '../utils/projectMigration';

interface MigrationHandlerProps {
  children: React.ReactNode;
}

export const MigrationHandler: React.FC<MigrationHandlerProps> = ({ children }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  
  useEffect(() => {
    const handleMigration = async () => {
      if (needsMigration()) {
        setIsMigrating(true);
        
        try {
          const success = migrateProjectsToV2();
          if (success) {
            console.log('Successfully migrated projects to v2 format');
          }
        } catch (error) {
          console.error('Migration failed:', error);
        }
        
        setIsMigrating(false);
      }
    };
    
    handleMigration();
  }, []);
  
  if (isMigrating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Migrating your projects to the new format...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};