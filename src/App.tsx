import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru'; // Import Russian locale from date-fns
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

interface Trip {
  _id: string;
  city_a: string;
  city_b: string;
  start_time: Date;
  passenger_count: number;
  chat_id: string;
}

const cityList = [
  { value: 'bishkek', label: 'Бишкек' },
  { value: 'osh', label: 'Ош' },
  { value: 'karakol', label: 'Каракол' },
  { value: 'naryn', label: 'Нарын' },
  { value: 'talas', label: 'Талас' },
  { value: 'batken', label: 'Баткен' },
];

const getCityLabel = (cityValue: string) => {
  const city = cityList.find((c) => c.value === cityValue);
  return city ? city.label : cityValue;
};

const testTrips: Trip[] = [
  {
    _id: "1",
    city_a: "bishkek",
    city_b: "karakol",
    start_time: new Date("2025-03-16T08:00:00"),
    passenger_count: 4,
    chat_id: "chat123"
  },
  {
    _id: "2",
    city_a: "bishkek",
    city_b: "karakol",
    start_time: new Date("2025-03-16T09:00:00"),
    passenger_count: 4,
    chat_id: "chat123"
  },
  {
    _id: "3",
    city_a: "bishkek",
    city_b: "karakol",
    start_time: new Date("2025-03-16T10:30:00"),
    passenger_count: 4,
    chat_id: "chat123"
  },
]

function App() {
  const [cityA, setCityA] = useState<any>(null);
  const [cityB, setCityB] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<any>(new Date());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null); // Track selected trip
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility
  const [proposedPrices, setProposedPrices] = useState<Map<string, number | null>>(new Map());

  useEffect(() => {
    // TODO
    // 1. Get last search details and set cityA, cityB selectedDate is today
    // 2. Perform the search, update trips
    // 3. Load offers and update proposedPrices
    console.log('hello');

    WebApp.ready();
    WebApp.expand();
    registerLocale('ru', ru);
  }, []);

  const filterTrips = () => {
    const params = new URLSearchParams({
      city_a: cityA.value,
      city_b: cityB.value,
      date: selectedDate.toISOString(),  // Convert Date object to ISO string
    });
    axios.get<Trip[]>(`https://booklink.pro/p24/trips?${params.toString()}`)
      .then((response) => {
        console.log(response.data);
        if (response.data) {
          const parsedTrips = response.data?.map((trip: any) => ({
            ...trip,
            start_time: new Date(trip.start_time),  // Convert start_time to Date object
          }));
          setTrips(parsedTrips);
        } else {
          setTrips([]);
        }
        setTrips(trips.concat(testTrips))
      })
  };

  const handleCardClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsModalOpen(true); // Show modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTrip(null);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value)) && selectedTrip) {
      setProposedPrices(
        (prevPrices) =>
          new Map(prevPrices.set(selectedTrip._id, value === '' ? null : Number(value))),
      );
    }
  };

  const handleProposePrice = () => {
    if (selectedTrip) {
      closeModal();
    }
  };

  return (
    <>
      <div className="card">
        <div className="select-container">
          <label htmlFor="first-select">Из города</label>
          <Select
            value={cityA}
            onChange={setCityA}
            options={cityList}
            isSearchable={true} // Enable search functionality
            classNamePrefix="react-select"
            placeholder="Выберите город"
          />
        </div>
        <div className="select-container">
          <label htmlFor="first-select">В город</label>
          <Select
            value={cityB}
            onChange={setCityB}
            options={cityList}
            isSearchable={true} // Enable search functionality
            classNamePrefix="react-select"
            placeholder="Выберите город"
          />
        </div>
        <div className="container-center">
          <label>Когда</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            showTimeSelect={false}
            dateFormat="d MMMM yyyy"
            onFocus={(e) => e.target.blur()}
            customInput={<DatePicker readOnly />}
            locale="ru"
          />
        </div>
        <div className="select-container">
          <button onClick={filterTrips}>Посмотреть попутчиков</button>
        </div>
        <div>
          {trips.map((trip, index) => {
            const proposedPrice = proposedPrices.get(trip._id);
            const isPriceProposed = proposedPrice !== null && proposedPrice !== undefined;
            return (
              <div
                key={index}
                className={`card1 ${isPriceProposed ? 'has-proposed-price' : ''}`}
                onClick={() => handleCardClick(trip)}
              >
                {getCityLabel(trip.city_a)} - {getCityLabel(trip.city_b)} 🕙
                {trip.start_time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}{' '}
                👤x{trip.passenger_count} <b>{trip.chat_id}</b>
              </div>
            );
          })}
        </div>
        <p className="read-the-docs">Попутчики</p>
      </div>
      {/* Modal - Show trip in center */}
      {isModalOpen && selectedTrip && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={closeModal}>
              ✖
            </span>
            <h2>
              {getCityLabel(selectedTrip.city_a)} - {getCityLabel(selectedTrip.city_b)}
            </h2>
            <p>
              <b>{selectedTrip.chat_id}</b> ищет попутку
            </p>
            <p>
              🕙 Время выезда:{' '}
              <b>
                {selectedTrip.start_time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </b>
            </p>
            <p>
              👤 Количество человек: <b>{selectedTrip.passenger_count}</b>
            </p>
            {/* Price input field */}
            <div className="price-input-container">
              <p>
                <b>Предложите цену</b>
              </p>
              <input
                type="number"
                id="price"
                value={proposedPrices.get(selectedTrip._id) || ''}
                onChange={handlePriceChange}
                placeholder="Цена"
              />
            </div>
            <div className="container">
              <button onClick={handleProposePrice} className="propose-button">
                Предложить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
