// Main App component with routing setup
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { EditorProvider } from './contexts/EditorContext';
import { ProjectProvider } from './contexts/ProjectContextV2';
import { MigrationHandler } from './components/MigrationHandler';
import Layout from './components/Layout';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import About from './pages/About';
import TestSaveFormat from './pages/TestSaveFormat';

function App() {
  return (
    <div id="app-root">
      <ThemeProvider>
        <AuthProvider>
          <MigrationHandler>
            <ProjectProvider>
              <EditorProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="editor" element={<Editor />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="about" element={<About />} />
                      <Route path="test" element={<TestSaveFormat />} />
                    </Route>
                  </Routes>
                </Router>
              </EditorProvider>
            </ProjectProvider>
          </MigrationHandler>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;