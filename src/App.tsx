import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { LogScreen } from './screens/LogScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { SessionScreen } from './screens/SessionScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/log" element={<LogScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/history/:exerciseId" element={<ExerciseScreen />} />
        <Route path="/session/:sessionId" element={<SessionScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
