import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Select from 'react-select';
import './App.css';
import logo from './assets/logo.svg';
import { searchOrders, searchTrips, OrderListItem } from './api.ts';
import WebApp from '@twa-dev/sdk';
import { CityOption } from './cities.ts';

const PULL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 200;

const RU_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const RU_MONTHS_GENITIVE = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

function formatWhen(when: string): string {
  const d = new Date(when);
  const day = String(d.getDate()).padStart(2, '0');
  const month = RU_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hh}:${mm}`;
}

function dateKey(when: string): string {
  const d = new Date(when);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function formatDateHeader(when: string): string {
  const d = new Date(when);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, tomorrow)) return 'Завтра';
  return `${d.getDate()} ${RU_MONTHS_GENITIVE[d.getMonth()]}`;
}

function formatWaTime(when: string): string {
  const d = new Date(when);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay(d, today)) return `сегодня в ${hhmm}`;
  if (sameDay(d, tomorrow)) return `завтра в ${hhmm}`;
  return `${d.getDate()} ${RU_MONTHS_GENITIVE[d.getMonth()]} в ${hhmm}`;
}

function buildWaText(cityFrom: string, cityTo: string, when: string, mode: 'order' | 'trip'): string {
  const ending = mode === 'order' ? 'нашли машину?' : 'еще есть места?';
  return `Здравствуйте!\nУвидел Ваше объявление в Попутка24 t.me/poputka24kg\n${cityFrom}-${cityTo} ${formatWaTime(when)}, ${ending}`;
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
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState<{ orders: number; trips: number } | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const loadingRef = useRef(false);
  const filterVersionRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchItemsRef = useRef<(reset: boolean, pageToken?: string) => Promise<void>>(async () => {});
  const pullContainerRef = useRef<HTMLDivElement>(null);
  const pullArrowRef = useRef<HTMLSpanElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let visible = false;
    const onScroll = () => {
      const shouldShow = window.scrollY > SCROLL_TOP_THRESHOLD;
      if (shouldShow !== visible) {
        visible = shouldShow;
        setShowScrollTop(shouldShow);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sections = useMemo(() => {
    const result: { key: string; label: string; items: OrderListItem[] }[] = [];
    for (const item of items) {
      const key = dateKey(item.when);
      if (result.length === 0 || result[result.length - 1].key !== key) {
        result.push({ key, label: formatDateHeader(item.when), items: [] });
      }
      result[result.length - 1].items.push(item);
    }
    return result;
  }, [items]);

  const cityName = (id: string) => cities.find((c) => c.value === id)?.label ?? id;

  const fetchItems = useCallback(async (reset: boolean, pageToken?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const version = filterVersionRef.current;
    try {
      const filterParams = { city_from: cityFrom?.value, city_to: cityTo?.value, date: date || undefined };
      const [{ data }, otherCount] = await Promise.all([
        (mode === 'trip' ? searchTrips : searchOrders)({ ...filterParams, page_token: pageToken }),
        reset ? (mode === 'trip' ? searchOrders : searchTrips)(filterParams).then(r => r.data.count) : Promise.resolve(null),
      ]);
      if (version !== filterVersionRef.current) return;
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setNextToken(data.next_page_token ?? null);
      if (reset) {
        setCounts(mode === 'trip'
          ? { trips: data.count, orders: otherCount as number }
          : { orders: data.count, trips: otherCount as number });
      }
    } catch (err) {
      if (version !== filterVersionRef.current) return;
      console.error('Failed to fetch:', err);
    } finally {
      loadingRef.current = false;
      if (version !== filterVersionRef.current) return;
      setLoading(false);
    }
  }, [cityFrom, cityTo, date, mode]);

  useEffect(() => {
    filterVersionRef.current++;
    setLoading(true);
    setItems([]);
    setNextToken(null);
    const timer = setTimeout(() => fetchItems(true), 100);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => { fetchItemsRef.current = fetchItems; }, [fetchItems]);

  useEffect(() => {
    let startY = 0;
    let lastY = 0;
    let vibrated = false;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      lastY = startY;
      vibrated = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
      if (window.scrollY > 0) return;
      const dy = Math.max(0, lastY - startY);
      if (pullContainerRef.current) pullContainerRef.current.style.height = `${Math.min(dy * 0.6, 48)}px`;
      if (pullArrowRef.current) {
        pullArrowRef.current.style.transform = `rotate(${Math.min(dy / PULL_THRESHOLD, 1) * 360}deg)`;
        pullArrowRef.current.style.color = dy >= PULL_THRESHOLD ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)';
      }
      if (dy >= PULL_THRESHOLD && !vibrated) {
        vibrated = true;
        WebApp.HapticFeedback.impactOccurred('medium');
      }
    };
    const onTouchEnd = () => {
      const dy = lastY - startY;
      if (pullContainerRef.current) pullContainerRef.current.style.height = '0px';
      vibrated = false;
      if (window.scrollY > 0 || dy < PULL_THRESHOLD) return;
      setRefreshing(true);
      fetchItemsRef.current(true).finally(() => setRefreshing(false));
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

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
    <div>

      <div ref={pullContainerRef} style={{ height: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span ref={pullArrowRef} style={{ fontSize: '10.5vw', display: 'inline-block', color: 'var(--tg-theme-hint-color)', transition: 'color 0.15s' }}>↻</span>
      </div>

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

      <div style={{ padding: '3vw 4vw', display: 'flex', flexDirection: 'column' }}>
        {refreshing && (
          <div className="loading-logo">
            <img src={logo} alt="" />
          </div>
        )}
        {sections.map((section) => (
          <Fragment key={section.key}>
            <div style={{
              fontSize: '3.5vw',
              fontWeight: 600,
              color: 'var(--tg-theme-hint-color)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '2vw 0 1vw',
            }}>
              {section.label}
            </div>
            {section.items.map((item) => (
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
                      onClick={() => WebApp.openTelegramLink(`https://t.me/poputka24bot?start=${mode === 'order' ? 'call' : 'callt'}${item.id}`)}
                      style={{
                        flex: 1,
                        background: 'var(--tg-theme-button-color)',
                        border: 'none',
                        borderRadius: '2vw',
                        cursor: 'pointer',
                        padding: '2vw 0',
                        fontSize: '3.5vw',
                        color: 'var(--tg-theme-button-text-color)',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                      }}
                    >
                      📞 Позвонить
                    </button>
                    <a
                      href={`https://wa.me/+996${item.contact.replace(/^0/, '')}?text=${encodeURIComponent(buildWaText(cityName(item.city_from), cityName(item.city_to), item.when, mode))}`}
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
                      💬 Написать Ватсап
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
          </Fragment>
        ))}

        {loading && !refreshing && (
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

      {showScrollTop && (
        <button
          onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{
            position: 'fixed',
            bottom: '6vw',
            right: '4vw',
            width: '15.6vw',
            height: '15.6vw',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--tg-theme-button-color)',
            color: 'var(--tg-theme-button-text-color)',
            fontSize: '7.8vw',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
