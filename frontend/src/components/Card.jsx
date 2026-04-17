import React from 'react';

const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
