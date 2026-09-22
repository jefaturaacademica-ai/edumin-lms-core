'use client';

import React from 'react';

export default function ConfiguracionRolesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración & Roles</h1>
        <p className="text-gray-500 mt-1">Gestión de paquetes predeterminados, plantillas de beneficios y control de accesos VIP.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-900 text-lg mb-2">Paquete COMPLETO</h4>
          <p className="text-sm text-gray-500 mb-4">3 Certificados modulares, 1 Diploma general, 3 Cursos cortos.</p>
          <button className="text-indigo-600 font-medium text-sm hover:underline">Configurar Plantilla →</button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-900 text-lg mb-2">Paquete FULL</h4>
          <p className="text-sm text-gray-500 mb-4">3 Modulares, 1 Diploma, 5 Cursos cortos, 1 Cert. CIP.</p>
          <button className="text-indigo-600 font-medium text-sm hover:underline">Configurar Plantilla →</button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-bold text-gray-900 text-lg mb-2">Paquete ILIMITADO</h4>
          <p className="text-sm text-gray-500 mb-4">Bloques de 15 cursos simultáneos con progresión automatizada.</p>
          <button className="text-indigo-600 font-medium text-sm hover:underline">Configurar Plantilla →</button>
        </div>
      </div>
    </div>
  );
}