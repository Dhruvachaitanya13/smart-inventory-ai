import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';

/**
 * ForecastChart Component
 * Visualizes historical sales data alongside AI-generated predictions.
 * * Features:
 * - Dual-tone area chart (History vs. Forecast).
 * - Dynamic Reference Line showing today's date.
 * - Custom Tooltip for detailed data points.
 * - Responsive container handling.
 */
const ForecastChart = ({ product, isLoading }) => {
  
  // 1. Data Transformation (Memoized for Performance)
  const chartData = useMemo(() => {
    if (!product || !product.history) return [];

    // Transform History
    const history = product.history.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      sales: item.sales,
      forecast: null,
      type: 'history'
    }));

    // Transform Forecast
    let forecast = [];
    if (product.ai_forecast?.forecast_data) {
      forecast = product.ai_forecast.forecast_data.map(item => ({
        date: new Date(item.ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: item.ds,
        sales: null,
        forecast: Math.max(0, Math.round(item.yhat)), // Clamp negative predictions
        lowerBound: item.yhat_lower,
        upperBound: item.yhat_upper,
        type: 'forecast'
      }));
    }

    return [...history, ...forecast];
  }, [product]);

  // 2. Loading State (Skeleton UI)
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px] animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 rounded mb-4"></div>
        <div className="h-full w-full bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  // 3. Empty State
  if (!product || chartData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-[400px] flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-slate-50 rounded-full mb-3">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Data Available</h3>
        <p className="text-slate-500 max-w-sm mt-1">
          This product does not have enough sales history to generate a forecast yet.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Demand Forecast Engine
            {product.ai_forecast?.trend === 'uptrend' && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full uppercase">Growth Detected</span>
            )}
          </h3>
          <p className="text-sm text-slate-500">Historical Sales vs. AI Prediction (Next 30 Days)</p>
        </div>
        
        {/* Confidence Badge */}
        {product.ai_forecast?.confidence && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium uppercase">Model Confidence:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
              product.ai_forecast.confidence === 'high' 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                : 'bg-yellow-50 text-yellow-700 border-yellow-100'
            }`}>
              {product.ai_forecast.confidence}
            </span>
          </div>
        )}
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748B', fontSize: 11}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748B', fontSize: 11}} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              labelStyle={{ color: '#64748B', marginBottom: '5px', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle"/>
            
            <ReferenceLine x={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#CBD5E1" strokeDasharray="3 3" label="Today" />

            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fill="url(#colorSales)" 
              name="Historical Sales"
              animationDuration={1500}
            />
            <Area 
              type="monotone" 
              dataKey="forecast" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              strokeDasharray="5 5"
              fill="url(#colorForecast)" 
              name="AI Prediction"
              animationDuration={1500}
              animationBegin={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

ForecastChart.propTypes = {
  product: PropTypes.shape({
    history: PropTypes.array,
    ai_forecast: PropTypes.shape({
      forecast_data: PropTypes.array,
      confidence: PropTypes.string,
      trend: PropTypes.string,
    }),
  }),
  isLoading: PropTypes.bool,
};

export default React.memo(ForecastChart);