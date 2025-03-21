import 'react-datepicker/dist/react-datepicker.css';
import './App.css';
import Select from 'react-select';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru'; // Import Russian locale from date-fns
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

interface Trip {
  _id: string;
  phone: string;
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
  { value: 'user', label: 'Пассажира' },
];

function Search() {
  // states
  const [userType, setUserType] = useState<any>(userTypeSelectOptions[0]);
  const [cityA, setCityA] = useState<any>({ value: 'bishkek', label: 'Бишкек' });
  const [cityB, setCityB] = useState<any>({ value: 'karakol', label: 'Каракол' });
  const [trips, setTrips] = useState<Trip[]>([]);

  // functions
  const filterTrips = () => {
    const params = new URLSearchParams({
      city_a: cityA.value,
      city_b: cityB.value,
      user_type: userType.value,
    });
    axios.get<Trip[]>(`https://booklink.pro/p24/trips?${params.toString()}`).then((response) => {
      console.log(response.data);
      if (response.data) {
        setTrips(response.data);
      } else {
        setTrips([]);
      }
    });
  };

  // effects
  useEffect(() => {
    registerLocale('ru', ru);
    WebApp.ready();
    WebApp.expand();
    filterTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [userType, cityA, cityB]);

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
          {trips.map((trip) => (
            <div className="card1">
              <img
                src={`https://booklink.pro/p24/cards?id=${trip._id}`}
                alt={'🐢'}
                loading="lazy"
              />
              <input className="card-input" type="number" value={trip.phone} readOnly />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Search;
