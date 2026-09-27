import { Link, Route, Routes, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import MentorPage from "./pages/MentorPage";

function App() {
  const location = useLocation();

  return (
    <>
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="brand" aria-label="CodeYoung home">
            <span className="brand-mark">C</span>
            <span>Code<span>Young</span></span>
          </Link>

          <div className="nav-links">
            <Link className={location.pathname === "/" ? "active" : ""} to="/">Home</Link>
            <Link className={location.pathname === "/book" ? "active" : ""} to="/book">Book a Trial</Link>
            <Link className={location.pathname === "/mentor" ? "active" : ""} to="/mentor">Mentor View</Link>
          </div>

          <Link to="/book" className="nav-cta">Book a FREE trial</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/mentor" element={<MentorPage />} />
      </Routes>
    </>
  );
}

export default App;
