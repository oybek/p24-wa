import React, { useState } from 'react';

function OfferPriceInput() {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState('');

  const handleClick = () => {
    setShowInput(true);
  };

  const handleChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setValue(e.target.value);
  };

  const handleBlur = () => {
    setShowInput(false);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          padding: '20px',
          background: 'lightblue',
          textAlign: 'center',
          width: '200px',
          margin: '0 auto',
        }}
      >
        Click to enter a number
      </div>

      {showInput && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid black',
            zIndex: 1000,
          }}
        >
          <input
            type="number"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: '100px',
              padding: '5px',
              fontSize: '16px',
              textAlign: 'center',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OfferPriceInput;
