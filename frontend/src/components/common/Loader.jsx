import React from 'react';

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      {text && <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};

export default Loader;