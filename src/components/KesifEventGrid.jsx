import KesifEventCard from "./KesifEventCard";
import "./kesifTheme.css";
import "./KesifEventGrid.css";

/**
 * KesifEventGrid
 * Etkinlik listesini responsive bir grid içinde KesifEventCard'lar olarak render eder.
 * Filtrelenmiş liste boşsa kullanıcıya durum hakkında bilgi verir.
 *
 * Props:
 * - events: Array<event>            -> gösterilecek (filtrelenmiş) etkinlik listesi
 * - onDetailClick: (event) => void  -> bir karttaki detay butonuna basılınca çağrılır
 */
function KesifEventGrid({ events, onDetailClick }) {
  if (events.length === 0) {
    return (
      <div className="kesif-event-grid__empty">
        <p>Bu kriterlere uygun etkinlik bulunamadı.</p>
        <span>Farklı bir kategori dene veya arama terimini değiştir.</span>
      </div>
    );
  }

  return (
    <div className="kesif-event-grid">
      {events.map((event) => (
        <KesifEventCard key={event.id} event={event} onDetailClick={onDetailClick} />
      ))}
    </div>
  );
}

export default KesifEventGrid;
