
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/homepage';  // Adjust the path as necessary
import ContestSection from './pages/contests';

export default function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/contests" element={<ContestSection />} />
      </Routes>
    </Router>
  );
}
