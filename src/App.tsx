
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Homepage from "./pages/homepage";
import ContestSection from "./pages/contests";
import HackathonSection from "./pages/hackathons";
import BugBountySection from "./pages/bugbounty";

import SEO from "./components/SEO";

import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        {/* Dynamic SEO metadata for each route */}
        <SEO />

        <Routes>
          <Route
            path="/"
            element={<Homepage />}
          />

          <Route
            path="/contests"
            element={<ContestSection />}
          />

          <Route
            path="/hackathons"
            element={<HackathonSection />}
          />

          <Route
            path="/bug-bounties"
            element={<BugBountySection />}
          />
        </Routes>

        <Analytics />
      </Router>
    </HelmetProvider>
  );
}
