import { Link, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import MentorPage from "./pages/MentorPage";

function App() {
  return (
    <>
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="brand">
            CodeYoung
          </Link>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/book">Book a Class</Link>
            <Link to="/mentor">Mentor</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route
          path="/confirmation"
          element={<ConfirmationPage />}
        />
        <Route path="/mentor" element={<MentorPage />} />
      </Routes>
    </>
  );
}

export default App;