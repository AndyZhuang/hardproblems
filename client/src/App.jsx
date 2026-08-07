import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Problems from './pages/Problems.jsx';
import ProblemDetail from './pages/ProblemDetail.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Chain from './pages/Chain.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="problems" element={<Problems />} />
          <Route path="problems/:id" element={<ProblemDetail />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="chain" element={<Chain />} />
          <Route path="chain/block/:id" element={<Chain />} />
          <Route path="auth" element={<Auth />} />
          <Route path="u/:username" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
