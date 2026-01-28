import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ForecastChart from '../components/ai/ForecastChart'; // Import your chart
import AiTriggerButton from '../components/ai/AiTriggerButton'; // Import your button
import { FiPackage, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch product data
  const fetchProduct = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) return <MainLayout><div className="text-center mt-20">Loading AI Models...</div></MainLayout>;
  if (!product) return <MainLayout><div className="text-center mt-20">Product Not Found</div></MainLayout>;

  return (
    <MainLayout>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{product.name}</h1>
          <p className="text-slate-500 mt-1">SKU: {product.sku || 'N/A'} • Category: {product.category}</p>
        </div>
        <div className="flex gap-3">
            {/* The AI Trigger Button Lives Here */}
            <AiTriggerButton onAnalysisComplete={fetchProduct} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-blue-600"><FiPackage size={24}/></div>
            <div>
                <p className="text-sm text-slate-500">Current Stock</p>
                <h3 className="text-2xl font-bold">{product.quantity} Units</h3>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${product.ai_forecast?.trend === 'downtrend' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <FiTrendingUp size={24}/>
            </div>
            <div>
                <p className="text-sm text-slate-500">AI Trend Analysis</p>
                <h3 className="text-2xl font-bold capitalize">{product.ai_forecast?.trend || "Stable"}</h3>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-orange-50 rounded-xl text-orange-600"><FiAlertTriangle size={24}/></div>
            <div>
                <p className="text-sm text-slate-500">Predicted Stockout</p>
                <h3 className="text-2xl font-bold">{product.ai_forecast?.stock_out_date || "No Risk"}</h3>
            </div>
        </div>
      </div>

      {/* The AI Chart Section */}
      <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <ForecastChart product={product} />
      </div>

    </MainLayout>
  );
};

export default ProductDetails;