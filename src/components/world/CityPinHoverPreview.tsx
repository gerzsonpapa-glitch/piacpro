import { ChevronRight } from 'lucide-react';
import type { PinPreviewItem } from '../../hooks/usePinPreview';
import { formatPrice } from '../../lib/utils';

export default function CityPinHoverPreview({
  items,
  loading,
  label,
  color,
}: {
  items: PinPreviewItem[];
  loading: boolean;
  label: string;
  color: string;
}) {
  return (
    <div
      className="city-pin-preview"
      style={{ '--pin-preview-accent': color } as React.CSSProperties}
    >
      <p className="city-pin-preview__title">{label}</p>
      {loading ? (
        <div className="city-pin-preview__loading">Előnézet betöltése…</div>
      ) : items.length === 0 ? (
        <div className="city-pin-preview__empty">Még nincs tartalom — légy te az első!</div>
      ) : (
        <ul className="city-pin-preview__list">
          {items.map((item) => (
            <li key={item.id} className="city-pin-preview__item">
              {item.image ? (
                <img src={item.image} alt="" className="city-pin-preview__thumb" loading="lazy" />
              ) : (
                <div className="city-pin-preview__thumb city-pin-preview__thumb--empty" />
              )}
              <div className="city-pin-preview__meta">
                <span className="city-pin-preview__name">{item.title}</span>
                {item.price != null && (
                  <span className="city-pin-preview__price">{formatPrice(item.price)}</span>
                )}
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
