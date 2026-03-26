import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '🎙 Create' },
  { to: '/editor', label: '✨ Editor' },
  { to: '/books', label: '📚 Books' },
]

export default function Navbar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 40px',
        background: 'rgba(253, 248, 240, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="sf-logo">
        <div className="sf-logo-icon">📖</div>
        StoryForge
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: '6px' }}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) => `sf-nav-btn${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
