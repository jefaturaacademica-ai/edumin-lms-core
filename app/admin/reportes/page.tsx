'use client';

import React from 'react';

export default function ReportesGerencialesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes Gerenciales</h1>
          <p className="text-gray-500 mt-1">Métricas globales de ingresos, volumen de ventas y proyecciones.</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition shadow-md">
          Exportar Reporte General (Excel/CSV)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] flex items-center justify-center text-gray-400">
        Gráficos analíticos y reportes de tesorería en tiempo real.
      </div>
    </div>
  );
}