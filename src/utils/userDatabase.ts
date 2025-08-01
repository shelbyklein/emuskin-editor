// User database for tracking users and their projects
// Structure: userEmail -> { loginCount, lastLogin, projects: [...] }

interface UserData {
  email: string;
  loginCount: number;
  lastLogin: number;
  firstLogin: number;
  projects: string[]; // Array of project IDs
}

interface UserDatabase {
  users: Record<string, UserData>;
}

const DB_KEY = 'emuskin-user-database';

class UserDatabaseManager {
  private db: UserDatabase;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): UserDatabase {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user database:', error);
    }
    return { users: {} };
  }

  private saveDatabase(): void {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.db));
      console.log('User database saved:', this.db);
    } catch (error) {
      console.error('Failed to save user database:', error);
    }
  }

  // Record user login - creates user entry if doesn't exist
  recordLogin(email: string): UserData {
    if (!this.db.users[email]) {
      // First time user
      this.db.users[email] = {
        email,
        loginCount: 1,
        firstLogin: Date.now(),
        lastLogin: Date.now(),
        projects: []
      };
      console.log(`New user created in database: ${email}`);
    } else {
      // Existing user
      this.db.users[email].loginCount++;
      this.db.users[email].lastLogin = Date.now();
      console.log(`User login recorded: ${email} (login #${this.db.users[email].loginCount})`);
    }
    
    this.saveDatabase();
    return this.db.users[email];
  }

  // Add project to user
  addProjectToUser(email: string, projectId: string): void {
    if (!this.db.users[email]) {
      console.error(`User ${email} not found in database`);
      return;
    }

    if (!this.db.users[email].projects.includes(projectId)) {
      this.db.users[email].projects.push(projectId);
      console.log(`Project ${projectId} added to user ${email}`);
      this.saveDatabase();
    }
  }

  // Remove project from user
  removeProjectFromUser(email: string, projectId: string): void {
    if (!this.db.users[email]) {
      console.error(`User ${email} not found in database`);
      return;
    }

    const index = this.db.users[email].projects.indexOf(projectId);
    if (index > -1) {
      this.db.users[email].projects.splice(index, 1);
      console.log(`Project ${projectId} removed from user ${email}`);
      this.saveDatabase();
    }
  }

  // Get user data
  getUser(email: string): UserData | null {
    return this.db.users[email] || null;
  }

  // Get all users (for admin/debugging)
  getAllUsers(): UserData[] {
    return Object.values(this.db.users);
  }

  // Get user's projects
  getUserProjects(email: string): string[] {
    return this.db.users[email]?.projects || [];
  }

  // Get database structure for debugging
  getDatabaseStructure(): string {
    const structure: any = {};
    for (const [email, userData] of Object.entries(this.db.users)) {
      structure[email] = {
        loginCount: userData.loginCount,
        projectCount: userData.projects.length,
        projects: userData.projects
      };
    }
    return JSON.stringify(structure, null, 2);
  }

  // Migrate existing projects to user database
  migrateUserProjects(email: string, projectIds: string[]): void {
    if (!this.db.users[email]) {
      console.error(`User ${email} not found in database`);
      return;
    }

    let added = 0;
    for (const projectId of projectIds) {
      if (!this.db.users[email].projects.includes(projectId)) {
        this.db.users[email].projects.push(projectId);
        added++;
      }
    }

    if (added > 0) {
      console.log(`Migrated ${added} projects to user ${email}`);
      this.saveDatabase();
    }
  }
}

// Export singleton instance
export const userDatabase = new UserDatabaseManager();