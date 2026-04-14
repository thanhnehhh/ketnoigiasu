import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
      <Router>
        <Routes>
          {/* Trang chủ */}
          <Route path="/" element={<Home />} />

          {/* Trang đăng nhập */}
          <Route path="/login" element={<Login />} />

          {/* Các trang khác sẽ thêm sau */}
          {/* <Route path="/register" element={<Register />} /> */}
          {/* <Route path="/search" element={<Search />} /> */}
        </Routes>
      </Router>
  );
}

export default App;