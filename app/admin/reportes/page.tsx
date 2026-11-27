'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Download, FileSpreadsheet, Coins, TrendingUp, AlertTriangle, CheckCircle2, Server, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { getClientCachedData, fetchWithClientCache } from '@/lib/utils/clientCache';

export default function ReportesPage() {
  const [descargando, setDescargando] = useState<string | null>(null);
  const [kpis, setKpis] = useState({
    totalRecaudado: 0,
    tasaMorosidad: '0%',
    alumnosEnRiesgo: 0,
    totalAlumnos: 0,
    totalCursos: 0
  });
  const [reporteData, setReporteData] = useState<{ pagos: any[]; alumnosRiesgo: any[]; cursos: any[] }>({
    pagos: [],
    alumnosRiesgo: [],
    cursos: []
  });
  const [cargando, setCargando] = useState(true);

  function procesarReportesData(data: any) {
    if (!data) return;
    if (data.kpis) {
      setKpis({
        totalRecaudado: Number(data.kpis.totalRecaudado) || 0,
        tasaMorosidad: data.kpis.tasaMorosidad || '0%',
        alumnosEnRiesgo: Number(data.kpis.alumnosEnRiesgo) || 0,
        totalAlumnos: Number(data.kpis.totalAlumnos) || 0,
        totalCursos: Number(data.kpis.totalCursos) || 0
      });
    }
    setReporteData({
      pagos: data.pagos || [],
      alumnosRiesgo: data.alumnosRiesgo || [],
      cursos: data.cursos || []
    });
  }

  useEffect(() => {
    const cached = getClientCachedData('/api/admin/reportes');
    if (cached) {
      procesarReportesData(cached);
      setCargando(false);
    }
    cargarReportesData();
  }, []);

  const cargarReportesData = async (forceRefresh = false) => {
    try {
      const data = await fetchWithClientCache('/api/admin/reportes', { forceRefresh });
      if (data) {
        procesarReportesData(data);
      }
    } catch (e) {
      console.error('Error cargando reportes:', e);
    } finally {
      setCargando(false);
    }
  };

  const exportarPagosExcel = () => {
    setDescargando('pagos_excel');
    try {
      const data = (reporteData.pagos || []).map(p => ({
        'ID pago': p.id,
        'DNI / Documento': p.dni_ce || '',
        'Monto (S/)': Number(p.monto ?? 0),
        'Método de pago': p.metodo || 'No registrado',
        'Estado': p.estado || 'Registrado',
        'Fecha': p.created_at || ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');
      XLSX.writeFile(workbook, `reporte_transacciones_pagos_supabase_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      alert(`Error al generar Excel: ${err?.message || err}`);
    } finally {
      setDescargando(null);
    }
  };

  const exportarPagosCSV = () => {
    setDescargando('pagos');
    try {
      let rows = "ID,DNI_CE,MONTO,METODO,ESTADO,FECHA\n";
      if (reporteData.pagos.length > 0) {
        reporteData.pagos.forEach(p => {
          rows += `${p.id},${p.dni_ce || ''},${p.monto ?? 0},${p.metodo || 'No registrado'},${p.estado || 'Registrado'},${p.created_at || ''}\n`;
        });
      }
      
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows);
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `reporte_transacciones_pagos_supabase_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDescargando(null);
    }
  };

  const exportarAlumnosRiesgoExcel = () => {
    setDescargando('riesgo_excel');
    try {
      const data = (reporteData.alumnosRiesgo || []).map(a => ({
        'DNI / Documento': a.numero_documento || a.dni_ce || '',
        'Nombres': a.nombres || '',
        'Apellidos': a.apellidos || '',
        'Correo electrónico': a.email || '',
        'Paquete contratado': a.paquete_adquirido || '',
        'Cuotas pagadas': Number(a.cuotas_pagadas ?? 0),
        'Bloqueado': a.bloqueado ? 'SÍ' : 'NO',
        'Prórroga hasta': a.prorroga_hasta || 'NINGUNA'
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos en riesgo');
      XLSX.writeFile(workbook, `reporte_alumnos_en_riesgo_supabase_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      alert(`Error al generar Excel: ${err?.message || err}`);
    } finally {
      setDescargando(null);
    }
  };

  const exportarAlumnosRiesgoCSV = () => {
    setDescargando('riesgo');
    try {
      let rows = "DNI_CE,NOMBRES,APELLIDOS,EMAIL,PAQUETE,CUOTAS_PAGADAS,BLOQUEADO,PRORROGA_HASTA\n";
      if (reporteData.alumnosRiesgo.length > 0) {
        reporteData.alumnosRiesgo.forEach(a => {
          const doc = a.numero_documento || a.dni_ce || '';
          rows += `${doc},"${a.nombres || ''}","${a.apellidos || ''}",${a.email || ''},${a.paquete_adquirido || ''},${a.cuotas_pagadas ?? 0},${a.bloqueado ? 'SI' : 'NO'},${a.prorroga_hasta || 'NINGUNA'}\n`;
        });
      }
      
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows);
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `reporte_alumnos_en_riesgo_supabase_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDescargando(null);
    }
  };

  const exportarCatalogoExcel = () => {
    setDescargando('catalogo_excel');
    try {
      const data = (reporteData.cursos || []).map(c => ({
        'ID': c.id,
        'Código': c.codigo || '',
        'Título': c.titulo || '',
        'Categoría': c.categoria || '',
        'Tipo': c.tipo || '',
        'Duración': c.duracion || '',
        'Precio (S/)': Number(c.precio ?? 0),
        'Nivel': c.nivel || ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo');
      XLSX.writeFile(workbook, `reporte_catalogo_academico_supabase_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      alert(`Error al generar Excel: ${err?.message || err}`);
    } finally {
      setDescargando(null);
    }
  };

  const exportarCatalogoCSV = () => {
    setDescargando('catalogo');
    try {
      let rows = "ID,TITULO,CATEGORIA,DURACION,PRECIO,NIVEL\n";
      if (reporteData.cursos.length > 0) {
        reporteData.cursos.forEach(c => {
          rows += `${c.id},"${c.titulo || ''}","${c.categoria || ''}",${c.duracion || ''},${c.precio ?? 0},${c.nivel || ''}\n`;
        });
      }
      
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows);
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `reporte_catalogo_academico_supabase_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal con Header Superior */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">Centro de reportes y analítica de datos</h1>

            </div>
            <button 
              onClick={() => cargarReportesData(true)}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Recargar KPIs
            </button>
          </div>

          {/* Tarjetas de Métricas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación Registrada</p>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Coins className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black tabular-nums text-slate-900 mt-3">S/ {kpis.totalRecaudado.toFixed(2)}</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> Total cuotas validadas en BD
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Morosidad</p>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertTriangle className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-amber-600 mt-3">{kpis.tasaMorosidad}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{kpis.alumnosEnRiesgo} alumnos bloqueados/deuda</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos Matriculados</p>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mt-3">{kpis.totalAlumnos}</h3>
              <p className="text-[10px] text-indigo-600 font-bold mt-1">Base de perfiles en Supabase</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oferta Académica</p>
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
                  <BookOpen className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mt-3">{kpis.totalCursos}</h3>
              <p className="text-[10px] text-sky-600 font-bold mt-1">Programas registrados en BD</p>
            </div>
          </div>

          {/* Opciones de Exportación Masiva */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Exportador de archivos Excel y CSV (Supabase sync)</h3>
            <p className="text-xs text-slate-500">Genera reportes detallados en formato Excel (.xlsx) y texto plano (.csv) para integración con hojas de cálculo, Power BI o CRM.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Reporte de recaudación y pagos</h4>
                  <p className="text-xs text-slate-500 mt-1">Historial detallado de cuotas validadas por DNI, pasarelas y montos recaudados.</p>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={exportarPagosExcel}
                    disabled={descargando !== null}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {descargando === 'pagos_excel' ? 'Generando Excel...' : 'Descargar reporte (Excel .xlsx)'}
                  </button>
                  <button
                    onClick={exportarPagosCSV}
                    disabled={descargando !== null}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    {descargando === 'pagos' ? 'Generando CSV...' : 'Descargar reporte (CSV)'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-8 h-8 text-amber-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Reporte de alumnos en riesgo</h4>
                  <p className="text-xs text-slate-500 mt-1">Lista filtrada de morosidad, montos adeudados y prórrogas con fecha de vencimiento.</p>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={exportarAlumnosRiesgoExcel}
                    disabled={descargando !== null}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {descargando === 'riesgo_excel' ? 'Generando Excel...' : 'Descargar reporte (Excel .xlsx)'}
                  </button>
                  <button
                    onClick={exportarAlumnosRiesgoCSV}
                    disabled={descargando !== null}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    {descargando === 'riesgo' ? 'Generando CSV...' : 'Descargar reporte (CSV)'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Reporte de catálogo académico</h4>
                  <p className="text-xs text-slate-500 mt-1">Exportación del listado completo de diplomados y cursos de alta especialización.</p>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={exportarCatalogoExcel}
                    disabled={descargando !== null}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {descargando === 'catalogo_excel' ? 'Generando Excel...' : 'Descargar catálogo (Excel .xlsx)'}
                  </button>
                  <button
                    onClick={exportarCatalogoCSV}
                    disabled={descargando !== null}
                    className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    {descargando === 'catalogo' ? 'Generando CSV...' : 'Descargar catálogo (CSV)'}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
    </div>
  );
}
