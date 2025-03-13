import "react-datepicker/dist/react-datepicker.css";
import './App.css'
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { registerLocale } from "react-datepicker";
import { ru } from "date-fns/locale/ru"; // Import Russian locale from date-fns
import { useState, useEffect } from 'react'

interface Trip {
  cityA: string;
  cityB: string;
  date: Date;
  peopleCount: number;
  userName: string;
}

const testTrips: Trip[] = [
  { cityA: "bishkek", cityB: "karakol", date: new Date("2025-03-13T08:30:00"), peopleCount: 4, userName: "Aybek" },
  { cityA: "bishkek", cityB: "karakol", date: new Date("2025-03-13T14:45:00"), peopleCount: 2, userName: "Beksultan" },
  { cityA: "bishkek", cityB: "karakol", date: new Date("2025-03-13T19:15:00"), peopleCount: 5, userName: "Nurbek" },
  { cityA: "bishkek", cityB: "karakol", date: new Date("2025-03-13T06:00:00"), peopleCount: 3, userName: "John" },
  { cityA: "bishkek", cityB: "karakol", date: new Date("2025-03-13T23:45:00"), peopleCount: 6, userName: "Oliver" },
];

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

function App() {
  const [cityA, setCityA] = useState<any>(null)
  const [cityB, setCityB] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<any>(new Date())
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null); // Track selected trip
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State for modal visibility

  useEffect(() => {
    registerLocale('ru', ru);
  }, []);

  const filterTrips = () => {
    const filteredTrips = testTrips.filter((trip) => {
      const matchesCityA = cityA ? trip.cityA === cityA.value : false;
      const matchesCityB = cityB ? trip.cityB === cityB.value : false;
      const matchesDate = selectedDate ? trip.date.toDateString() === selectedDate.toDateString() : true;
      return matchesCityA && matchesCityB && matchesDate;
    });
    const sortedTrips = filteredTrips.sort((a, b) => a.date.getTime() - b.date.getTime());
    setTrips(sortedTrips);
  };

  const handleCardClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsModalOpen(true); // Show modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTrip(null);
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
            isSearchable={true}  // Enable search functionality
            classNamePrefix="react-select"
            placeholder="Выберите город"/>
        </div>
        <div className="select-container">
          <label htmlFor="first-select">В город</label>
          <Select
            value={cityB}
            onChange={setCityB}
            options={cityList}
            isSearchable={true}  // Enable search functionality
            classNamePrefix="react-select"
            placeholder="Выберите город"/>
        </div>
        <div className="container-center">
          <label>Когда</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            showTimeSelect={false}
            dateFormat="d MMMM yyyy"
            onFocus={e => e.target.blur()}
            customInput={<DatePicker readOnly />}
            locale="ru"
          />
        </div>
        <div className="select-container">
          <button onClick={filterTrips}>
            Посмотреть попутчиков
          </button>
        </div>
        <div>
          {trips.map((trip, index) => (
            <div key={index} className="card1" onClick={() => handleCardClick(trip)}>
              {getCityLabel(trip.cityA)} - {getCityLabel(trip.cityB)}{" "}
              🕙{trip.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}{" "}
              👤x{trip.peopleCount}{" "}
              <b>{trip.userName}</b>
            </div>
          ))}
        </div>
        <p className="read-the-docs">
          Попутчики
        </p>
      </div>
      {/* Modal - Show trip in center */}
      {isModalOpen && selectedTrip && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={closeModal}>✖</span>
            <h2>{getCityLabel(selectedTrip.cityA)} - {getCityLabel(selectedTrip.cityB)}</h2>
            <p><b>{selectedTrip.userName}</b> ищет попутку</p>
            <p>🕙 Время выезда: <b>{selectedTrip.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</b></p>
            <p>👤 Количество человек: <b>{selectedTrip.peopleCount}</b></p>
          </div>
        </div>
      )}
    </>
  )
}

export default App
