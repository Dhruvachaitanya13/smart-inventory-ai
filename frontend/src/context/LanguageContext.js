import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const TRANSLATIONS = {
  EN: {
    // Sidebar
    nav_dashboard: "Dashboard",
    nav_inventory: "Global Inventory",
    nav_analytics: "AI & Analytics",
    nav_reports: "Reports & Logs",
    nav_settings: "System Settings",
    nav_logout: "Log Out",
    
    // Header
    search_placeholder: "Search assets, SKUs, or orders...",
    
    // Dashboard
    dash_welcome: "AI Command Center",
    dash_subtitle: "Real-time telemetry and predictive modeling.",
    dash_best_model: "Optimal Model Selected:",
    dash_acc: "Accuracy:",
    kpi_assets: "Total Assets",
    kpi_value: "Inventory Value",
    kpi_risk: "Risk Alerts",
    kpi_import: "Imports",
    
    // Inventory
    inv_empty: "No Inventory Data Found",
    inv_import_btn: "Import Dataset",
    inv_export_btn: "Export CSV",
    inv_seed_btn: "Seed Demo Data",
    inv_add_btn: "Add Item",
    inv_search_ph: "Search by Name, SKU, Category...",
    
    // Settings
    set_general: "General Settings",
    set_account: "Account Management",
    set_notif: "Notifications",
    set_ai: "AI Parameters",
    set_toggles: {
      theme: "Dark Mode Interface",
      autosave: "Auto-Save Configuration",
      beta: "Enable Beta AI Features"
    }
  },
  ES: {
    nav_dashboard: "Tablero",
    nav_inventory: "Inventario Global",
    nav_analytics: "Analítica AI",
    nav_reports: "Reportes",
    nav_settings: "Configuración",
    nav_logout: "Cerrar Sesión",
    search_placeholder: "Buscar activos...",
    dash_welcome: "Centro de Comando AI",
    dash_subtitle: "Telemetría en tiempo real.",
    dash_best_model: "Modelo Óptimo:",
    dash_acc: "Precisión:",
    kpi_assets: "Activos Totales",
    kpi_value: "Valor Inventario",
    inv_empty: "No se encontraron datos",
    inv_import_btn: "Importar CSV",
    inv_seed_btn: "Sembrar Datos",
    set_general: "Ajustes Generales",
  }
  // Add other languages as needed
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'EN');
  useEffect(() => localStorage.setItem('lang', lang), [lang]);
  
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['EN'][key] || key;
  const tNested = (group, key) => TRANSLATIONS[lang]?.[group]?.[key] || TRANSLATIONS['EN']?.[group]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tNested }}>
      {children}
    </LanguageContext.Provider>
  );
};