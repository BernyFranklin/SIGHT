import { HashRouter, Link, Route, Routes } from 'react-router-dom';

import { About } from '@app/routes/About';
import { Home } from '@app/routes/Home';

export function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <nav className="flex gap-4 border-b border-slate-700 px-6 py-4">
          <Link to="/" className="hover:text-blue-400">
            Home
          </Link>
          <Link to="/about" className="hover:text-blue-400">
            About
          </Link>
        </nav>
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
