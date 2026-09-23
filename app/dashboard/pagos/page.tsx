'use client';

import { useState } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  FileText, 
  PhoneCall, 
  Eye, 
  Printer, 
  X, 
  ShieldCheck, 
  SlidersHorizontal,
  Award,
  Building2,
  GripVertical,
  Lock
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

export default function PagosEstudiantePage() {
  const { esOscuro } = useTheme();

  // Estados de simulación dev: 'al_dia' | 'completado' | 'bloqueo'
  const [modoPrueba, setModoPrueba] = useState<'al_dia' | 'completado' | 'bloqueo'>('al_dia');
  const [devToolbarVisible, setDevToolbarVisible] = useState(true);
  
  // Estado de posición y arrastre para el simulador dev
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Estado para el modal del recibo interno
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);

  const historialPagosAlDia = [
    { id: 1, cuota: 'Cuota 1 de 3', concepto: 'Matrícula + Primera Cuota Diplomado', monto: 300, fecha: '15/01/2026', comprobante: 'OP-882910', medio: 'Transferencia BCP', estado: 'Pagado' },
    { id: 2, cuota: 'Cuota 2 de 3', concepto: 'Segunda Cuota Académica', monto: 300, fecha: '15/02/2026', comprobante: 'OP-934122', medio: 'Yape / Plin', estado: 'Pagado' },
  ];

  const historialPagosCompletado = [
    { id: 1, cuota: 'Cuota 1 de 3', concepto: 'Matrícula + Primera Cuota Diplomado', monto: 300, fecha: '15/01/2026', comprobante: 'OP-882910', medio: 'Transferencia BCP', estado: 'Pagado' },
    { id: 2, cuota: 'Cuota 2 de 3', concepto: 'Segunda Cuota Académica', monto: 300, fecha: '15/02/2026', comprobante: 'OP-934122', medio: 'Yape / Plin', estado: 'Pagado' },
    { id: 3, cuota: 'Cuota 3 de 3', concepto: 'Tercera Cuota y Cancelación Total', monto: 300, fecha: '15/03/2026', comprobante: 'OP-991034', medio: 'PagoWeb Pasarela', estado: 'Pagado' },
  ];

  const historialActual = modoPrueba === 'completado' ? historialPagosCompletado : historialPagosAlDia;

  // Lógica de arrastre (Drag and Drop) para el panel flotante
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    if (!posicion) {
      setPosicion({ x: rect.left, y: rect.top });
    }
    setArrastrando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 60;
    setPosicion({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (arrastrando) {
      setArrastrando(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 relative pb-28 transition-colors ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera Principal */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 ${
            esOscuro ? 'text-white' : 'text-slate-900'
          }`}>
            <Wallet className={`w-7 h-7 ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`} />
            Estado de Cuenta y Tesorería
          </h1>
          <p className={`mt-1.5 text-sm ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
            Consulta tus cuotas pagadas, historial de transacciones, recibos de pago y estado financiero actual.
          </p>
        </div>

        {/* BANNERS DE ESTADO COMPACTOS (UNIFICADOS) */}
        {modoPrueba === 'al_dia' && (
          <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 border relative overflow-hidden transition-all ${
            esOscuro 
              ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-indigo-500/30' 
              : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border-indigo-500/30'
          }`}>
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Estado Financiero al Día
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ¡Tu cuenta se encuentra al día y en orden!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Gracias por tu puntualidad. Tus beneficios académicos y módulos de clase están <span className="font-bold text-white underline decoration-indigo-400">100% habilitados</span>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shrink-0 text-center flex flex-col items-center justify-center min-w-[160px] w-full sm:w-auto">
                <CheckCircle2 className="w-6 h-6 text-indigo-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Próximo Vencimiento</span>
                <span className="text-xs font-bold text-indigo-300 mt-0.5">15 DE OCTUBRE</span>
              </div>
            </div>
          </div>
        )}

        {modoPrueba === 'completado' && (
          <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 border relative overflow-hidden transition-all ${
            esOscuro 
              ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30' 
              : 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-emerald-500/30'
          }`}>
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> ¡Pago 100% Completado!
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ¡Has completado la totalidad de tus cuotas!
                </h2>
                <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
                  Felicitaciones, tu cuenta está <span className="font-bold text-white underline decoration-emerald-400">Libre de Deudas</span>. Certificados habilitados para emisión digital.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shrink-0 text-center flex flex-col items-center justify-center min-w-[160px] w-full sm:w-auto">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Estado Financiero</span>
                <span className="text-xs font-bold text-emerald-300 mt-0.5">COMPLETO Y AL DÍA</span>
              </div>
            </div>
          </div>
        )}

        {modoPrueba === 'bloqueo' && (
          <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 border relative overflow-hidden transition-all ${
            esOscuro 
              ? 'bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-950 border-rose-500/40' 
              : 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 border-rose-800/50'
          }`}>
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Notificación de Tesorería
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Acceso pausado temporalmente por cuotas pendientes
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Hemos detectado cuotas vencidas en tu cuenta. Tu navegación a las clases y contenidos ha sido restringida hasta regularizar el pago de tu saldo pendiente.
                </p>
              </div>

              {/* Caja de Insignia Lateral Derecha para Estado de Deuda */}
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shrink-0 text-center flex flex-col items-center justify-center min-w-[160px] w-full sm:w-auto">
                <Lock className="w-6 h-6 text-rose-400 mb-1 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Estado Financiero</span>
                <span className="text-xs font-bold text-rose-300 mt-0.5">ACCESO RESTRINGIDO</span>
              </div>
            </div>

            {/* Botones desplegados en la siguiente línea */}
            <div className="relative mt-4 pt-3 border-t border-rose-500/20 flex flex-wrap items-center gap-3">
              <a 
                href="https://wa.me/51900000000?text=Hola,%20deseo%20regularizar%20mi%20pago%20pendiente%20en%20EDUMIN" 
                target="_blank" 
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 shadow-md"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Hablar con Cobranzas (WhatsApp)
              </a>
              <button 
                onClick={() => alert('Redirigiendo a pasarela de pago segura...')}
                className="bg-white hover:bg-slate-100 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 shadow-md"
              >
                Pagar Cuota Ahora <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* BLOQUES DE MÉTRICAS ADAPTABLES AL TEMA (ORDEN: Monto Total -> Total Pagado -> Saldo Pendiente) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* KPI 1: Monto Total (Identidad Cromática Cyan / Sky) */}
          <div className={`rounded-2xl p-6 transition-all ${
            esOscuro 
              ? 'bg-cyan-950/20 border border-cyan-500/30 shadow-sm' 
              : 'bg-cyan-50/60 border border-cyan-200 shadow-sm'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              esOscuro ? 'text-cyan-400' : 'text-cyan-600'
            }`}>Monto Total del Paquete</span>
            <h3 className={`text-2xl sm:text-3xl font-bold mt-1.5 ${
              esOscuro ? 'text-cyan-300' : 'text-cyan-700'
            }`}>S/ 900.00</h3>
            <p className={`text-xs font-medium mt-1 ${
              esOscuro ? 'text-cyan-400/80' : 'text-cyan-800'
            }`}>
              {modoPrueba === 'completado' ? '✓ Paquete Full (3 cuotas liquidadas)' : 'Paquete Full (3 cuotas programadas)'}
            </p>
          </div>

          {/* KPI 2: Total Pagado (Identidad Cromática Emerald) */}
          <div className={`rounded-2xl p-6 transition-all ${
            esOscuro 
              ? 'bg-emerald-950/20 border border-emerald-500/30 shadow-sm' 
              : 'bg-emerald-50/60 border border-emerald-200 shadow-sm'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              esOscuro ? 'text-emerald-400' : 'text-emerald-600'
            }`}>Total Pagado</span>
            <h3 className={`text-2xl sm:text-3xl font-bold mt-1.5 ${
              esOscuro ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              {modoPrueba === 'completado' && 'S/ 900.00'}
              {modoPrueba === 'al_dia' && 'S/ 600.00'}
              {modoPrueba === 'bloqueo' && 'S/ 300.00'}
            </h3>
            <p className={`text-xs font-medium mt-1 ${
              esOscuro ? 'text-emerald-300/80' : 'text-emerald-800'
            }`}>
              {modoPrueba === 'completado' && '✓ 100% Cancelado (3/3 cuotas)'}
              {modoPrueba === 'al_dia' && '2 cuotas validadas por tesorería'}
              {modoPrueba === 'bloqueo' && '1 cuota validada de 3'}
            </p>
          </div>

          {/* KPI 3: Saldo Pendiente (Identidad Cromática Indigo / Rose / Slate) */}
          <div className={`rounded-2xl p-6 transition-all ${
            modoPrueba === 'bloqueo' 
              ? esOscuro ? 'bg-rose-950/25 border border-rose-500/30 shadow-sm' : 'bg-rose-50/60 border border-rose-200 shadow-sm'
              : modoPrueba === 'al_dia'
                ? esOscuro ? 'bg-indigo-950/20 border border-indigo-500/30 shadow-sm' : 'bg-indigo-50/60 border border-indigo-200 shadow-sm'
                : esOscuro ? 'bg-slate-900/90 border border-slate-800 shadow-sm' : 'bg-slate-100/60 border border-slate-200 shadow-sm'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              modoPrueba === 'bloqueo' 
                ? esOscuro ? 'text-rose-400' : 'text-rose-600'
                : modoPrueba === 'al_dia' 
                  ? esOscuro ? 'text-indigo-400' : 'text-indigo-600'
                  : 'text-slate-400'
            }`}>
              Saldo Pendiente
            </span>
            <h3 className={`text-2xl sm:text-3xl font-bold mt-1.5 ${
              modoPrueba === 'bloqueo' 
                ? esOscuro ? 'text-rose-400 font-extrabold' : 'text-rose-600 font-extrabold'
                : modoPrueba === 'al_dia' 
                  ? esOscuro ? 'text-indigo-400' : 'text-indigo-600'
                  : esOscuro ? 'text-slate-400' : 'text-slate-400'
            }`}>
              {modoPrueba === 'completado' && 'S/ 0.00'}
              {modoPrueba === 'al_dia' && 'S/ 300.00'}
              {modoPrueba === 'bloqueo' && 'S/ 600.00'}
            </h3>
            <div className="mt-1">
              {modoPrueba === 'completado' && (
                <p className={`text-xs font-semibold ${esOscuro ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Sin deudas ni saldos pendientes
                </p>
              )}
              {modoPrueba === 'al_dia' && (
                <p className={`text-xs font-medium ${esOscuro ? 'text-indigo-300/80' : 'text-indigo-800'}`}>
                  1 cuota restante por vencer
                </p>
              )}
              {modoPrueba === 'bloqueo' && (
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  esOscuro 
                    ? 'text-rose-300 bg-rose-500/20 border-rose-500/30' 
                    : 'text-rose-700 bg-rose-100 border-rose-200'
                }`}>
                  ⚠️ 2 cuotas vencidas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE HISTORIAL DE COMPROBANTES ADAPTABLE AL TEMA */}
        <div className={`rounded-2xl p-6 sm:p-8 transition-all ${
          esOscuro 
            ? 'bg-slate-900/90 border border-slate-800' 
            : 'bg-white border border-slate-200 shadow-sm'
        }`}>
          <h3 className={`text-lg font-bold mb-6 flex items-center justify-between ${
            esOscuro ? 'text-white' : 'text-slate-900'
          }`}>
            <span className="flex items-center gap-2">
              <FileText className={`w-5 h-5 ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`} />
              Historial de Comprobantes Registrados
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              esOscuro ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-100 border-slate-200'
            }`}>
              {historialActual.length} registro(s) verificado(s)
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  esOscuro ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                }`}>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Fecha de Validación</th>
                  <th className="py-3 px-4">N° Operación / Medio</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${
                esOscuro ? 'divide-slate-800/60' : 'divide-slate-100'
              }`}>
                {historialActual.map((pago) => (
                  <tr key={pago.id} className={`transition-colors ${
                    esOscuro ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/70'
                  }`}>
                    <td className={`py-4 px-4 font-semibold ${
                      esOscuro ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      <div>{pago.cuota}</div>
                      <div className="text-xs text-slate-400 font-normal">{pago.concepto}</div>
                    </td>
                    <td className={`py-4 px-4 font-bold ${
                      esOscuro ? 'text-white' : 'text-slate-900'
                    }`}>S/ {pago.monto}.00</td>
                    <td className="py-4 px-4 text-slate-400 text-xs">{pago.fecha}</td>
                    <td className="py-4 px-4">
                      <div className={`font-mono text-xs font-bold ${
                        esOscuro ? 'text-indigo-400' : 'text-indigo-600'
                      }`}>{pago.comprobante}</div>
                      <div className="text-[11px] text-slate-400">{pago.medio}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 ${
                        esOscuro 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${esOscuro ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        {pago.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setReciboSeleccionado(pago)}
                        className={`inline-flex items-center gap-1.5 font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors border shadow-sm ${
                          esOscuro 
                            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/20' 
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/60'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL DE RECIBO INTERNO (ADAPTABLE AL TEMA) */}
      {reciboSeleccionado && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 ${
          esOscuro ? 'bg-slate-950/80' : 'bg-slate-900/60'
        }`}>
          <div className={`rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative border overflow-hidden animate-in zoom-in-95 duration-200 ${
            esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Botón de Cierre */}
            <button 
              onClick={() => setReciboSeleccionado(null)}
              className={`absolute right-6 top-6 transition-colors p-2 rounded-full ${
                esOscuro ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Cabecera de Recibo Interno */}
            <div className={`border-b pb-5 mb-5 ${esOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-xl ${esOscuro ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-white'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${esOscuro ? 'text-white' : 'text-slate-900'}`}>EDUMIN ACADEMY LMS</h3>
                  <p className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>Recibo de Pago Interno e Historial Institucional</p>
                </div>
              </div>
              <div className={`mt-4 flex items-center justify-between text-xs p-3 rounded-xl border ${
                esOscuro ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-mono ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>N° RECIBO: <strong className={esOscuro ? 'text-slate-200' : 'text-slate-800'}>REC-2026-00{reciboSeleccionado.id}89</strong></span>
                <span className={`font-bold px-2.5 py-1 rounded-md border ${
                  esOscuro ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                }`}>VALIDADO EN SISTEMA</span>
              </div>
            </div>

            {/* Detalles del Recibo */}
            <div className="space-y-4 text-sm mb-6">
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-2xl border ${
                esOscuro ? 'bg-slate-950/60 border-slate-800/60' : 'bg-slate-50/70 border-slate-100'
              }`}>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Estudiante:</span>
                  <span className={`font-bold ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>Juan Carlos Quispe Mamani</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">DNI / CE:</span>
                  <span className={`font-mono font-semibold ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>73849201</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Fecha de Emisión:</span>
                  <span className={`font-medium ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>{reciboSeleccionado.fecha}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Operación Bancaria:</span>
                  <span className={`font-mono font-bold ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>{reciboSeleccionado.comprobante}</span>
                </div>
              </div>

              {/* Desglose del Pago */}
              <div className={`border rounded-2xl p-4 ${
                esOscuro ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
              }`}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Desglose de Concepto</div>
                <div className={`flex justify-between items-center py-2 border-b ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div>
                    <span className={`font-semibold ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>{reciboSeleccionado.cuota}</span>
                    <p className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>{reciboSeleccionado.concepto}</p>
                  </div>
                  <span className={`font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>S/ {reciboSeleccionado.monto}.00</span>
                </div>
                <div className="flex justify-between items-center pt-3 text-base">
                  <span className={`font-bold ${esOscuro ? 'text-slate-200' : 'text-slate-900'}`}>Total Abonado:</span>
                  <span className={`font-extrabold text-xl ${esOscuro ? 'text-emerald-400' : 'text-emerald-600'}`}>S/ {reciboSeleccionado.monto}.00 PEN</span>
                </div>
              </div>

              {/* Sello de Seguridad */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${
                esOscuro 
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30' 
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}>
                <ShieldCheck className={`w-5 h-5 shrink-0 ${esOscuro ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>
                  Documento digital verificado por la Oficina de Tesorería EDUMIN. Código Hash: <strong className="font-mono">8f92a110b49c</strong>
                </span>
              </div>
            </div>

            {/* Acciones de Impresión / Descarga */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => window.print()} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
              <button 
                onClick={() => setReciboSeleccionado(null)}
                className={`font-bold px-5 py-3 rounded-xl text-sm transition-colors ${
                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOTANTE DE SIMULADOR DEV ARRASTRABLE (DRAGGABLE DEV TOOLBAR) */}
      <aside 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={posicion ? { left: `${posicion.x}px`, top: `${posicion.y}px`, right: 'auto', bottom: 'auto' } : { bottom: '24px', right: '24px' }}
        className="fixed z-50 touch-none select-none"
      >
        {devToolbarVisible ? (
          <div className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-xl w-72 animate-in slide-in-from-bottom-5 duration-300 ${
            esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-950 border-slate-800 text-slate-100'
          }`}>
            {/* Header del Simulador con Manija de Arrastre */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  DEV SIMULATOR
                </span>
              </div>
              <button 
                onClick={() => setDevToolbarVisible(false)}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Minimizar Simulador"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-3 leading-tight">
              Sostén y arrastra este panel a cualquier parte de la pantalla:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setModoPrueba('al_dia')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  modoPrueba === 'al_dia' 
                    ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400/50' 
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>1. Al Día (Parcial 2/3)</span>
                {modoPrueba === 'al_dia' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>

              <button
                onClick={() => setModoPrueba('completado')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  modoPrueba === 'completado' 
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/50' 
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>2. 100% Pagado (Libre de Deuda)</span>
                {modoPrueba === 'completado' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>

              <button
                onClick={() => setModoPrueba('bloqueo')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  modoPrueba === 'bloqueo' 
                    ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400/50' 
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>3. Con Deuda (Bloqueo)</span>
                {modoPrueba === 'bloqueo' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setDevToolbarVisible(true)}
            className="bg-slate-950 hover:bg-slate-900 text-amber-400 border border-amber-400/30 px-4 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5 text-amber-500" />
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Dev Simulator</span>
          </button>
        )}
      </aside>

    </main>
  );
}