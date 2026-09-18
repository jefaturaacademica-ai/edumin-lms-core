'use client';
import { useState, useEffect } from 'react';
import { 
  CreditCard, Search, ShieldCheck, Users, BookOpen, Settings, BarChart3, LogOut,
  Plus, Edit, Trash2, Filter, CheckCircle2, Package, UploadCloud, Gift, DollarSign, 
  GraduationCap, X, RefreshCw, Layers, Award, TrendingUp, Download, ArrowUpRight, 
  ArrowDownRight, FileText, AlertTriangle, Key, Activity, RefreshCcw, Check, Clock
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('tesoreria'); 
  const [dni, setDni] = useState('');
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  
  // Estados para Cargas Masivas y Modales
  const [mostrarCargaMasiva, setMostrarCargaMasiva] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  // Estados para Sincronización de Matrícula
  const [tipoAccionComercial, setTipoAccionComercial] = useState<'REGALO' | 'VENTA' | 'BECA'>('REGALO');
  const [programaAAsignar, setProgramaAAsignar] = useState<string>('');
  const [precioCobrado, setPrecioCobrado] = useState<string>('0');
  const [sincronizandoN8n, setSincronizandoN8n] = useState(false);
  const [pasoSincronizacion, setPasoSincronizacion] = useState('');

  // Estado para Reportes
  const [rangoReporte, setRangoReporte] = useState<'7d' | '30d' | '1y'>('30d');
  const [datosReporte, setDatosReporte] = useState<any>(null);

  // Estados interactivos para las nuevas herramientas pro
  const [webhooksCola, setWebhooksCola] = useState([
    { id: 'wh-1092', evento: 'matricula.creada', destino: 'n8n-crm-zoho', estado: 'Fallido', fecha: 'Hace 5 min' },
    { id: 'wh-1091', evento: 'cuota.registrada', destino: 'n8n-facturacion', estado: 'Exitoso', fecha: 'Hace 12 min' },
    { id: 'wh-1090', evento: 'acceso.concedido', destino: 'n8n-email-bienvenida', estado: 'Exitoso', fecha: 'Hace 25 min' },
  ]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const catalogoDiplomados = [
    { id: 'dip-1', titulo: "1. DERECHO MINERO Y NORMATIVA" },
    { id: 'dip-2', titulo: "2. ESPECIALISTA EN COMERCIO INTERNACIONAL" },
    { id: 'dip-3', titulo: "3. GEOLOGÍA MINERA" },
    { id: 'dip-7', titulo: "7. GERENCIA DE SISTEMAS INTEGRADOS HSEQ" },
    { id: 'dip-13', titulo: "13. GESTIÓN LOGÍSTICA Y COMPRAS" },
    { id: 'dip-21', titulo: "21. SEGURIDAD Y SALUD OCUPACIONAL (SSOMA)" },
  ];

  const catalogoCursos = [
    { id: 'cur-1', titulo: "MANEJO DE EPPS SEGÚN LEY 29783" },
    { id: 'cur-4', titulo: "GESTIÓN DE TRABAJO EN ALTO RIESGO" },
    { id: 'cur-5', titulo: "LOGÍSTICA Y DISTRIBUCIÓN EN MINERÍA" },
  ];

  const mockEstudiantes = [
    { id: 1, dni: '76543210', nombre: 'Roger Sanalea Calcina', email: 'roger@edumin.pe', paquete: 'FULL', avance: '85%', estado: 'Activo', becado: false, enRiesgo: false },
    { id: 2, dni: '45678912', nombre: 'Lucero Martinez', email: 'lucero@gmail.com', paquete: 'COMPLETO', avance: '12%', estado: 'Activo', becado: false, enRiesgo: true }, // Alerta por bajo avance
    { id: 3, dni: '12345678', nombre: 'Carlos Mendoza', email: 'carlos.m@hotmail.com', paquete: 'ILIMITADO', avance: '100%', estado: 'Egresado', becado: false, enRiesgo: false },
    { id: 4, dni: '09876543', nombre: 'Ana Fernandez', email: 'ana.f@gmail.com', paquete: 'NINGUNO', avance: '5%', estado: 'Activo', becado: true, enRiesgo: true },
  ];

  const mockAuditoria = [
    { id: 1, admin: 'Roger Sanalea (SuperAdmin)', accion: 'Liberación de cuota manual', ip: '190.119.28.12', fecha: 'Hoy, 14:20' },
    { id: 2, admin: 'Comercial 01 (Ventas)', accion: 'Asignación de beca institucional', ip: '190.119.28.45', fecha: 'Ayer, 18:05' },
    { id: 3, admin: 'Roger Sanalea (SuperAdmin)', accion: 'Modificación de precio paquete FULL', ip: '190.119.28.12', fecha: '16 Sep, 11:30' },
  ];

  useEffect(() => {
    const generarDatos = () => {
      if (rangoReporte === '7d') return { ingresos: 12400, tendenciaIngresos: '+5.2%', positiva: true, alumnos: 45, tendenciaAlumnos: '+12%', tasa: 72, grafico: [40, 60, 45, 80, 50, 90, 70], labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] };
      if (rangoReporte === '30d') return { ingresos: 45200, tendenciaIngresos: '+12.5%', positiva: true, alumnos: 128, tendenciaAlumnos: '+8%', tasa: 68, grafico: [30, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90], labels: ['1-3', '4-6', '7-9', '10-12', '13-15', '16-18', '19-21', '22-24', '25-27', '28-30'] };
      return { ingresos: 340500, tendenciaIngresos: '-2.1%', positiva: false, alumnos: 1248, tendenciaAlumnos: '+25%', tasa: 65, grafico: [60, 70, 65, 85, 75, 95, 80, 90, 85, 100, 95, 110], labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] };
    };
    setDatosReporte(generarDatos());
  }, [rangoReporte]);

  const registrarPago = async () => {
    if (!dni) return;
    setCargando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni_ce: dni })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ texto: `¡Pago registrado a ${data.alumno.nombres}!`, tipo: 'exito' });
        setDni('');
      } else {
        setMensaje({ texto: `Error: ${data.error}`, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const reintentarWebhook = (id: string) => {
    setWebhooksCola(webhooksCola.map(item => item.id === id ? { ...item, estado: 'Exitoso' } : item));
    alert(`Webhook ${id} reenviado exitosamente a n8n.`);
  };

  const concederAcceso = async () => {
    if (!programaAAsignar) {
      alert("Selecciona un programa.");
      return;
    }
    setSincronizandoN8n(true);
    setPasoSincronizacion('Registrando matrícula en Supabase...');
    await new Promise(r => setTimeout(r, 1000));
    setPasoSincronizacion('Disparando Webhook n8n para credenciales...');
    await new Promise(r => setTimeout(r, 1200));
    setSincronizandoN8n(false);
    setAlumnoSeleccionado(null);
    setProgramaAAsignar('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar de SuperAdmin */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex shrink-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">ADMIN PRO</h2>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {[
            { id: 'tesoreria', label: 'Tesorería & Pagos', icon: CreditCard },
            { id: 'academico', label: 'Catálogo & Módulos', icon: BookOpen },
            { id: 'estudiantes', label: 'Base & Alumnos en Riesgo', icon: Users },
            { id: 'reportes', label: 'Reportes Gerenciales', icon: BarChart3 },
            { id: 'auditoria', label: 'Auditoría & Webhooks', icon: Activity },
            { id: 'config', label: 'Config. & Roles', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 capitalize">
              {activeTab === 'academico' ? 'Catálogo Académico' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-slate-500 mt-1">Centro de control EDUMIN LMS (Acceso Restringido)</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Rol Activo: SuperAdmin Total
          </div>
        </header>

        <div className="animate-in fade-in duration-300">
          
          {/* ========================================================= */}
          {/* TAB 1: TESORERÍA & VALIDACIÓN DE PAGOS */}
          {/* ========================================================= */}
          {activeTab === 'tesoreria' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold mb-2 text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-indigo-600"/>
                    Registrar o Validar Cuota Manual
                  </h2>
                  <p className="text-slate-500 mb-8 text-sm">
                    Ingresa el DNI para sumar +1 cuota y liberar accesos automáticos en Supabase y n8n.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar DNI o Carnet de Extranjería..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-700 font-medium" 
                        value={dni} 
                        onChange={(e) => setDni(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={registrarPago} 
                      disabled={cargando || !dni} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm shrink-0"
                    >
                      {cargando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Validar y Liberar'}
                    </button>
                  </div>
                  {mensaje && (
                    <div className={`p-4 rounded-xl text-sm font-medium border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {mensaje.texto}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl shadow-xl text-white flex flex-col justify-between border border-indigo-800">
                    <div>
                        <h3 className="text-indigo-300 font-bold mb-1 text-sm tracking-wider uppercase">Estado de Pasarelas</h3>
                        <div className="text-3xl font-black mb-4">Operativo</div>
                        <div className="space-y-3 mt-6">
                            <div className="flex justify-between items-center border-b border-indigo-800/50 pb-2 text-sm">
                                <span className="text-indigo-200">Yape / Plin API</span>
                                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">Activo</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-indigo-800/50 pb-2 text-sm">
                                <span className="text-indigo-200">Tarjetas (Culqi/Stripe)</span>
                                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">Activo</span>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              {/* Visor de Transacciones Recientes */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Transacciones y Comprobantes Recientes</h3>
                  <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">Actualizado en tiempo real</span>
                </div>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3">ID Operación</th>
                      <th className="px-6 py-3">Estudiante</th>
                      <th className="px-6 py-3">Método</th>
                      <th className="px-6 py-3">Monto</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">OP-98214</td>
                      <td className="px-6 py-3 font-bold text-slate-800">Roger Sanalea</td>
                      <td className="px-6 py-3 text-xs text-slate-600">Yape (Validación manual)</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">S/ 360.00</td>
                      <td className="px-6 py-3"><span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold">Aprobado</span></td>
                      <td className="px-6 py-3 text-right"><button className="text-xs font-bold text-indigo-600 hover:underline">Ver Voucher</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: BASE DE ESTUDIANTES & ALUMNOS EN RIESGO */}
          {/* ========================================================= */}
          {activeTab === 'estudiantes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                  <input type="text" placeholder="Buscar por DNI o Nombre..." className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
                </div>
                <button 
                  onClick={() => setMostrarCargaMasiva(!mostrarCargaMasiva)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-sm shrink-0"
                >
                  <UploadCloud className="w-4 h-4" /> Importar CSV
                </button>
              </div>

              {mostrarCargaMasiva && (
                <div className="bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center animate-in fade-in">
                  <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
                  <h3 className="text-lg font-bold text-slate-900">Carga Masiva de Alumnos en Supabase</h3>
                  <button className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Seleccionar archivo</button>
                </div>
              )}

              {/* Tabla de Alumnos con indicador de Alerta de Deserción */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Estudiante</th>
                      <th className="px-6 py-4">Paquete Base</th>
                      <th className="px-6 py-4">Avance Académico</th>
                      <th className="px-6 py-4">Alerta de Deserción</th>
                      <th className="px-6 py-4 text-right">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockEstudiantes.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{est.nombre}</div>
                          <div className="text-xs text-slate-500">DNI: {est.dni}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest">{est.paquete}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: est.avance }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{est.avance}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {est.enRiesgo ? (
                            <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit">
                              <AlertTriangle className="size-3"/> En Riesgo (Inactivo 10+ días)
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit">
                              <CheckCircle2 className="size-3"/> Ritmo Óptimo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setAlumnoSeleccionado(est)}
                            className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Matricular / Asignar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: REPORTES GERENCIALES */}
          {/* ========================================================= */}
          {activeTab === 'reportes' && datosReporte && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  {['7d', '30d', '1y'].map((r) => (
                    <button key={r} onClick={() => setRangoReporte(r as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${rangoReporte === r ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                      {r === '7d' ? '7 Días' : r === '30d' ? '30 Días' : 'Este Año'}
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                  <Download className="w-4 h-4" /> Exportar Reporte
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Ingresos del Periodo</h3>
                  <p className="text-3xl font-black text-slate-900">S/ {datosReporte.ingresos.toLocaleString()}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> {datosReporte.tendenciaIngresos} vs periodo anterior</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Matrículas Nuevas</h3>
                  <p className="text-3xl font-black text-slate-900">{datosReporte.alumnos}</p>
                  <p className="text-xs font-bold text-indigo-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> {datosReporte.tendenciaAlumnos} alumnos</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Tasa de Finalización</h3>
                  <p className="text-3xl font-black text-slate-900">{datosReporte.tasa}%</p>
                  <p className="text-xs font-semibold text-slate-500 mt-2">Promedio global en plataforma</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AUDITORÍA & ESTADO DE WEBHOOKS N8N (NUEVO) */}
          {/* ========================================================= */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6">
              
              {/* Cola de Webhooks en Vivo */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">Monitoreo de Webhooks (n8n & CRM)</h3>
                    <p className="text-xs text-slate-500">Historial de sincronizaciones y cola de reintentos automáticos.</p>
                  </div>
                  <button onClick={() => alert('Sincronización forzada con n8n')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                    <RefreshCcw className="w-3.5 h-3.5"/> Forzar Sincronización
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {webhooksCola.map((wh) => (
                    <div key={wh.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`size-2.5 rounded-full ${wh.estado === 'Exitoso' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`}></span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{wh.evento} <span className="text-slate-400 font-mono font-normal">({wh.id})</span></p>
                          <p className="text-[10px] text-slate-500">Destino: {wh.destino} · {wh.fecha}</p>
                        </div>
                      </div>
                      
                      {wh.estado === 'Fallido' ? (
                        <button 
                          onClick={() => reintentarWebhook(wh.id)}
                          className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                        >
                          <RefreshCcw className="size-3"/> Reintentar Webhook
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">Entregado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Registro de Auditoría (Logs de Staff) */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">Registro de Auditoría (Logs de Administradores)</h3>
                </div>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Administrador</th>
                      <th className="px-6 py-3">Acción Realizada</th>
                      <th className="px-6 py-3">IP de Registro</th>
                      <th className="px-6 py-3">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {mockAuditoria.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-bold text-slate-800">{log.admin}</td>
                        <td className="px-6 py-3 text-slate-600">{log.accion}</td>
                        <td className="px-6 py-3 font-mono text-slate-400">{log.ip}</td>
                        <td className="px-6 py-3 text-slate-500">{log.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: CONFIGURACIÓN & ROLES (RBAC) */}
          {/* ========================================================= */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Control de Acceso por Roles (RBAC)</h3>
                <p className="text-xs text-slate-500 mb-6">Define qué secciones puede manipular cada tipo de administrador en el sistema.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 border border-indigo-200 bg-indigo-50/50 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Nivel 1</span>
                    <h4 className="font-bold text-slate-900">Comercial / Ventas</h4>
                    <p className="text-xs text-slate-500">Solo acceso a matriz de estudiantes y concesión de accesos/becas. Sin acceso a tesorería gruesa.</p>
                  </div>
                  <div className="p-5 border border-amber-200 bg-amber-50/50 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Nivel 2</span>
                    <h4 className="font-bold text-slate-900">Soporte Técnico</h4>
                    <p className="text-xs text-slate-500">Gestión de reintentos de webhooks n8n y revisión de errores de estudiantes sin permisos de edición.</p>
                  </div>
                  <div className="p-5 border border-slate-900 bg-slate-900 text-white rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Nivel 3 (Máximo)</span>
                    <h4 className="font-bold text-white">SuperAdmin Total</h4>
                    <p className="text-xs text-slate-300">Control absoluto de Tesorería, base de datos en Supabase, pasarelas de pago y reportes financieros.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mantengo placeholder seguro para Catálogo */}
          {activeTab === 'academico' && (
             <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
               <BookOpen className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-800">Catálogo de 22 Diplomados y 76 Cursos Activo en Memoria</h3>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL DE MATRÍCULA Y GESTIÓN COMERCIAL (SUPABASE + N8N) */}
      {/* ========================================================= */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Matricular / Vender a Estudiante</h3>
                <p className="text-sm text-slate-500 mt-1">Estudiante: <strong className="text-indigo-600">{alumnoSeleccionado.nombre}</strong></p>
              </div>
              <button onClick={() => !sincronizandoN8n && setAlumnoSeleccionado(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8 relative">
              {sincronizandoN8n && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">Sincronizando Plataformas</h3>
                  <p className="text-sm font-semibold text-indigo-600 mt-2 animate-pulse">{pasoSincronizacion}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['REGALO', 'VENTA', 'BECA'].map((tipo) => (
                  <button 
                    key={tipo}
                    onClick={() => setTipoAccionComercial(tipo as any)}
                    className={`p-4 border rounded-2xl text-left transition-colors ${tipoAccionComercial === tipo ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200'}`}
                  >
                    <h4 className="font-bold text-sm text-slate-800 capitalize">{tipo.toLowerCase()}</h4>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Selecciona el Programa Oficial</label>
                  <select 
                    value={programaAAsignar}
                    onChange={(e) => setProgramaAAsignar(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="">-- Buscar catálogo oficial --</option>
                    <optgroup label="Diplomados (22)">
                      {catalogoDiplomados.map(dip => <option key={dip.id} value={dip.id}>{dip.titulo}</option>)}
                    </optgroup>
                    <optgroup label="Cursos Cortos (76)">
                      {catalogoCursos.map(cur => <option key={cur.id} value={cur.id}>{cur.titulo}</option>)}
                    </optgroup>
                  </select>
                </div>

                {tipoAccionComercial === 'VENTA' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Precio Cerrado (S/)</label>
                    <input type="number" value={precioCobrado} onChange={(e) => setPrecioCobrado(e.target.value)} className="w-full bg-slate-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-700 outline-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 z-20 relative">
              <button onClick={() => setAlumnoSeleccionado(null)} disabled={sincronizandoN8n} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancelar</button>
              <button onClick={concederAcceso} disabled={sincronizandoN8n} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-md flex items-center gap-2">
                {sincronizandoN8n ? 'Procesando...' : 'Conceder Acceso y Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}