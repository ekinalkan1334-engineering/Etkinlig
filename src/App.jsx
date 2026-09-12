import { useState } from 'react'
import './App.css'

const INITIAL_EVENTS = [
  {
    id: 1,
    title: 'React & Yapay Zeka Geliştirici Zirvesi',
    category: 'Teknoloji',
    date: '18 Mart 2026',
    time: '19:00',
    location: 'Kadıköy, İstanbul',
    price: 'Ücretsiz',
    imageEmoji: '🚀',
    attendees: 142,
  },
  {
    id: 2,
    title: 'Boğaz Kıyısında Akustik Caz Gecesi',
    category: 'Müzik',
    date: '21 Mart 2026',
    time: '20:30',
    location: 'Beşiktaş, İstanbul',
    price: '₺250',
    imageEmoji: '🎷',
    attendees: 88,
  },
  {
    id: 3,
    title: 'Modern Seramik & Kil Atölyesi',
    category: 'Sanat',
    date: '25 Mart 2026',
    time: '14:00',
    location: 'Moda, İstanbul',
    price: '₺400',
    imageEmoji: '🎨',
    attendees: 24,
  },
]

const CATEGORIES = ['Tümü', 'Teknoloji', 'Müzik', 'Sanat']

function App() {
  const [selectedCategory, setSelectedCategory] = useState('Tümü')
  const [joinedEvents, setJoinedEvents] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const toggleJoin = (id) => {
    setJoinedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const filteredEvents = INITIAL_EVENTS.filter((event) => {
    const matchesCategory =
      selectedCategory === 'Tümü' || event.category === selectedCategory
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">etkinlig</span>
        </div>
        <div className="nav-actions">
          <input
            type="text"
            placeholder="Etkinlik veya mekan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="btn-primary">+ Etkinlik Ekle</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="badge">✨ Yeni Nesil Etkinlik Rehberi</div>
        <h1 className="hero-title">
          Şehrindeki <span>En İyi Etkinlikleri</span> Keşfet
        </h1>
        <p className="hero-desc">
          Konserlerden atölyelere, teknoloji buluşmalarından sanata kadar her şey burada.
        </p>

        {/* Categories */}
        <div className="category-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Event List */}
      <main className="events-grid">
        {filteredEvents.map((event) => {
          const isJoined = joinedEvents[event.id]
          return (
            <article key={event.id} className="event-card">
              <div className="card-header">
                <div className="event-emoji">{event.imageEmoji}</div>
                <span className="event-tag">{event.category}</span>
                <span className="event-price">{event.price}</span>
              </div>

              <div className="card-body">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-info">
                  <div className="info-item">
                    <span>📅</span>
                    <span>{event.date} • {event.time}</span>
                  </div>
                  <div className="info-item">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="info-item">
                    <span>👥</span>
                    <span>{event.attendees + (isJoined ? 1 : 0)} katılımcı</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className={`btn-join ${isJoined ? 'joined' : ''}`}
                  onClick={() => toggleJoin(event.id)}
                >
                  {isJoined ? '✓ Katıldın' : 'Katıl'}
                </button>
              </div>
            </article>
          )
        })}

        {filteredEvents.length === 0 && (
          <div className="empty-state">
            <p>Aradığınız kriterlere uygun etkinlik bulunamadı.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 <strong>etkinlig</strong> • Keyifli etkinlikler dileriz!</p>
      </footer>
    </div>
  )
}

export default App
