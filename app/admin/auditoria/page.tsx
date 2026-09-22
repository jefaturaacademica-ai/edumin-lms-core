'use client';

import React from 'react';

export default function AuditoriaWebhooksPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Auditoría & Webhooks</h1>
        <p className="text-gray-500 mt-1">Registro inmutable de acciones administrativas y estado de integraciones con n8n.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Centro de Webhooks (n8n / CRM)</h3>
        <p className="text-sm text-gray-500 mb-4">Endpoints activos para la sincronización automática de leads y pagos.</p>
        <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-gray-700 border border-gray-200">
          POST https://n8n.gcg-corp.com/webhook/edumin-plataforma
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Log de Auditoría de Usuarios</h3>
        <div className="text-sm text-gray-500">No hay eventos críticos registrados en la última hora.</div>
      </div>
    </div>
  );
}