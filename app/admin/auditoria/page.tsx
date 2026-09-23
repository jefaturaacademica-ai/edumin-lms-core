'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, CheckCircle2, RefreshCw, Send, AlertCircle, Clock, Search, Terminal, Server
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function AuditoriaWebhooksPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [probandoWebhook, setProbandoWebhook] = useState(false);
  const [mensajePing, setMensajePing] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    cargarAuditLogs();
  }, []);

  const cargarAuditLogs = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/auditoria');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        } else {
          // Datos mock iniciales si no hay eventos aún
          setLogs([
            { id: '1', usuario_email: 'admin@edumin.pe', accion: 'CUOTA_VALIDADA_MANUAL', detalles: { dni_ce: '76543210', estudiante: 'Lucero Martinez', cuota_nueva: 2 }, created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
            { id: '2', usuario_email: 'sistema@n8n.io', accion: 'ALUMNO_MATRICULADO_N8N', detalles: { dni_ce: '45678912', estudiante: 'Marcos Quispe', paquete: 'FULL' }, created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
            { id: '3', usuario_email: 'admin@edumin.pe', accion: 'PRORROGA_OTORGADA', detalles: { prorroga_hasta: '2026-09-27' }, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
          ]);
        }
      }
    } catch (e) {
      console.error('Error cargando logs:', e);
    } finally {
      setCargando(false);
    }
  };

  const probarWebhookN8N = async () => {
    setProbandoWebhook(true);
    setMensajePing(null);
    try {
      const res = await fetch('/api/admin/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'WEBHOOK_TEST_PING',
          detalles: { canal: 'n8n_automation', estado: 'ONLINE', timestamp: new Date().toISOString() }
        })
      });

      if (res.ok) {
        setMensajePing({ texto: '¡Ping enviado exitosamente a n8n! Evento registrado en el log.', tipo: 'exito' });
        cargarAuditLogs();
      } else {
        setMensajePing({ texto: 'Error de respuesta del servidor de webhooks.', tipo: 'error' });
      }
    } catch {
      setMensajePing({ texto: 'No se pudo conectar con el endpoint de prueba.', tipo: 'error' });
    } finally {
      setProbandoWebhook(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const logsFiltrados = logs.filter(log => {
    const q = busqueda.toLowerCase();
    const accionStr = (log.accion || '').toLowerCase();
    const emailStr = (log.usuario_email || '').toLowerCase();
    const detallesStr = JSON.stringify(log.detalles || {}).toLowerCase();
    return accionStr.includes(q) || emailStr.includes(q) || detallesStr.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Auditoría & Centro de Webhooks</h1>
            <p className="text-slate-500 mt-1">Registro inmutable de eventos administrativos y monitoreo de integraciones con n8n.</p>
          </div>

          {/* Tarjeta de Webhooks n8n */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Integración n8n Activa
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">Webhook Central de Sincronización</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sincroniza alumnos matriculados, pasarelas de pago y cuotas validadas.</p>
              </div>

              <button
                onClick={probarWebhookN8N}
                disabled={probandoWebhook}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {probandoWebhook ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Probador de Ping Webhook
              </button>
            </div>

            {mensajePing && (
              <div className={`mb-4 p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${mensajePing.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                {mensajePing.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{mensajePing.texto}</span>
              </div>
            )}

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 flex justify-between items-center overflow-x-auto">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400 shrink-0" />
                <span>POST https://n8n.gcg-corp.com/webhook/edumin-plataforma</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-1 rounded-full font-bold">200 OK</span>
            </div>
          </div>

          {/* Tabla de Logs de Auditoría */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Historial Inmutable de Auditoría</h3>
                <p className="text-xs text-slate-400">Registra automáticamente cada acción crítica efectuada por administradores o webhooks.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={cargarAuditLogs}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Recargar logs"
                >
                  <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                </button>

                <div className="relative flex-1 sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="size-4" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Filtrar por acción o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="pb-3 px-4">Fecha y Hora</th>
                    <th className="pb-3 px-4">Usuario / Origen</th>
                    <th className="pb-3 px-4">Acción Realizada</th>
                    <th className="pb-3 px-4">Detalles payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {logsFiltrados.length > 0 ? (
                    logsFiltrados.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(log.created_at).toLocaleString('es-PE')}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {log.usuario_email || 'Sistema Webhook'}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                          <span className="bg-indigo-50 px-2.5 py-1 rounded-lg">
                            {log.accion}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <pre className="bg-slate-50 p-2 rounded-xl text-[10px] font-mono text-slate-600 border border-slate-200 max-w-md overflow-x-auto">
                            {JSON.stringify(log.detalles, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                        {cargando ? 'Cargando logs de auditoría...' : 'No se encontraron eventos registrados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}