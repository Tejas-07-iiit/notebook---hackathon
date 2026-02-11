import React from 'react';

const StatsCard = ({ icon, value, label, color }) => {
  const colorClasses = {
    note: { bg: '#e0e7ff', color: '#4361ee' },
    paper: { bg: '#fce7f3', color: '#f72585' },
    subject: { bg: '#d1fae5', color: '#10b981' }
  };

  const selectedColor = colorClasses[color] || colorClasses.note;

  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
};

export default StatsCard; // Make sure this is default export!