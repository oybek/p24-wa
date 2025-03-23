import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import { ru } from 'date-fns/locale/ru'; // Import Russian locale from date-fns
import { useEffect, useState } from 'react';
import { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import './App.css';

interface Trip {
  _id: string;
  phone: string;
}

interface City {
  value: string;
  label: string;
}

const fallbackCityList: City[] = [
  { value: 'bishkek', label: 'Бишкек' },
  { value: 'osh', label: 'Ош' },
  { value: 'jalal-abad', label: 'Джалал-Абад' },
  { value: 'karakol', label: 'Каракол' },
  { value: 'naryn', label: 'Нарын' },
  { value: 'talas', label: 'Талас' },
  { value: 'batken', label: 'Баткен' },
  { value: 'tokmok', label: 'Токмок' },
  { value: 'karabalta', label: 'Кара-Балта' },
  { value: 'kant', label: 'Кант' },
  { value: 'balykchy', label: 'Балыкчы' },
  { value: 'isfana', label: 'Исфана' },
  { value: 'kokjangak', label: 'Кок-Жангак' },
  { value: 'suluktu', label: 'Сулюкта' },
  { value: 'cholpon-ata', label: 'Чолпон-Ата' },
  { value: 'shamaldy-say', label: 'Шамалды-Сай' },
];

const userTypeSelectOptions = [
  { value: 'driver', label: 'Водителя' },
  { value: 'passenger', label: 'Пассажира' },
];

function Search() {
  // states
  const [cityList, setCityList] = useState<City[]>([]);
  const [userType, setUserType] = useState<any>(userTypeSelectOptions[0]);
  const [cityA, setCityA] = useState<any>({ value: 'bishkek', label: 'Бишкек' });
  const [cityB, setCityB] = useState<any>({ value: 'karakol', label: 'Каракол' });
  const [trips, setTrips] = useState<Trip[]>([]);

  // functions
  const fetchCityList = () => {
    axios.get<City[]>(`https://booklink.pro/p24/cities`).then((response) => {
      if (response.data) {
        const parsedCityList = response.data?.map(
          (trip: any) =>
            ({
              value: trip.key,
              label: trip.value,
            }) as City,
        );
        setCityList(parsedCityList);
      } else {
        setCityList(fallbackCityList);
      }
    });
  };

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
    fetchCityList();
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
