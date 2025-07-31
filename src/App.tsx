// Main App component with routing setup
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { EditorProvider } from './contexts/EditorContext';
import { ProjectProvider } from './contexts/ProjectContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import About from './pages/About';

function App() {
  return (
    <div id="app-root">
      <ThemeProvider>
        <AuthProvider>
          <ProjectProvider>
            <EditorProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="editor" element={<Editor />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="about" element={<About />} />
                  </Route>
                </Routes>
              </Router>
            </EditorProvider>
          </ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;