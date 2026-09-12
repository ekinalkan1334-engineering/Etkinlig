import "./kesifTheme.css";
import "./KesifEventCard.css";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * KesifEventCard
 * Tek bir etkinliği görsel, başlık, tarih, konum, kategori etiketi
 * ve detay butonuyla gösteren kart.
 *
 * Props:
 * - event: { id, title, date, location, category, image }
 * - onDetailClick: (event) => void  -> "Detayları Gör" tıklanınca çağrılır
 */
function KesifEventCard({ event, onDetailClick }) {
  const formattedDate = dateFormatter.format(new Date(event.date));

  return (
    <article className="kesif-event-card">
      <div className="kesif-event-card__image-wrap">
        <img
          src={event.image}
          alt={event.title}
          className="kesif-event-card__image"
          loading="lazy"
        />
        <span className="kesif-event-card__tag">{event.category}</span>
      </div>

      <div className="kesif-event-card__body">
        <h3 className="kesif-event-card__title">{event.title}</h3>

        <div className="kesif-event-card__meta">
          <span className="kesif-event-card__meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 2v3M17 2v3M3.5 9h17M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {formattedDate}
          </span>

          <span className="kesif-event-card__meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {event.location}
          </span>
        </div>

        <button
          type="button"
          className="kesif-event-card__detail-btn"
          onClick={() => onDetailClick?.(event)}
        >
          Detayları gör
        </button>
      </div>
    </article>
  );
}

export default KesifEventCard;
