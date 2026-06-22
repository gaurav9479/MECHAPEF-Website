import React from "react";
import "./RedInclinedStrips.css";

// Added 'shiftX' prop. It defaults to "0%" so it behaves exactly as it did before if you don't use it.
const RedStrips = ({ index = 0, shiftX = "0%" }) => {
  
  // THE MAGIC MATH: Keeps the continuous diagonal slice across sections
  const offset = `${index * 46.63}vh`;

  return (
    <div className="red-strips-container">
      {/* We add shiftX to every calculation. 
          Because it is anchored to the 'right' side of the screen:
          - A positive value (like "10%") pushes the strips to the LEFT.
          - A negative value (like "-10%") pulls the strips to the RIGHT.
      */}
      <div 
        className="strip-main" 
        style={{ right: `calc(-10% + ${offset} + ${shiftX})` }}
      ></div>
      
      <div 
        className="strip-secondary" 
        style={{ right: `calc(15% + ${offset} + ${shiftX})` }}
      ></div>
      
      <div 
        className="strip-third" 
        style={{ right: `calc(35% + ${offset} + ${shiftX})` }}
      ></div>
    </div>
  );
};

export default RedStrips;