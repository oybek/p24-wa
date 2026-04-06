import { useCallback, useEffect, useRef, useState } from 'react';

const METRIC_KEY = { order: 'call_order', trip: 'call_trip' } as const;
import Select from 'react-select';
import './App.css';
import logo from './assets/logo.svg';
import { searchOrders, searchTrips, trackMetric, OrderListItem } from './api.ts';
import { CityOption } from './cities.ts';

const RU_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function formatWhen(when: string): string {
  const d = new Date(when);
  const day = String(d.getDate()).padStart(2, '0');
  const month = RU_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hh}:${mm}`;
}

const MODE_LABELS = {
  order: {
    person: '🙋‍♂️ Пассажир',
    seats: '👤 Мест нужно',
    price: (p: number) => p === 0 ? 'Договорная' : `${p} сом`,
    priceLabel: '💰 Оплата',
    empty: 'Заказов не найдено',
  },
  trip: {
    person: '🚗 Водитель',
    seats: '👤 Мест',
    price: (p: number) => p === 0 ? 'Договорная' : `${p} сом`,
    priceLabel: '💰 Цена за место',
    empty: 'Поездок не найдено',
  },
} as const;

interface Props {
  cities: CityOption[];
  initialMode?: 'order' | 'trip';
}

export default function Search({ cities, initialMode = 'order' }: Props) {
  const [mode, setMode] = useState<'order' | 'trip'>(initialMode);
  const labels = MODE_LABELS[mode];
  const [cityFrom, setCityFrom] = useState<CityOption | null>(null);
  const [cityTo, setCityTo] = useState<CityOption | null>(null);
  const [date, setDate] = useState('');
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{ orders: number; trips: number } | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<Set<number>>(new Set());
  const loadingRef = useRef(false);
  const filterVersionRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const copyTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => () => { copyTimersRef.current.forEach(clearTimeout); }, []);

  const cityName = (id: string) => cities.find((c) => c.value === id)?.label ?? id;

  const handleCopy = useCallback((id: number, contact: string) => {
    navigator.clipboard.writeText(contact);
    trackMetric(METRIC_KEY[mode]);
    const prev = copyTimersRef.current.get(id);
    if (prev) clearTimeout(prev);
    setCopied((s) => new Set(s).add(id));
    const timer = setTimeout(() => {
      setCopied((s) => { const n = new Set(s); n.delete(id); return n; });
      copyTimersRef.current.delete(id);
    }, 2000);
    copyTimersRef.current.set(id, timer);
  }, [mode]);

  const fetchItems = useCallback(async (reset: boolean, pageToken?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const version = filterVersionRef.current;
    try {
      const params = {
        city_from: cityFrom?.value,
        city_to: cityTo?.value,
        date: date || undefined,
        page_token: pageToken,
      };
      const { data } = await (mode === 'trip' ? searchTrips(params) : searchOrders(params));
      if (version !== filterVersionRef.current) return;
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextToken(data.next_page_token ?? null);
    } catch (err) {
      if (version !== filterVersionRef.current) return;
      console.error('Failed to fetch:', err);
    } finally {
      loadingRef.current = false;
      if (version !== filterVersionRef.current) return;
      setLoading(false);
    }
  }, [cityFrom, cityTo, date, mode]);

  // Debounced fetch on filter change
  useEffect(() => {
    filterVersionRef.current++;
    setLoading(true);
    setItems([]);
    const timer = setTimeout(() => fetchItems(true), 100);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Fetch counts for both modes when filters change
  useEffect(() => {
    const params = { city_from: cityFrom?.value, city_to: cityTo?.value, date: date || undefined };
    Promise.all([searchOrders(params), searchTrips(params)])
      .then(([o, t]) => setCounts({ orders: o.data.count, trips: t.data.count }))
      .catch(() => {});
  }, [cityFrom, cityTo, date]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current || !nextToken) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchItems(false, nextToken); },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextToken, fetchItems]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      <div className="filter-block" style={{ padding: '3vw 4vw', background: 'var(--tg-theme-bg-color)' }}>
        <div className="mode-toggle" style={{ marginBottom: '3vw' }}>
          <button
            className={mode === 'order' ? 'mode-toggle__btn mode-toggle__btn--active' : 'mode-toggle__btn'}
            onClick={() => setMode('order')}
          >
            🙋‍♂️ Пассажиры{counts != null ? ` (${counts.orders})` : ''}
          </button>
          <button
            className={mode === 'trip' ? 'mode-toggle__btn mode-toggle__btn--active' : 'mode-toggle__btn'}
            onClick={() => setMode('trip')}
          >
            🚗 Водители{counts != null ? ` (${counts.trips})` : ''}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '3vw', marginBottom: '3vw' }}>
          <div className="select-container" style={{ flex: 1, marginBottom: 0 }}>
            <label>Из города</label>
            <Select
              value={cityFrom}
              onChange={setCityFrom}
              options={cities}
              isClearable
              isSearchable
              classNamePrefix="react-select"
              placeholder="Откуда"
            />
          </div>
          <div className="select-container" style={{ flex: 1, marginBottom: 0 }}>
            <label>В город</label>
            <Select
              value={cityTo}
              onChange={setCityTo}
              options={cities}
              isClearable
              isSearchable
              classNamePrefix="react-select"
              placeholder="Куда"
            />
          </div>
        </div>
        <div className="select-container" style={{ marginBottom: 0 }}>
          <label>Дата</label>
          <div style={{ display: 'flex', gap: '2vw', alignItems: 'stretch' }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ flex: 1 }}
            />
            {date && (
              <button
                onClick={() => setDate('')}
                style={{
                  background: 'var(--tg-theme-secondary-bg-color)',
                  border: 'none',
                  borderRadius: '2vw',
                  cursor: 'pointer',
                  width: '12vw',
                  fontSize: '5vw',
                  color: 'var(--tg-theme-hint-color)',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: 0 }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '3vw 4vw', display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'var(--tg-theme-secondary-bg-color)',
              borderRadius: '3vw',
              padding: '4vw',
              marginBottom: '3vw',
              fontSize: '4vw',
              lineHeight: 1.8,
              color: 'var(--tg-theme-text-color)',
            }}
          >
            <div><b>{labels.person}:</b> {item.name}</div>
            <br />
            <div><b>📍 Откуда:</b> {cityName(item.city_from)}{item.address_from ? `, ${item.address_from}` : ''}</div>
            <div><b>📍 Куда:</b> {cityName(item.city_to)}{item.address_to ? `, ${item.address_to}` : ''}</div>
            <div><b>🕖 Когда:</b> {formatWhen(item.when)}</div>
            <div><b>{labels.seats}:</b> {item.passenger_count}</div>
            <div><b>{labels.priceLabel}:</b> {labels.price(item.price)}</div>
            <br />
            {revealed.has(item.id) ? (
              <>
                <div>📞 <span style={{ userSelect: 'text' }}>{item.contact || '—'}</span></div>
                {item.contact && (
                  <div style={{ display: 'flex', gap: '2vw', marginTop: '2vw' }}>
                    <button
                      onClick={() => handleCopy(item.id, item.contact)}
                      style={{
                        flex: 1,
                        background: copied.has(item.id) ? '#4caf50' : 'none',
                        border: `1px solid ${copied.has(item.id) ? '#4caf50' : 'var(--tg-theme-hint-color)'}`,
                        borderRadius: '2vw',
                        cursor: 'pointer',
                        padding: '2vw 0',
                        fontSize: '3.5vw',
                        color: copied.has(item.id) ? '#fff' : 'var(--tg-theme-text-color)',
                        fontFamily: 'inherit',
                      }}
                    >
                      {copied.has(item.id) ? '✓ Скопирован' : '📋 Копировать'}
                    </button>
                    <a
                      href={`https://wa.me/+996${item.contact.replace(/^0/, '')}?text=${encodeURIComponent('Здравствуйте! Увидел Ваше объявление в Попутка24 (t.me/poputka24kg), еще актуально?')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#128c5e',
                        borderRadius: '2vw',
                        padding: '2vw 0',
                        fontSize: '3.5vw',
                        color: '#fff',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      💬 Ватсап
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div>
                {'📞 '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setRevealed((prev) => new Set(prev).add(item.id));
                  }}
                  style={{ color: 'var(--tg-theme-link-color, var(--tg-theme-button-color))' }}
                >
                  Показать номер
                </a>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="loading-logo">
            <img src={logo} alt="" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '8vw', color: 'var(--tg-theme-hint-color)' }}>
            {labels.empty}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
