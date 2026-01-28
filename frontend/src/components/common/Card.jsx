import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ children, title, action, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
};

export default Card;