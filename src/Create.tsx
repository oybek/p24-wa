import WebApp from '@twa-dev/sdk';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import './App.css';
import { createOrder, createTrip, getApiError } from './api.ts';
import { CityOption } from './cities.ts';
import logo from './assets/logo.svg';


const ONE_HOUR_MS = 60 * 60 * 1000;

const toLocalDateTimeString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const labels = {
  order: {
    when: 'Нужно выехать',
    cityFrom: 'Из города',
    addressFrom: 'Адрес отправления',
    cityTo: 'В город',
    addressTo: 'Адрес назначения',
    passengerCount: 'Нужно мест',
    price: 'Готов заплатить',
    phone: 'Телефон для связи',
  },
  trip: {
    when: 'Выезжаю',
    cityFrom: 'Из города',
    addressFrom: 'Адрес отправления',
    cityTo: 'В город',
    addressTo: 'Адрес назначения',
    passengerCount: 'Свободных мест',
    price: 'Цена за место',
    phone: 'Телефон для связи',
  },
} as const;

type CreateComponentProps = {
  cities: CityOption[];
  initialMode?: 'order' | 'trip';
};

function Create({ cities, initialMode = 'order' }: CreateComponentProps) {
  const [mode, setMode] = useState<'order' | 'trip'>(initialMode);
  const l = labels[mode];
  const [cityFrom, setCityFrom] = useState<CityOption | null>(null);
  const [addressFrom, setAddressFrom] = useState<string>('');
  const [cityTo, setCityTo] = useState<CityOption | null>(null);
  const [addressTo, setAddressTo] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateTimeString(new Date()));
  const [passengerCount, setPassengerCount] = useState<number | string>(1);
  const [price, setPrice] = useState<number | string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(false), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async () => {
    if (!formValid) return;
    const payload = {
      name: WebApp.initDataUnsafe.user?.first_name ?? '',
      when: new Date(selectedDate).toISOString(),
      city_from: cityFrom!.value,
      address_from: addressFrom,
      city_to: cityTo!.value,
      address_to: addressTo,
      passenger_count: Number(passengerCount),
      price: Number(price),
      contact: phone,
    };
    try {
      const { data } = await (mode === 'trip' ? createTrip(payload) : createOrder(payload));
      WebApp.openTelegramLink(data.link);
      WebApp.close();
    } catch (err: unknown) {
      const msg = getApiError(err);
      if (msg) {
        WebApp.showAlert(msg);
      } else {
        setError(true);
      }
    }
  };

  const formValid = useMemo(() => {
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
    return !!(
      cityFrom &&
      cityTo &&
      addressFrom &&
      addressTo &&
      selectedDate &&
      new Date(selectedDate) >= oneHourAgo &&
      Number(passengerCount) > 0 &&
      Number(price) > 0 &&
      phone
    );
  }, [cityFrom, cityTo, addressFrom, addressTo, selectedDate, passengerCount, price, phone]);

  useEffect(() => {
    WebApp.ready();
  }, []);

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 75,
            height: 75,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--tg-theme-bg-color)',
          }}>
            <img src={logo} style={{ width: '80%' }} />
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: '1vw', fontSize: '3.5vw', color: 'var(--tg-theme-hint-color)' }}>Я</label>
        <div className="mode-toggle">
          <button
            className={mode === 'order' ? 'mode-toggle__btn mode-toggle__btn--active' : 'mode-toggle__btn'}
            onClick={() => setMode('order')}
          >
            🙋‍♂️ Пассажир
          </button>
          <button
            className={mode === 'trip' ? 'mode-toggle__btn mode-toggle__btn--active' : 'mode-toggle__btn'}
            onClick={() => setMode('trip')}
          >
            🚗 Водитель
          </button>
        </div>

        <div className="select-container">
          <label htmlFor="date-picker">{l.when}</label>
          <input
            id="date-picker"
            type="datetime-local"
            lang="ru-RU"
            value={selectedDate}
            min={toLocalDateTimeString(new Date(Date.now() - ONE_HOUR_MS))}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="select-container">
          <label htmlFor="city-from-select">{l.cityFrom}</label>
          <Select
            inputId="city-from-select"
            value={cityFrom}
            onChange={setCityFrom}
            options={cities}
            isSearchable={true}
            classNamePrefix="react-select"
            placeholder="Выберите город"
          />
        </div>

        <div className="select-container">
          <label htmlFor="address-from">{l.addressFrom}</label>
          <input
            id="address-from"
            type="text"
            value={addressFrom}
            onChange={(e) => setAddressFrom(e.target.value)}
            placeholder="Улица, дом"
          />
        </div>

        <div className="select-container">
          <label htmlFor="city-to-select">{l.cityTo}</label>
          <Select
            inputId="city-to-select"
            value={cityTo}
            onChange={setCityTo}
            options={cities}
            isSearchable={true}
            classNamePrefix="react-select"
            placeholder="Выберите город"
          />
        </div>

        <div className="select-container">
          <label htmlFor="address-to">{l.addressTo}</label>
          <input
            id="address-to"
            type="text"
            value={addressTo}
            onChange={(e) => setAddressTo(e.target.value)}
            placeholder="Улица, дом"
          />
        </div>

        <div className="select-container">
          <label htmlFor="passenger-count">{l.passengerCount}</label>
          <input
            type="number"
            inputMode="numeric"
            id="passenger-count"
            value={passengerCount}
            onChange={(e) => setPassengerCount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="1"
          />
        </div>

        <div className="select-container">
          <label htmlFor="price">{l.price}</label>
          <input
            type="number"
            inputMode="numeric"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
          />
        </div>

        <div className="select-container">
          <label htmlFor="phone">{l.phone}</label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0xxxxxxxxx"
            pattern="0[0-9]{9}"
          />
        </div>

        {error && <div className="error-banner">Что-то пошло не так 😢</div>}
        <hr className="divider" />
        <button onClick={handleSubmit} disabled={!formValid}>
          Отправить
        </button>
      </div>
    </>
  );
}

export default Create;
