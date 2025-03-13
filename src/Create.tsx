import "react-datepicker/dist/react-datepicker.css";
import './App.css'
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { registerLocale } from "react-datepicker";
import { ru } from "date-fns/locale/ru"; // Import Russian locale from date-fns
import { useState, useEffect } from 'react'

const cityList = [
  { value: 'bishkek', label: 'Бишкек' },
  { value: 'osh', label: 'Ош' },
  { value: 'karakol', label: 'Каракол' },
  { value: 'naryn', label: 'Нарын' },
  { value: 'talas', label: 'Талас' },
  { value: 'batken', label: 'Баткен' },
];

function Create() {
  const [cityA, setCityA] = useState<any>(null)
  const [cityB, setCityB] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<any>(new Date())
  const [passengerCount, setPassengerCount] = useState<number | string>(1);

  useEffect(() => {
    // TODO
    // 1. Get last search details and set cityA, cityB selectedDate is today
    // 2. Perform the search, update trips
    // 3. Load offers and update proposedPrices
    console.log("hello")
    registerLocale('ru', ru)
  }, [])

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
            onChange={setSelectedDate}
            showTimeSelect
            dateFormat="d MMMM yyyy в HH:mm"
            onFocus={e => e.target.blur()}
            customInput={<DatePicker readOnly />}
            locale="ru"
            timeIntervals={30}
          />
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
        <div className="select-container">
          <button onClick={function(){}}>
            Отправить
          </button>
        </div>
      </div>
    </>
  )
}

export default Create
