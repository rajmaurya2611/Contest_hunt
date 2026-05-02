
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/homepage';  // Adjust the path as necessary
import ContestSection from './pages/contests';
import HackathonSection from './pages/hackathons';

export default function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/contests" element={<ContestSection />} />
      <Route path="/hackathons" element={<HackathonSection />} />
      </Routes>
    </Router>
  );
}
