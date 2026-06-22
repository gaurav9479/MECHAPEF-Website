import React from 'react';
import './RedInclinedStrips.css';

const RedInclinedStrips = ({ index = 0, shiftX = "-20%" }) => {
  
  const offsetVh = index * 46.63;

  return (
    <div className="red-strips-container">
      <div 
        className="strip-main"
        style={{ right: `calc(0% + ${shiftX} + ${offsetVh}vh)` }}
      ></div>
      <div 
        className="strip-secondary"
        style={{ right: `calc(30% + ${shiftX} + ${offsetVh}vh)` }}
      ></div>
      <div 
        className="strip-third"
        style={{ right: `calc(39% + ${shiftX} + ${offsetVh}vh)` }}
      ></div>
    </div>
  );
};

export default RedInclinedStrips;