import { useCallback, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import './App.css';
import { searchOrders, OrderListItem } from './api.ts';
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

interface Props {
  cities: CityOption[];
}

export default function Search({ cities }: Props) {
  const [cityFrom, setCityFrom] = useState<CityOption | null>(null);
  const [cityTo, setCityTo] = useState<CityOption | null>(null);
  const [date, setDate] = useState('');
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const cityName = (id: string) => cities.find((c) => c.value === id)?.label ?? id;

  const fetchOrders = useCallback(async (reset: boolean, pageToken?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data } = await searchOrders({
        city_from: cityFrom?.value,
        city_to: cityTo?.value,
        date: date || undefined,
        page_token: pageToken,
      });
      setOrders((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextToken(data.next_page_token ?? null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cityFrom, cityTo, date]);

  // Debounced fetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(true), 100);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current || !nextToken) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchOrders(false, nextToken); },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextToken, fetchOrders]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Filter block */}
      <div style={{ padding: '3vw 4vw', background: 'var(--tg-theme-bg-color)' }}>
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
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <hr className="divider" style={{ margin: 0 }} />

      {/* Results list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '3vw 4vw' }}>
        {orders.map((order) => (
          <div
            key={order.id}
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
            <div>🙋‍♂️ Пассажир: {order.name}</div>
            <br />
            <div>📍 Откуда: {cityName(order.city_from)}{order.address_from ? `, ${order.address_from}` : ''}</div>
            <div>📍 Куда: {cityName(order.city_to)}{order.address_to ? `, ${order.address_to}` : ''}</div>
            <div>🕖 Когда: {formatWhen(order.when)}</div>
            <div>👤 Мест нужно: {order.passenger_count}</div>
            <div>💰 Оплата: {order.price === 0 ? 'Договорная' : `${order.price} сом`}</div>
            <br />
            <div>
              {'📞 '}
              {revealed.has(order.id) ? (order.contact || '—') : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setRevealed((prev) => new Set(prev).add(order.id));
                  }}
                  style={{ color: 'var(--tg-theme-link-color, var(--tg-theme-button-color))' }}
                >
                  Показать номер
                </a>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', padding: '4vw', color: 'var(--tg-theme-hint-color)' }}>
            Загрузка...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '8vw', color: 'var(--tg-theme-hint-color)' }}>
            Заказов не найдено
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
