// Main App component with routing setup
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { EditorProvider } from './contexts/EditorContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import About from './pages/About';
import TestSaveFormat from './pages/TestSaveFormat';
import TestSkin from './pages/TestSkin';

function App() {
  return (
    <div id="app-root">
      <ThemeProvider>
        <ToastProvider>
          <ProjectProvider>
            <EditorProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Editor />} />
                    <Route path="editor" element={<Editor />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="about" element={<About />} />
                    <Route path="test" element={<TestSaveFormat />} />
                    <Route path="test/:projectId" element={<TestSkin />} />
                  </Route>
                </Routes>
              </Router>
            </EditorProvider>
          </ProjectProvider>
        </ToastProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;