'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Settings, LogOut, 
  ShieldCheck, Activity, X, Layers, ChevronRight, UploadCloud, Plus, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Download, Search, Edit3, Trash2, Code, Sparkles, Database, RefreshCw
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function CatalogoAdminPage() {
  const [activeTab, setActiveTab] = useState<'diplomados' | 'cursos' | 'talleres'>('diplomados');
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModulesModal, setShowBulkModulesModal] = useState(false);
  
  // Filtro de búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Objeto en edición (Diplomado, Curso o Taller)
  const [itemEditando, setItemEditando] = useState<any>(null);
  const [bulkModulesJson, setBulkModulesJson] = useState('');

  // Selección múltiple para eliminación en lote
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  
  // Estado de carga y mensajes
  const [cargandoSupabase, setCargandoSupabase] = useState(true);
  const [sembrandoSupabase, setSembrandoSupabase] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario de creación
  const [nuevoTipo, setNuevoTipo] = useState<'diplomado' | 'curso' | 'taller'>('diplomado');
  const [nuevoCodigo, setNuevoCodigo] = useState('DIP-23');
  const [nuevaVersion, setNuevaVersion] = useState('Versión 1');
  const [nuevoAno, setNuevoAno] = useState('2026');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoDocente, setNuevoDocente] = useState('Ing. Mario Hilasaca');
  const [nuevoNumModulos, setNuevoNumModulos] = useState('3');
  const [nuevoTallerAplicable, setNuevoTallerAplicable] = useState('Ninguno');
  const [nuevoPrecio, setNuevoPrecio] = useState('150.00');

  // Estado para archivo CSV
  const [archivoImportado, setArchivoImportado] = useState<File | null>(null);

  // Catálogos desde Supabase public.cursos
  const [catalogoDiplomados, setCatalogoDiplomados] = useState<any[]>([]);
  const [catalogoCursos, setCatalogoCursos] = useState<any[]>([]);
  const [catalogoTalleres, setCatalogoTalleres] = useState<any[]>([]);

  useEffect(() => {
    cargarCatalogoSupabase();
  }, []);

  const cargarCatalogoSupabase = async () => {
    setCargandoSupabase(true);
    try {
      const res = await fetch('/api/admin/catalogo');
      if (res.ok) {
        const data = await res.json();
        setCatalogoDiplomados(data.diplomados || []);
        setCatalogoCursos(data.cursosEspecializacion || []);
        setCatalogoTalleres(data.talleres || []);
      }
    } catch (err) {
      console.error('Error al cargar catálogo de Supabase:', err);
    } finally {
      setCargandoSupabase(false);
    }
  };

  const sembrarCatalogoEnSupabase = async () => {
    setSembrandoSupabase(true);
    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      });
      const data = await res.json();
      if (res.ok) {
        setCatalogoDiplomados(data.diplomados || []);
        setCatalogoCursos(data.cursosEspecializacion || []);
        setCatalogoTalleres(data.talleres || []);
        setMensajeExito("¡Catálogo de 100 productos (22 Diplomados, 76 Cursos y 2 Talleres) guardado en Supabase!");
        setTimeout(() => setMensajeExito(null), 5000);
      } else {
        alert(`Error al sembrar: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`);
    } finally {
      setSembrandoSupabase(false);
    }
  };

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoCodigo.trim()) return;

    const idGenerado = `${nuevoTipo}-${nuevoCodigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    
    try {
      const categoriaMap = {
        diplomado: 'Diplomados Oficiales',
        curso: 'Cursos de Alta Especialización',
        taller: 'Talleres'
      };

      const numModulos = nuevoTipo === 'diplomado' ? Number(nuevoNumModulos) || 3 : 1;
      let contadorClaseGlobal = 1;

      const modulosIniciales = nuevoTipo === 'diplomado' ? Array.from({ length: numModulos }, (_, i) => {
        const mod = {
          codigo: `Módulo ${(i + 1).toString().padStart(2, '0')}`,
          nombre: `MÓDULO ${(i + 1).toString().padStart(2, '0')}`,
          docente: nuevoDocente,
          clases: [
            `Clase ${contadorClaseGlobal}: Introducción y Conceptos Clave`,
            `Clase ${contadorClaseGlobal + 1}: Aplicación Práctica`
          ]
        };
        contadorClaseGlobal += 2;
        return mod;
      }) : [];

      const res = await fetch('/api/admin/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idGenerado,
          codigo: nuevoCodigo.toUpperCase(),
          version: nuevaVersion,
          ano: Number(nuevoAno) || 2026,
          titulo: nuevoTitulo.toUpperCase(),
          tipo: nuevoTipo,
          categoria: categoriaMap[nuevoTipo],
          num_modulos: numModulos,
          taller_aplicable: nuevoTipo === 'diplomado' ? nuevoTallerAplicable : 'Ninguno',
          docente: nuevoDocente,
          precio: Number(nuevoPrecio) || 150.00,
          modulos: modulosIniciales
        })
      });

      const data = await res.json();

      if (res.ok) {
        await cargarCatalogoSupabase();
        setActiveTab(nuevoTipo === 'diplomado' ? 'diplomados' : nuevoTipo === 'taller' ? 'talleres' : 'cursos');
        setNuevoTitulo('');
        setShowCreateModal(false);
        setMensajeExito(`¡Producto [${nuevoCodigo.toUpperCase()}] registrado exitosamente en Supabase!`);
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert(`Error al guardar en Supabase: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error de conexión con el servidor: ${err.message}`);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditando) return;

    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemEditando.id,
          codigo: itemEditando.codigo,
          version: itemEditando.version,
          ano: itemEditando.ano,
          titulo: itemEditando.titulo,
          num_modulos: itemEditando.num_modulos,
          taller_aplicable: itemEditando.taller_aplicable,
          docente: itemEditando.docente,
          precio: itemEditando.precio,
          modulos: itemEditando.modulos || []
        })
      });

      if (res.ok) {
        await cargarCatalogoSupabase();
        setShowEditModal(false);
        setItemEditando(null);
        setMensajeExito("¡Producto y módulos actualizados correctamente en Supabase!");
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert("No se pudo actualizar en Supabase.");
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Helper para asegurar que el código del módulo sea "Módulo 01", "Módulo 02" 
  // y que las clases de TODOS los módulos tengan numeración correlativa global continua
  const normalizarYSecuenciarClases = (modulos: any[]) => {
    if (!Array.isArray(modulos)) return [];
    let contadorClaseGlobal = 1;

    return modulos.map((mod: any, mIdx: number) => {
      const codigoModulo = `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`;
      const clasesNuevas = (Array.isArray(mod.clases) ? mod.clases : []).map((claseText: string) => {
        const numClase = contadorClaseGlobal;
        contadorClaseGlobal += 1;
        // Quitar prefijos anteriores tipo "Clase 1:", "Clase 05 -", etc.
        const nombreLimpio = claseText.replace(/^Clase \d+[\s:\-]+/i, '').trim();
        return `Clase ${numClase}: ${nombreLimpio || 'Nueva Clase'}`;
      });

      return {
        ...mod,
        codigo: codigoModulo,
        clases: clasesNuevas
      };
    });
  };

  // Funciones para manipular Módulos y Clases con orden secuencial continuo de clases
  const agregarModuloEditando = () => {
    if (!itemEditando) return;
    const actualMods = itemEditando.modulos || [];
    const nuevoNum = actualMods.length + 1;

    const nuevoMod = {
      codigo: `Módulo ${nuevoNum.toString().padStart(2, '0')}`,
      nombre: `MÓDULO ${nuevoNum.toString().padStart(2, '0')}: NUEVO MÓDULO`,
      docente: itemEditando.docente || 'Reginaldo Andía',
      clases: ['Nueva Clase']
    };

    const modsSecuenciados = normalizarYSecuenciarClases([...actualMods, nuevoMod]);
    setItemEditando({
      ...itemEditando,
      modulos: modsSecuenciados,
      num_modulos: modsSecuenciados.length
    });
  };

  const eliminarModuloEditando = (mIdx: number) => {
    if (!itemEditando) return;
    const actualMods = itemEditando.modulos.filter((_: any, idx: number) => idx !== mIdx);
    const modsSecuenciados = normalizarYSecuenciarClases(actualMods);
    setItemEditando({
      ...itemEditando,
      modulos: modsSecuenciados,
      num_modulos: modsSecuenciados.length
    });
  };

  const actualizarModuloEditando = (mIdx: number, campo: string, valor: any) => {
    if (!itemEditando) return;
    const nuevosMods = [...itemEditando.modulos];
    nuevosMods[mIdx] = { ...nuevosMods[mIdx], [campo]: valor };
    setItemEditando({ ...itemEditando, modulos: nuevosMods });
  };

  const agregarClaseAModulo = (mIdx: number) => {
    if (!itemEditando) return;
    const nuevosMods = itemEditando.modulos 
      ? itemEditando.modulos.map((m: any) => ({ ...m, clases: [...(m.clases || [])] }))
      : [];
    
    nuevosMods[mIdx].clases.push('Nueva Clase');
    const modsSecuenciados = normalizarYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const actualizarNombreClase = (mIdx: number, cIdx: number, valor: string) => {
    if (!itemEditando) return;
    const nuevosMods = itemEditando.modulos
      ? itemEditando.modulos.map((m: any) => ({ ...m, clases: [...(m.clases || [])] }))
      : [];
    
    nuevosMods[mIdx].clases[cIdx] = valor;
    const modsSecuenciados = normalizarYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const eliminarClaseDeModulo = (mIdx: number, cIdx: number) => {
    if (!itemEditando) return;
    const nuevosMods = itemEditando.modulos
      ? itemEditando.modulos.map((m: any) => ({ ...m, clases: [...(m.clases || [])] }))
      : [];
    
    nuevosMods[mIdx].clases = nuevosMods[mIdx].clases.filter((_: any, idx: number) => idx !== cIdx);
    const modsSecuenciados = normalizarYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const procesarCargaMasivaModulos = () => {
    if (!bulkModulesJson.trim() || !itemEditando) return;

    try {
      const parsed = JSON.parse(bulkModulesJson);
      const rawMods = Array.isArray(parsed) ? parsed : (parsed.modulos && Array.isArray(parsed.modulos) ? parsed.modulos : []);
      const modsSecuenciados = normalizarYSecuenciarClases(rawMods);

      if (modsSecuenciados.length > 0) {
        setItemEditando({
          ...itemEditando,
          modulos: modsSecuenciados,
          num_modulos: modsSecuenciados.length
        });
        setShowBulkModulesModal(false);
        setBulkModulesJson('');
        alert(`¡Se cargaron masivamente ${modsSecuenciados.length} módulos con numeración continua de clases!`);
      } else {
        alert('El JSON proporcionado no contiene una lista válida de módulos.');
      }
    } catch (e: any) {
      alert(`Error al procesar JSON: ${e.message}`);
    }
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSeleccionarTodos = () => {
    const idsVisibles = listaActual.map(item => item.id);
    const todosSeleccionados = idsVisibles.every(id => seleccionados.includes(id));

    if (todosSeleccionados) {
      setSeleccionados(prev => prev.filter(id => !idsVisibles.includes(id)));
    } else {
      setSeleccionados(prev => Array.from(new Set([...prev, ...idsVisibles])));
    }
  };

  const eliminarSeleccionados = async () => {
    if (seleccionados.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${seleccionados.length} producto(s) seleccionado(s) de Supabase?`)) return;

    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: seleccionados })
      });

      if (res.ok) {
        await cargarCatalogoSupabase();
        setSeleccionados([]);
        setMensajeExito("¡Productos eliminados correctamente de Supabase!");
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert("Error al eliminar los productos de Supabase.");
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  const descargarPlantillaCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,codigo,tipo,titulo,docente,precio\nDIP-23,diplomado,GESTIÓN AVANZADA DE PROYECTOS MINEROS,Reginaldo Andía,150\nCUR-77,curso,IMPLEMENTACIÓN DE NORMAS DE SEGURIDAD,Ing. Mario Hilasaca,150\nTAL-03,taller,TALLER DE LIDERAZGO TÁCTICO,Mg. María Jesús Burga,100";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_catalogo_edumin.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportarArchivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoImportado) {
      alert("Por favor selecciona un archivo CSV primero.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lineas = text.split('\n').filter(l => l.trim() !== '');
      let countAgregados = 0;

      for (let i = 1; i < lineas.length; i++) {
        const partes = lineas[i].split(',').map(val => val ? val.trim().replace(/^"|"$/g, '') : '');
        const codigo = partes[0];
        const tipo = partes[1] || 'curso';
        const titulo = partes[2];
        const docente = partes[3] || 'Por asignar';
        const precio = partes[4] || '150';

        if (codigo && titulo) {
          const idGen = `${tipo}-${codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          try {
            await fetch('/api/admin/catalogo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: idGen,
                codigo: codigo.toUpperCase(),
                version: 'Versión 1',
                ano: 2026,
                titulo: titulo.toUpperCase(),
                tipo,
                docente,
                precio: Number(precio)
              })
            });
            countAgregados++;
          } catch {}
        }
      }

      await cargarCatalogoSupabase();
      setShowCsvModal(false);
      setArchivoImportado(null);
      setMensajeExito(`¡Se importaron ${countAgregados} productos a Supabase!`);
      setTimeout(() => setMensajeExito(null), 5000);
    };

    reader.readAsText(archivoImportado);
  };

  const limpiarTexto = (texto: string) => {
    return (texto || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const listaBase = activeTab === 'diplomados' 
    ? catalogoDiplomados 
    : activeTab === 'talleres' 
    ? catalogoTalleres 
    : catalogoCursos;

  const listaActual = listaBase.filter(item => {
    const q = limpiarTexto(busqueda);
    return limpiarTexto(item.titulo).includes(q) || limpiarTexto(item.codigo).includes(q) || limpiarTexto(item.docente).includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto">
          
          {mensajeExito && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Catálogo Sincronizado</span>
                <span className="text-slate-400 text-xs font-mono">• Supabase public.cursos</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">Gestión del Catálogo Académico</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={sembrarCatalogoEnSupabase}
                disabled={sembrandoSupabase}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sembrandoSupabase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Sincronizar a Supabase (100 Productos)
              </button>

              {seleccionados.length > 0 && (
                <button 
                  type="button"
                  onClick={eliminarSeleccionados}
                  className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-red-700 transition shadow-md flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Seleccionados ({seleccionados.length})
                </button>
              )}
              
              <button 
                type="button"
                onClick={() => setShowCsvModal(true)} 
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" /> Carga Masiva (CSV)
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setNuevoTipo(activeTab === 'diplomados' ? 'diplomado' : activeTab === 'talleres' ? 'taller' : 'curso');
                  setNuevoCodigo(activeTab === 'diplomados' ? `DIP-${catalogoDiplomados.length + 1}` : activeTab === 'talleres' ? `TAL-03` : `CUR-${catalogoCursos.length + 1}`);
                  setShowCreateModal(true);
                }} 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar Producto
              </button>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex border-b border-slate-200 mb-6 justify-between items-center">
            <div className="flex">
              <button 
                onClick={() => { setActiveTab('diplomados'); setSeleccionados([]); }} 
                className={`pb-3 px-5 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'diplomados' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Diplomados Oficiales ({catalogoDiplomados.length})
              </button>
              <button 
                onClick={() => { setActiveTab('cursos'); setSeleccionados([]); }} 
                className={`pb-3 px-5 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'cursos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Cursos de Alta Especialización ({catalogoCursos.length})
              </button>
              <button 
                onClick={() => { setActiveTab('talleres'); setSeleccionados([]); }} 
                className={`pb-3 px-5 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'talleres' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Talleres ({catalogoTalleres.length})
              </button>
            </div>

            <div className="relative mb-3 w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="size-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar por código, nombre o docente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="pb-3 px-4 w-10 text-center">
                      <input 
                        type="checkbox"
                        onChange={toggleSeleccionarTodos}
                        checked={listaActual.length > 0 && listaActual.every(item => seleccionados.includes(item.id))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="pb-3 px-4">Código</th>
                    
                    {activeTab === 'diplomados' ? (
                      <>
                        <th className="pb-3 px-4">Versión</th>
                        <th className="pb-3 px-4">Año</th>
                        <th className="pb-3 px-4">Nombre del Diplomado</th>
                        <th className="pb-3 px-4 text-center"># Módulos</th>
                        <th className="pb-3 px-4">Taller Aplicable</th>
                      </>
                    ) : (
                      <>
                        <th className="pb-3 px-4">Año</th>
                        <th className="pb-3 px-4">Nombre del Programa</th>
                        <th className="pb-3 px-4">Docente Asignado</th>
                      </>
                    )}

                    <th className="pb-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {listaActual.length > 0 ? (
                    listaActual.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={seleccionados.includes(item.id)}
                            onChange={() => toggleSeleccion(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-indigo-700 bg-indigo-50/40 rounded-lg">{item.codigo}</td>

                        {activeTab === 'diplomados' ? (
                          <>
                            <td className="py-4 px-4 font-bold text-slate-600">{item.version || 'Versión 1'}</td>
                            <td className="py-4 px-4 font-mono text-slate-600">{item.ano || 2026}</td>
                            <td className="py-4 px-4 font-bold text-slate-800">{item.titulo}</td>
                            <td className="py-4 px-4 font-bold text-slate-700 text-center">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                                {Array.isArray(item.modulos) && item.modulos.length > 0 ? `${item.modulos.length} Módulos` : `${item.num_modulos || 3} Módulos`}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.taller_aplicable && item.taller_aplicable !== 'Ninguno' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                                {item.taller_aplicable || 'Ninguno'}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4 font-mono text-slate-600">{item.ano || 2026}</td>
                            <td className="py-4 px-4 font-bold text-slate-800">{item.titulo}</td>
                            <td className="py-4 px-4 font-semibold text-indigo-600">{item.docente || 'Por asignar'}</td>
                          </>
                        )}

                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => { setItemEditando({ ...item, modulos: normalizarYSecuenciarClases(item.modulos || []) }); setShowEditModal(true); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Edit3 className="size-3.5" /> Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeTab === 'diplomados' ? 8 : 6} className="text-center py-12 text-slate-400 font-medium">
                        {cargandoSupabase ? 'Cargando catálogo desde Supabase...' : `No se encontraron registros para "${busqueda}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: EDITAR PRODUCTO EN SUPABASE */}
      {/* ========================================================= */}
      {showEditModal && itemEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Edición de Catálogo Supabase
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{itemEditando.titulo}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* Campos Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Código</label>
                  <input 
                    type="text" 
                    value={itemEditando.codigo}
                    onChange={(e) => setItemEditando({ ...itemEditando, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                {itemEditando.tipo === 'diplomado' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Versión</label>
                      <input 
                        type="text" 
                        value={itemEditando.version || 'Versión 1'}
                        onChange={(e) => setItemEditando({ ...itemEditando, version: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Año</label>
                      <input 
                        type="number" 
                        value={itemEditando.ano || 2026}
                        onChange={(e) => setItemEditando({ ...itemEditando, ano: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Año</label>
                      <input 
                        type="number" 
                        value={itemEditando.ano || 2026}
                        onChange={(e) => setItemEditando({ ...itemEditando, ano: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Docente Asignado</label>
                      <input 
                        type="text" 
                        value={itemEditando.docente || ''}
                        onChange={(e) => setItemEditando({ ...itemEditando, docente: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre del Programa</label>
                  <input 
                    type="text" 
                    required
                    value={itemEditando.titulo}
                    onChange={(e) => setItemEditando({ ...itemEditando, titulo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                {itemEditando.tipo === 'diplomado' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Taller Aplicable</label>
                      <select 
                        value={itemEditando.taller_aplicable || 'Ninguno'}
                        onChange={(e) => setItemEditando({ ...itemEditando, taller_aplicable: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      >
                        <option value="Ninguno">Ninguno</option>
                        <option value="Taller 1">Taller 1: Softskills en la Industria y Minería</option>
                        <option value="Taller 2">Taller 2: Seguridad Basada en el Comportamiento</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1"># Módulos Registrados</label>
                      <input 
                        type="number" 
                        readOnly
                        value={itemEditando.modulos ? itemEditando.modulos.length : 3}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Sección de Módulos y Clases (Solo para Diplomados) */}
              {itemEditando.tipo === 'diplomado' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" /> Estructura de Módulos y Clases ({itemEditando.modulos ? itemEditando.modulos.length : 0})
                      </h4>
                      <p className="text-[11px] text-slate-500">Edita los nombres de módulo (ej. Módulo 01), docentes y clases correlativas continuas.</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkModulesModal(true)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Code className="size-3.5" /> Carga Masiva Módulos (JSON)
                      </button>
                      <button
                        type="button"
                        onClick={agregarModuloEditando}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="size-3.5" /> + Agregar Módulo
                      </button>
                    </div>
                  </div>

                  {/* Lista de Módulos */}
                  <div className="space-y-4">
                    {itemEditando.modulos && itemEditando.modulos.length > 0 ? (
                      itemEditando.modulos.map((mod: any, mIdx: number) => (
                        <div key={mIdx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="bg-indigo-600 text-white font-mono font-bold px-3 py-1.5 rounded-lg text-xs shrink-0">
                                {mod.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`}
                              </span>
                              <input 
                                type="text"
                                placeholder="Nombre del Módulo..."
                                value={mod.nombre || ''}
                                onChange={(e) => actualizarModuloEditando(mIdx, 'nombre', e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                              />
                            </div>
                            
                            <div className="w-48">
                              <input 
                                type="text"
                                placeholder="Docente del Módulo..."
                                value={mod.docente || ''}
                                onChange={(e) => actualizarModuloEditando(mIdx, 'docente', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => eliminarModuloEditando(mIdx)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer"
                              title="Eliminar este módulo"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          {/* Lista de Clases del Módulo */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Clases de {mod.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`} ({mod.clases ? mod.clases.length : 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => agregarClaseAModulo(mIdx)}
                                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="size-3" /> Agregar Clase Correlativa
                              </button>
                            </div>

                            <div className="space-y-2">
                              {mod.clases && mod.clases.length > 0 ? (
                                mod.clases.map((clase: string, cIdx: number) => (
                                  <div key={cIdx} className="flex items-center gap-2">
                                    <input 
                                      type="text"
                                      value={clase}
                                      onChange={(e) => actualizarNombreClase(mIdx, cIdx, e.target.value)}
                                      className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => eliminarClaseDeModulo(mIdx, cIdx)}
                                      className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">No hay clases agregadas aún a este módulo.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium">Este diplomado aún no tiene módulos configurados.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Guardar Cambios en Supabase
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CARGA MASIVA DE MÓDULOS (JSON) */}
      {/* ========================================================= */}
      {showBulkModulesModal && itemEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" /> Carga Masiva de Módulos y Clases (JSON)
              </h3>
              <button onClick={() => setShowBulkModulesModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Pega aquí la estructura JSON de módulos y clases para reemplazarlos masivamente en el diplomado <strong>{itemEditando.titulo}</strong>:
              </p>

              <textarea 
                rows={10}
                placeholder={`[\n  {\n    "codigo": "Módulo 01",\n    "nombre": "LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR",\n    "docente": "Reginaldo Andía",\n    "clases": ["REGULACIÓN AMBIENTAL...", "MARCO LEGAL..."]\n  }\n]`}
                value={bulkModulesJson}
                onChange={(e) => setBulkModulesJson(e.target.value)}
                className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowBulkModulesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={procesarCargaMasivaModulos}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Importar Módulos y Clases
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVO PRODUCTO EN SUPABASE */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Agregar Producto a Supabase</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCrearProducto} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Programa</label>
                <select 
                  value={nuevoTipo} 
                  onChange={(e) => {
                    const tipo = e.target.value as any;
                    setNuevoTipo(tipo);
                    setNuevoCodigo(tipo === 'diplomado' ? `DIP-${catalogoDiplomados.length + 1}` : tipo === 'taller' ? `TAL-03` : `CUR-${catalogoCursos.length + 1}`);
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                >
                  <option value="diplomado">Diplomado Oficial</option>
                  <option value="curso">Curso de Alta Especialización</option>
                  <option value="taller">Taller Práctico</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único</label>
                  <input 
                    type="text" 
                    required
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Año</label>
                  <input 
                    type="number" 
                    required
                    value={nuevoAno}
                    onChange={(e) => setNuevoAno(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              {nuevoTipo === 'diplomado' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Versión</label>
                    <input 
                      type="text" 
                      value={nuevaVersion}
                      onChange={(e) => setNuevaVersion(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"># Módulos Iniciales</label>
                    <input 
                      type="number" 
                      value={nuevoNumModulos}
                      onChange={(e) => setNuevoNumModulos(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre del Programa <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: GESTIÓN MINERA AVANZADA" 
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              {nuevoTipo !== 'diplomado' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Docente Asignado</label>
                  <input 
                    type="text" 
                    value={nuevoDocente}
                    onChange={(e) => setNuevoDocente(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-indigo-700"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Taller Aplicable</label>
                  <select 
                    value={nuevoTallerAplicable} 
                    onChange={(e) => setNuevoTallerAplicable(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  >
                    <option value="Ninguno">Ninguno</option>
                    <option value="Taller 1">Taller 1: Softskills en la Industria y Minería</option>
                    <option value="Taller 2">Taller 2: Seguridad Basada en el Comportamiento</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Precio de Venta (S/)</label>
                <input 
                  type="number" 
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Guardar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CARGA MASIVA A SUPABASE (CSV) */}
      {/* ========================================================= */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Carga Masiva a public.cursos</h3>
              <button onClick={() => setShowCsvModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleImportarArchivo} className="p-6 space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900">Descargar formato de plantilla vacía:</h4>
                <button
                  type="button"
                  onClick={descargarPlantillaCsv}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="size-3.5" /> Descargar Plantilla CSV
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition relative">
                <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <label className="block text-xs font-bold text-slate-700 cursor-pointer">
                  <span>{archivoImportado ? archivoImportado.name : "Selecciona tu archivo CSV"}</span>
                  <input 
                    type="file" 
                    accept=".csv"
                    required
                    onChange={(e) => e.target.files && setArchivoImportado(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setShowCsvModal(false); setArchivoImportado(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  Subir e Insertar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}