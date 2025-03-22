import WebApp from '@twa-dev/sdk';
import { MainButton } from '@twa-dev/sdk/react';
import axios from 'axios';
import { ru } from 'date-fns/locale/ru'; // Import Russian locale from date-fns
import { useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import './App.css';
import logo from './assets/logo.gif';

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

type CreateComponentProps = {
  isAdmin: boolean;
};

function Create({ isAdmin }: CreateComponentProps) {
  // states
  const [cityList, setCityList] = useState<City[]>([]);
  const [cityA, setCityA] = useState<any>(null);
  const [cityB, setCityB] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [passengerCount, setPassengerCount] = useState<number | string>(1);
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');

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

  const handleSubmit = () => {
    const data = {
      city_a: cityA.value,
      city_b: cityB.value,
      start_time: selectedDate,
      seat_count: passengerCount,
      phone: phone,
      user_name: name,
      meta: {
        time_offset: -new Date().getTimezoneOffset() / 60,
      },
    };
    WebApp.sendData(JSON.stringify(data));
  };

  // effects
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    updateMainButton();
    WebApp.MainButton.show();
    fetchCityList();
    registerLocale('ru', ru);
  }, []);

  useEffect(() => {
    console.log(selectedDate);
    updateMainButton();
  }, [cityA, cityB, selectedDate, passengerCount, phone]);

  const updateMainButton = () => {
    if (cityA && cityB && selectedDate && Number(passengerCount) > 0) {
      WebApp.MainButton.setParams({ color: '#4bb254' });
      WebApp.MainButton.enable();
    } else {
      WebApp.MainButton.setParams({ color: '#3b3b3b' });
      WebApp.MainButton.disable();
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isNaN(Number(value))) {
      setPassengerCount('');
    } else {
      setPassengerCount(Number(value));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const isNotPastDay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={logo} style={{ width: 100 }} />
        </div>
        <div>
          <label>Когда:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            locale="ru"
            showTimeSelect
            timeIntervals={60}
            onFocus={(e) => e.target.blur()}
            timeFormat="p"
            dateFormat="dd MMMM YYYY в HH:mm"
            customInput={<DatePicker readOnly />}
            filterDate={isNotPastDay}
          />
        </div>
        <div className="select-container">
          <label>Сколько мест</label>
          <input
            type="number"
            inputMode="numeric"
            id="passenger-count"
            value={passengerCount}
            onChange={handlePriceChange}
            placeholder="Число мест"
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
        <div className="select-container">
          <label>Телефон (Оставьте пустым - свяжутся в ЛС)</label>
          <input
            type="number"
            inputMode="numeric"
            id="phone"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="0555123456"
          />
        </div>
        {isAdmin ? (
          <div className="select-container">
            <label>Имя</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="Имя"
            />
          </div>
        ) : (
          <></>
        )}
        <MainButton text="Отправить" onClick={handleSubmit} />
      </div>
    </>
  );
}

export default Create;
