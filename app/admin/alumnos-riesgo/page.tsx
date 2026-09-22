'use client';

import React from 'react';

export default function AlumnosRiesgoPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Base & Alumnos en Riesgo</h1>
        <p className="text-gray-500 mt-1">Control de estudiantes con restricciones financieras o bajo avance modular.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Alumnos con Deuda Activa</p>
          <h3 className="text-2xl font-bold text-red-600 mt-2">14</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Bloqueados por Sistema</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-2">6</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Base Estudiantil</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">128</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Lista de Seguimiento Prioritario</h3>
        <p className="text-sm text-gray-500">Aquí se listarán los alumnos filtrados automáticamente por el motor de cuotas vencidas.</p>
      </div>
    </div>
  );
}