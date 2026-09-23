'use client';

import React, { useState } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Download, FileSpreadsheet, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Server
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function ReportesPage() {
  const [descargando, setDescargando] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const exportarPagosCSV = () => {
    setDescargando('pagos');
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,ID,DNI_CE,ESTUDIANTE,MONTO,METODO,ESTADO,FECHA\n" +
        "PAY-101,76543210,Lucero Martinez,150.00,Yape / Plin,Completado,2026-09-23\n" +
        "PAY-102,45678912,Marcos Quispe,300.00,Transferencia,Completado,2026-09-22\n" +
        "PAY-103,12345678,Ana Torres,150.00,Visa,Completado,2026-09-21\n" +
        "PAY-104,43210987,Pedro Huanca,150.00,Yape / Plin,Completado,2026-09-20";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_transacciones_pagos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDescargando(null);
    }, 600);
  };

  const exportarAlumnosRiesgoCSV = () => {
    setDescargando('riesgo');
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,DNI_CE,ESTUDIANTE,EMAIL,PROGRAMA,DEUDA_MONTO,MES_DEUDA,ESTADO,PRORROGA_HASTA\n" +
        "45678912,Lucero Martinez,lucero@gmail.com,DERECHO MINERO,300.00,agosto,Deuda Activa,\n" +
        "71234568,Marcos Quispe,marcos.q@hotmail.com,GEOLOGIA MINERA,150.00,septiembre,Prorroga Activa,2026-09-27\n" +
        "78912345,Ana Torres,ana.torres@gmail.com,HSEQ SISTEMAS,450.00,julio,Bloqueado por Sistema,";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_alumnos_en_riesgo_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDescargando(null);
    }, 600);
  };

  const exportarCatalogoCSV = () => {
    setDescargando('catalogo');
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,CODIGO,TIPO,PROGRAMA,ESTADO\n" +
        "DIP-01,Diplomado,DERECHO MINERO,Activo\n" +
        "DIP-02,Diplomado,ESPECIALISTA EN COMERCIO INTERNACIONAL,Activo\n" +
        "DIP-03,Diplomado,GEOLOGIA MINERA,Activo\n" +
        "CUR-01,Curso,MANEJO DE EPPS LEY 29783,Activo";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_catalogo_academico_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDescargando(null);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Centro de Reportes & Analítica Data</h1>
            <p className="text-slate-500 mt-1">Exportación masiva de estados financieros, morosidad y catálogo académico.</p>
          </div>

          {/* Tarjetas de Métricas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación del Mes</p>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mt-3">S/ 18,450</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> +12.4% vs mes anterior
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Morosidad</p>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertTriangle className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-amber-600 mt-3">10.9%</h3>
              <p className="text-[10px] text-slate-400 mt-1">14 alumnos en riesgo</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos Matriculados</p>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mt-3">128</h3>
              <p className="text-[10px] text-indigo-600 font-bold mt-1">Base estudiantil activa</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Oferta Académica</p>
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
                  <BookOpen className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mt-3">98</h3>
              <p className="text-[10px] text-sky-600 font-bold mt-1">22 Dip. y 76 Cursos</p>
            </div>
          </div>

          {/* Opciones de Exportación Masiva */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Exportador de Archivos CSV y Hojas de Cálculo</h3>
            <p className="text-xs text-slate-500">Genera reportes detallados en formato plano para integración con Excel, PowerBI o CRM.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Reporte de Recaudación & Pagos</h4>
                  <p className="text-xs text-slate-500 mt-1">Historial detallado de cuotas validadas por DNI, pasarelas y montos recaudados.</p>
                </div>
                <button
                  onClick={exportarPagosCSV}
                  disabled={descargando === 'pagos'}
                  className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {descargando === 'pagos' ? 'Generando CSV...' : 'Descargar Reporte Pagos (CSV)'}
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-8 h-8 text-amber-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Reporte de Alumnos en Riesgo</h4>
                  <p className="text-xs text-slate-500 mt-1">Lista filtrada de morosidad, montos adeudados y prórrogas con fecha de vencimiento.</p>
                </div>
                <button
                  onClick={exportarAlumnosRiesgoCSV}
                  disabled={descargando === 'riesgo'}
                  className="mt-6 w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {descargando === 'riesgo' ? 'Generando CSV...' : 'Descargar Reporte Riesgo (CSV)'}
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Reporte de Catálogo Académico</h4>
                  <p className="text-xs text-slate-500 mt-1">Exportación del listado completo de Diplomados y Cursos de Alta Especialización.</p>
                </div>
                <button
                  onClick={exportarCatalogoCSV}
                  disabled={descargando === 'catalogo'}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {descargando === 'catalogo' ? 'Generando CSV...' : 'Descargar Catálogo (CSV)'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
