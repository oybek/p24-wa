import "react-datepicker/dist/react-datepicker.css";
import './App.css'
import Select from 'react-select';
import { registerLocale } from "react-datepicker";
import { ru } from "date-fns/locale/ru"; // Import Russian locale from date-fns
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker';

const cityList = [
  { value: 'bishkek', label: 'Бишкек' },
  { value: 'osh', label: 'Ош' },
  { value: 'karakol', label: 'Каракол' },
  { value: 'naryn', label: 'Нарын' },
  { value: 'talas', label: 'Талас' },
  { value: 'batken', label: 'Баткен' },
];

function Create() {
  const tg = window.Telegram.WebApp;
  const [cityA, setCityA] = useState<any>(null)
  const [cityB, setCityB] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [passengerCount, setPassengerCount] = useState<number | string>(1);

  const handleSubmit = () => {
    if (!tg) return;

    const data = {
      city_a: cityA.value,
      city_b: cityB.value,
      selected_date: selectedDate,
      passenger_count: passengerCount,
    };

    tg.sendData(JSON.stringify(data)); // Send data to Telegram
    tg.close(); // Close Web App after sending
  };

  useEffect(() => {
    // TODO
    // 1. Get last search details and set cityA, cityB selectedDate is today
    // 2. Perform the search, update trips
    // 3. Load offers and update proposedPrices
    console.log("hello")
    registerLocale('ru', ru)
  }, [])

  useEffect(() => {
    console.log(selectedDate)
    updateMainButton();
  }, [cityA, cityB, selectedDate, passengerCount]);

  const updateMainButton = () => {
    if (!tg) return;

    if (cityA && cityB && selectedDate && Number(passengerCount) > 0) {
      tg.MainButton.setText("Отправить");
      tg.MainButton.onClick(handleSubmit);
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || isNaN(Number(value))) {
      setPassengerCount('')
    } else {
      setPassengerCount(Number(value))
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
            onChange={(date) => setSelectedDate(date)}
            locale="ru"
            showTimeSelect
            timeIntervals={30}
            onFocus={(e) => e.target.blur()}
            timeFormat="p"
            dateFormat="dd MMMM YYYY в HH:mm"
            customInput={<DatePicker readOnly/>}/>
        </div>
        <div className="select-container">
          <label>Нужно мест</label>
          <input
            type="number"
            id="passenger-count"
            value={passengerCount}
            onChange={handlePriceChange}
            placeholder="Кол-во мест"
          />
        </div>
      </div>
    </>
  )
}

export default Create
