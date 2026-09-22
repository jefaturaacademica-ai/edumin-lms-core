'use client';

import React, { useState } from 'react';

export default function CatalogoAdminPage() {
  const [activeTab, setActiveTab] = useState<'diplomados' | 'cursos' | 'carreras'>('diplomados');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos Académicos</h1>
          <p className="text-gray-500 mt-1">Estructura mallas curriculares, diplomados (3-5 unidades), cursos y carreras.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCsvModal(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
          >
            📂 Carga Masiva (CSV)
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-md flex items-center gap-2"
          >
            + Crear Nuevo Producto
          </button>
        </div>
      </div>

      {/* Pestañas de Navegación del Catálogo */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('diplomados')}
          className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
            activeTab === 'diplomados' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Diplomados (3 a 5 Unidades)
        </button>
        <button
          onClick={() => setActiveTab('cursos')}
          className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
            activeTab === 'cursos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cursos Cortos (1 Unidad)[cite: 7]
        </button>
        <button
          onClick={() => setActiveTab('carreras')}
          className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
            activeTab === 'carreras' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Carreras Técnico-Profesionales (Por Semestres)[cite: 7]
        </button>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o código..."
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <div className="flex gap-2">
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-full flex items-center">
              Filtro Activo: Todos los programas
            </span>
          </div>
        </div>

        {/* Tabla de Productos Académicos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Programa / Curso</th>
                <th className="pb-3 font-semibold">Tipo</th>
                <th className="pb-3 font-semibold">Estructura</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 font-semibold text-right">Acciones de Edición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <tr>
                <td className="py-4 font-medium text-gray-900">Seguridad, Salud Ocupacional y Medio Ambiente (SSOMA)</td>
                <td className="py-4 text-gray-500">Diplomado</td>
                <td className="py-4 text-gray-500">4 Unidades (Módulos)</td>
                <td className="py-4">
                  <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">Activo</span>
                </td>
                <td className="py-4 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium mr-3">Editar Árbol / Módulos</button>
                </td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-gray-900">Gestión de Presupuestos y Costos en Minería</td>
                <td className="py-4 text-gray-500">Curso Corto</td>
                <td className="py-4 text-gray-500">1 Unidad única</td>
                <td className="py-4">
                  <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">Activo</span>
                </td>
                <td className="py-4 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium mr-3">Editar Contenido</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal simulado para Carga Masiva por CSV / Plantilla */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Carga Masiva de Estructuras (CSV)</h3>
            <p className="text-sm text-gray-500 mb-4">Sube tu archivo para importar masivamente módulos, cursos y temas al sistema[cite: 7].</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 bg-gray-50">
              <span className="text-3xl mb-2 block">📄</span>
              <p className="text-sm font-medium text-gray-700">Arrastra tu archivo CSV aquí o haz clic para explorar</p>
              <span className="text-xs text-gray-400 mt-1 block">Soporta plantillas estructuradas de EDUMIN</span>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  alert('Simulación: Carga de CSV procesada correctamente.');
                  setShowCsvModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Importar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}