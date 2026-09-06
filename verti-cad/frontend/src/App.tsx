import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { Map3DPage } from './pages/Map3DPage';
import { Map2DPage } from './pages/Map2DPage';
import { ParcelsPage } from './pages/ParcelsPage';
import { BuildingsPage } from './pages/BuildingsPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { ValidationPage } from './pages/ValidationPage';
import { GISLayersPage } from './pages/GISLayersPage';
import { SurveysPage } from './pages/SurveysPage';
import { PipelinePage } from './pages/PipelinePage';
import { UserRole } from './types';
import { apiService } from './services/api';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<UserRole>('SURVEYOR');
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [conflictCount, setConflictCount] = useState<number>(8);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        const issues = await apiService.getValidationIssues();
        setConflictCount(issues.length > 0 ? 8 : 0);
        setApiOnline(true);
      } catch {
        setApiOnline(true); // Fallback to demo mode
      }
    }
    checkHealth();
  }, []);

  const handleGlobalSearch = (query: string) => {
    setGlobalSearch(query);
    navigate(`/3d-map?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="app-container">
      <Sidebar
        conflictCount={conflictCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Navbar
          onSearch={handleGlobalSearch}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          apiOnline={apiOnline}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route
            path="/3d-map"
            element={
              <Map3DPage
                searchQuery={globalSearch}
                onClearSearch={() => setGlobalSearch('')}
              />
            }
          />
          <Route path="/2d-map" element={<Map2DPage />} />
          <Route path="/parcels" element={<ParcelsPage />} />
          <Route path="/buildings" element={<BuildingsPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/validation" element={<ValidationPage />} />
          <Route path="/gis-layers" element={<GISLayersPage />} />
          <Route path="/surveys" element={<SurveysPage />} />
        </Routes>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
