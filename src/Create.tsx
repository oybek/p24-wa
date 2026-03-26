import WebApp from '@twa-dev/sdk';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import './App.css';
import { createOrder } from './api.ts';
import { CityOption } from './cities.ts';
import logo from './assets/logo.jpg';


const ONE_HOUR_MS = 60 * 60 * 1000;

const toLocalDateTimeString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

type CreateComponentProps = {
  cities: CityOption[];
};

function Create({ cities }: CreateComponentProps) {
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
    try {
      const { data } = await createOrder({
        when: new Date(selectedDate).toISOString(),
        city_from: cityFrom!.value,
        address_from: addressFrom,
        city_to: cityTo!.value,
        address_to: addressTo,
        passenger_count: Number(passengerCount),
        price: Number(price),
        contact: phone,
      });
      WebApp.openTelegramLink(data.link);
      WebApp.close();
    } catch {
      setError(true);
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
          <img src={logo} style={{ width: 100, borderRadius: '50%' }} />
        </div>

        <div className="select-container">
          <label htmlFor="date-picker">Когда</label>
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
          <label htmlFor="city-from-select">Откуда</label>
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
          <label htmlFor="address-from">Адрес</label>
          <input
            id="address-from"
            type="text"
            value={addressFrom}
            onChange={(e) => setAddressFrom(e.target.value)}
            placeholder="Улица, дом"
          />
        </div>

        <div className="select-container">
          <label htmlFor="city-to-select">Куда</label>
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
          <label htmlFor="address-to">Адрес</label>
          <input
            id="address-to"
            type="text"
            value={addressTo}
            onChange={(e) => setAddressTo(e.target.value)}
            placeholder="Улица, дом"
          />
        </div>

        <div className="select-container">
          <label htmlFor="passenger-count">Мест нужно</label>
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
          <label htmlFor="price">Заплачу</label>
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
          <label htmlFor="phone">Телефон</label>
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
