import './App.css'
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { useState } from 'react'
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [_, setCount] = useState(0)
  const [cityA, setCityA] = useState<any>(null)
  const [cityB, setCityB] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<any>(new Date());

  const cityList = [
    { value: 'bishkek', label: 'Бишкек' },
    { value: 'osh', label: 'Ош' },
    { value: 'karakol', label: 'Каракол' },
    { value: 'naryn', label: 'Нарын' },
    { value: 'talas', label: 'Талас' },
    { value: 'batken', label: 'Баткен' },
  ];

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
        <div className="select-container">
          <label htmlFor="first-select">Когда</label>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            showTimeSelect={false}
            dateFormat="d MMMM yyyy"
            customInput={<DatePicker readOnly onFocus={(e) => e.preventDefault()} />}
          />
        </div>
        <div className="select-container">
          <button onClick={() => setCount((count) => count + 1)}>
            Посмотреть попутчиков
          </button>
        </div>
        <div>
          <div className="card1">
            Бишкек - Каракол 🕙 09:00 👤x1 <b>Aybek</b>
          </div>
          <div className="card1">
            Бишкек - Каракол 🕙 10:00 👤x2 <b>Begulan</b>
          </div>
          <div className="card1">
            Бишкек - Каракол 🕙 11:00 👤x1 <b>Aiturgan</b>
          </div>
          <div className="card1">
            Бишкек - Каракол 🕙 13:00 👤x3 <b>Beka</b>
          </div>
        </div>
        <p className="read-the-docs">
          ОсОО "Тамбапс"
        </p>
      </div>
    </>
  )
}

export default App
