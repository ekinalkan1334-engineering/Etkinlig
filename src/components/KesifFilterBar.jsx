import "./kesifTheme.css";
import "./KesifFilterBar.css";

/**
 * KesifFilterBar
 * Kategori butonları + arama çubuğu + konum dropdown'ını içeren bağımsız bileşen.
 *
 * Props:
 * - categories: string[]            -> gösterilecek kategori listesi
 * - activeCategory: string          -> şu an seçili kategori ("Tümü" dahil)
 * - onCategoryChange: (cat) => void -> bir kategoriye tıklanınca çağrılır
 * - locations: string[]             -> gösterilecek konum listesi
 * - activeLocation: string          -> şu an seçili konum ("Tüm konumlar" dahil)
 * - onLocationChange: (loc) => void -> konum dropdown'ı değişince çağrılır
 * - searchValue: string             -> arama kutusunun mevcut değeri
 * - onSearchChange: (val) => void   -> arama kutusu değişince çağrılır
 */
function KesifFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  locations,
  activeLocation,
  onLocationChange,
  searchValue,
  onSearchChange,
}) {
  const allCategories = ["Tümü", ...categories];
  const allLocations = ["Tüm konumlar", ...locations];

  return (
    <div className="kesif-filter-bar">
      <div className="kesif-filter-bar__categories">
        {allCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              "kesif-filter-bar__chip" +
              (category === activeCategory ? " kesif-filter-bar__chip--active" : "")
            }
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="kesif-filter-bar__row">
        <div className="kesif-filter-bar__search">
          <input
            type="text"
            placeholder="Etkinlik veya konum ara"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="kesif-filter-bar__search-input"
          />
        </div>

        <select
          className="kesif-filter-bar__location-select"
          value={activeLocation}
          onChange={(event) => onLocationChange(event.target.value)}
        >
          {allLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default KesifFilterBar;
