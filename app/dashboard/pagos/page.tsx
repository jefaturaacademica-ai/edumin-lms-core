'use client';

import { useState } from 'react';
import { Wallet, CheckCircle2, AlertCircle, ArrowUpRight, FileText, PhoneCall } from 'lucide-react';

export default function PagosEstudiantePage() {
  const [modoPrueba, setModoPrueba] = useState<'normal' | 'bloqueo'>('normal');

  const historialPagos = [
    { id: 1, cuota: 'Cuota 1 de 3', monto: 300, fecha: '15/01/2026', comprobante: 'OP-882910', estado: 'Pagado' },
    { id: 2, cuota: 'Cuota 2 de 3', monto: 300, fecha: '15/02/2026', comprobante: 'OP-934122', estado: 'Pagado' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 lg:p-16 text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera y Switch de simulación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-indigo-600" />
              Estado de Cuenta y Tesorería
            </h1>
            <p className="mt-2 text-slate-500">
              Consulta tus cuotas pagadas, historial de transacciones y estado financiero actual.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <span className="text-xs font-bold text-slate-500 ml-2">Simular Estado:</span>
            <button
              onClick={() => setModoPrueba('normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                modoPrueba === 'normal' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Al Día
            </button>
            <button
              onClick={() => setModoPrueba('bloqueo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                modoPrueba === 'bloqueo' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Con Deuda (Bloqueo)
            </button>
          </div>
        </div>

        {modoPrueba === 'normal' ? (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex items-center gap-4 text-emerald-900 shadow-sm">
              <div className="size-12 rounded-2xl bg-emerald-500 text-white grid place-items-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¡Tu cuenta está en orden!</h3>
                <p className="text-sm text-emerald-700">Gracias por tu puntualidad. Tus beneficios y módulos están completamente habilitados.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monto Total del Paquete</span>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">S/ 900.00</h3>
                <p className="text-xs text-slate-500 mt-1">Paquete Full (3 cuotas programadas)</p>
              </div>

              <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Pagado</span>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2">S/ 600.00</h3>
                <p className="text-xs text-emerald-700 mt-1">2 cuotas validadas por tesorería</p>
              </div>

              <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Saldo Pendiente</span>
                <h3 className="text-3xl font-bold text-indigo-600 mt-2">S/ 300.00</h3>
                <p className="text-xs text-slate-500 mt-1">1 cuota restante</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-10 border border-rose-800/50">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
                <AlertCircle className="w-4 h-4" /> Notificación de Tesorería
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Acceso pausado temporalmente por cuotas pendientes</h2>
              <p className="mt-4 text-slate-300 text-base leading-relaxed">
                Hemos detectado cuotas vencidas en tu cuenta. Tu navegación a las clases y contenidos ha sido restringida hasta regularizar el pago de tu saldo pendiente.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://wa.me/51900000000?text=Hola,%20deseo%20regularizar%20mi%20pago%20pendiente%20en%20EDUMIN" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  <PhoneCall className="w-4 h-4" /> Hablar con Cobranzas (WhatsApp)
                </a>
                <button 
                  onClick={() => alert('Redirigiendo a pasarela de pago segura...')}
                  className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-8 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  Pagar Cuota Ahora <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Historial de Comprobantes Registrados
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Fecha de Validación</th>
                  <th className="py-3 px-4">N° de Operación</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {historialPagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-800">{pago.cuota}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">S/ {pago.monto}.00</td>
                    <td className="py-4 px-4 text-slate-500 text-xs">{pago.fecha}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600">{pago.comprobante}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">
                        {pago.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}