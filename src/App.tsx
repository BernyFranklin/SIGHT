import { HashRouter, Link, Route, Routes } from 'react-router-dom';

import { MenuBar } from '@app/components/layout/MenuBar';
import { About } from '@app/routes/About';
import { Home } from '@app/routes/Home';

export function App() {
  return (
    <HashRouter>
      {/* COLOR: page bg/text live in src/styles/tokens.css (--color-bg, --color-text). */}
      <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <MenuBar />
        <nav className="flex gap-4 border-b px-6 py-3" style={{ borderColor: 'var(--color-border)' }}>
          <Link to="/" className="hover:opacity-80">Home</Link>
          <Link to="/about" className="hover:opacity-80">About</Link>
        </nav>
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
