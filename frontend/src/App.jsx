// Handles Routing for React Frontend
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HomePage           from './pages/home/HomePage';
import NotesPage          from './components/notes/NotesPage';
import WeatherPage        from './components/weather/WeatherPage';
import ProfilePage        from './pages/profile/ProfilePage';
import BookmarksPage      from './components/bookmarks/BookmarksPage';

function App() {
  return (
    <DarkModeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/"                element={<LandingPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/home"            element={<HomePage />} />
          <Route path="/weather"         element={<WeatherPage />} />
          <Route path="/notes"           element={<NotesPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/bookmarks"       element={<BookmarksPage />} />
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
