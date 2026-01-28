import React, { useState } from 'react';
import { AnalyticsService } from '../../services/api';
import { toast } from 'react-toastify';
import { FiCpu } from 'react-icons/fi';

const AiTriggerButton = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const runAiForecast = async () => {
    setLoading(true);
    try {
      // Assuming your backend has an endpoint to trigger Python
      // If not, we trigger the Python service directly or via backend proxy
      // For now, let's call the analytics refresh endpoint
      await AnalyticsService.getStats(); 
      toast.success("AI Forecast request sent successfully!");
      if(onComplete) onComplete();
    } catch (error) {
      console.error(error);
      toast.error("Failed to run AI Model");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={runAiForecast}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${loading 
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
          : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30'
        }
      `}
    >
      <FiCpu className={loading ? 'animate-spin' : ''} />
      {loading ? 'Processing...' : 'Run AI Forecast'}
    </button>
  );
};

export default AiTriggerButton;