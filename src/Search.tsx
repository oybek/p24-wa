import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import Select from 'react-select';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru'; // Import Russian locale from date-fns
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import trip1 from './assets/trip1.jpg';

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

const userTypeSelectOptions = [
  { value: 'driver', label: 'Водителя' },
  { value: 'passenger', label: 'Пассажира' },
];

const testTrips: Trip[] = [
  {
    _id: '1',
    city_a: 'bishkek',
    city_b: 'karakol',
    start_time: new Date('2025-03-16T08:00:00'),
    passenger_count: 4,
    chat_id: 'chat123',
  },
];

function Search() {
  const [userType, setUserType] = useState<any>(userTypeSelectOptions[0]);
  const [cityA, setCityA] = useState<any>(null);
  const [cityB, setCityB] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    // TODO
    // 1. Get last search details and set cityA, cityB selectedDate is today
    // 2. Perform the search, update trips
    // 3. Load offers and update proposedPrices
    console.log('hello');

    WebApp.ready();
    WebApp.expand();
    registerLocale('ru', ru);
    WebApp.showAlert('hello');
  }, []);

  const filterTrips = () => {
    const params = new URLSearchParams({
      city_a: cityA.value,
      city_b: cityB.value,
      user_type: userType.value,
    });
    axios.get<Trip[]>(`https://booklink.pro/p24/trips?${params.toString()}`).then((response) => {
      console.log(response.data);
      if (response.data) {
        const parsedTrips = response.data?.map((trip: any) => ({
          ...trip,
          start_time: new Date(trip.start_time), // Convert start_time to Date object
        }));
        setTrips(parsedTrips);
      } else {
        setTrips([]);
      }
    });
    setTrips(trips.concat(testTrips));
  };

  filterTrips

  return (
    <>
      <div className="card">
        <div className="select-container">
          <label htmlFor="first-select">Ищу</label>
          <Select
            value={userType}
            onChange={setUserType}
            options={userTypeSelectOptions}
            isSearchable={false} // Enable search functionality
            classNamePrefix="react-select"
          />
        </div>
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
        <div>
          <div className="card1">
            <img src={trip1} alt={'🐢'} loading="lazy" />
            <button className="btn">Показать номер</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Search;
