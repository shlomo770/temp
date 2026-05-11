import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import ModeSelector from './components/ModeSelection/ModeSelector';
import MainApp from './components/MainApp';

function App() {
  const selectedMode = useSelector((state: RootState) => state.systemState.selectedMode);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            selectedMode ? <Navigate to="/map" replace /> : <ModeSelector />
          } />
          <Route path="/mode" element={
            <ModeSelector />
          } />
          <Route path="/map" element={
            selectedMode ? <MainApp /> : <Navigate to="/mode" replace />

          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;