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
  GripVertical
} from 'lucide-react';

export default function PagosEstudiantePage() {
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
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 lg:p-16 text-slate-900 relative pb-28">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera Principal */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-indigo-600" />
            Estado de Cuenta y Tesorería
          </h1>
          <p className="mt-2 text-slate-500">
            Consulta tus cuotas pagadas, historial de transacciones, recibos de pago y estado financiero actual.
          </p>
        </div>

        {/* CONTENIDO SEGÚN ESTADO DE SIMULACIÓN */}
        {modoPrueba === 'al_dia' && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex items-center gap-4 text-emerald-900 shadow-sm">
              <div className="size-12 rounded-2xl bg-emerald-500 text-white grid place-items-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¡Tu cuenta está en orden!</h3>
                <p className="text-sm text-emerald-700">Gracias por tu puntualidad. Tus beneficios y módulos académicos están completamente habilitados.</p>
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
                <p className="text-xs text-slate-500 mt-1">1 cuota restante por vencer</p>
              </div>
            </div>
          </>
        )}

        {modoPrueba === 'completado' && (
          <>
            {/* Banner de Pagos Completados 100% */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl mb-8 border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-64 bg-emerald-500/10 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold">
                    <Award className="w-4 h-4 text-emerald-400" /> ¡Pago 100% Completado!
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    ¡Has completado la totalidad de tus cuotas!
                  </h2>
                  <p className="text-emerald-100/80 text-sm leading-relaxed">
                    Felicitaciones, tu estado de cuenta se encuentra <span className="font-bold text-white underline decoration-emerald-400">Libre de Deudas</span>. Tus certificados y constancias oficiales están 100% habilitados para emisión digital.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center shrink-0 w-full md:w-auto text-center">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Estado Financiero</span>
                  <span className="text-lg font-extrabold text-emerald-300 mt-0.5">COMPLETO Y AL DÍA</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monto Total del Paquete</span>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">S/ 900.00</h3>
                <p className="text-xs text-slate-500 mt-1">Paquete Full (3 cuotas liquidadas)</p>
              </div>

              <div className="bg-white rounded-3xl p-7 shadow-sm border border-emerald-200 bg-emerald-50/20">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Pagado</span>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2">S/ 900.00</h3>
                <p className="text-xs text-emerald-700 font-semibold mt-1">✓ 100% Cancelado (3/3 cuotas)</p>
              </div>

              <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Saldo Pendiente</span>
                <h3 className="text-3xl font-bold text-slate-400 mt-2">S/ 0.00</h3>
                <p className="text-xs text-emerald-600 font-bold mt-1">Sin deudas ni saldos pendientes</p>
              </div>
            </div>
          </>
        )}

        {modoPrueba === 'bloqueo' && (
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

        {/* TABLA DE HISTORIAL DE COMPROBANTES CON ÚNICO TÉRMINO: RECIBO */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Historial de Comprobantes Registrados
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {historialActual.length} registro(s) verificado(s)
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Fecha de Validación</th>
                  <th className="py-3 px-4">N° Operación / Medio</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {historialActual.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      <div>{pago.cuota}</div>
                      <div className="text-xs text-slate-400 font-normal">{pago.concepto}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">S/ {pago.monto}.00</td>
                    <td className="py-4 px-4 text-slate-500 text-xs">{pago.fecha}</td>
                    <td className="py-4 px-4">
                      <div className="font-mono text-xs text-indigo-600 font-bold">{pago.comprobante}</div>
                      <div className="text-[11px] text-slate-400">{pago.medio}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {pago.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setReciboSeleccionado(pago)}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-colors border border-indigo-200/60 shadow-sm"
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

      {/* MODAL DE RECIBO INTERNO */}
      {reciboSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl relative border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900">
            
            {/* Botón de Cierre */}
            <button 
              onClick={() => setReciboSeleccionado(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Cabecera de Recibo Interno */}
            <div className="border-b border-slate-200 pb-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-slate-950 text-white rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">EDUMIN ACADEMY LMS</h3>
                  <p className="text-xs text-slate-500">Recibo de Pago Interno e Historial Institucional</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-slate-500">N° RECIBO: <strong className="text-slate-800">REC-2026-00{reciboSeleccionado.id}89</strong></span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">VALIDADO EN SISTEMA</span>
              </div>
            </div>

            {/* Detalles del Recibo */}
            <div className="space-y-4 text-sm mb-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Estudiante:</span>
                  <span className="font-bold text-slate-800">Juan Carlos Quispe Mamani</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">DNI / CE:</span>
                  <span className="font-mono font-semibold text-slate-800">73849201</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Fecha de Emisión:</span>
                  <span className="font-medium text-slate-700">{reciboSeleccionado.fecha}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Operación Bancaria:</span>
                  <span className="font-mono font-bold text-indigo-600">{reciboSeleccionado.comprobante}</span>
                </div>
              </div>

              {/* Desglose del Pago */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Desglose de Concepto</div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">{reciboSeleccionado.cuota}</span>
                    <p className="text-xs text-slate-500">{reciboSeleccionado.concepto}</p>
                  </div>
                  <span className="font-bold text-slate-900">S/ {reciboSeleccionado.monto}.00</span>
                </div>
                <div className="flex justify-between items-center pt-3 text-base">
                  <span className="font-bold text-slate-900">Total Abonado:</span>
                  <span className="font-extrabold text-xl text-emerald-600">S/ {reciboSeleccionado.monto}.00 PEN</span>
                </div>
              </div>

              {/* Sello de Seguridad */}
              <div className="flex items-center gap-3 bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Documento digital verificado por la Oficina de Tesorería EDUMIN. Código Hash: <strong className="font-mono">8f92a110b49c</strong>
                </span>
              </div>
            </div>

            {/* Acciones de Impresión / Descarga */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => window.print()} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
              <button 
                onClick={() => setReciboSeleccionado(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm transition-colors"
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
          <div className="bg-slate-950 text-slate-100 p-4 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-xl w-72 animate-in slide-in-from-bottom-5 duration-300">
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
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
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
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
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
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
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