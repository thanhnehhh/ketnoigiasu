import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterTutor from './pages/RegisterTutor';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register/student" element={<RegisterStudent />} />
                <Route path="/register/tutor" element={<RegisterTutor />} />
            </Routes>
        </Router>
    );
}

export default App;