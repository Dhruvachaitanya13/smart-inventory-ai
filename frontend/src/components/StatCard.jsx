import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, alert }) => {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-slate-800'}`}>
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ${color}`}>
          {/* Renders the icon if provided */}
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;