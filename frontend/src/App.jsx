import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { auth } from './services/firebase';
import { signOut } from 'firebase/auth';

import SignIn from './components/SignIn';
import JournalChat from './components/JournalChat';
import EntryList from './components/EntryList';
import Trends from './components/Trends';
import ExportArchive from './components/ExportArchive';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-links">
          <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''}>Journal</NavLink>
          <NavLink to="/entries" className={({isActive}) => isActive ? 'active' : ''}>Entries</NavLink>
          <NavLink to="/trends" className={({isActive}) => isActive ? 'active' : ''}>Trends</NavLink>
          <NavLink to="/export" className={({isActive}) => isActive ? 'active' : ''}>Export</NavLink>
        </div>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<JournalChat />} />
        <Route path="/entries" element={<EntryList />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/export" element={<ExportArchive />} />
        <Route path="*" element={<JournalChat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
