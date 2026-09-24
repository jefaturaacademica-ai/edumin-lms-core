'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Settings, LogOut, 
  ShieldCheck, Activity, X, Layers, ChevronRight, UploadCloud, Plus, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Download, Search, Edit3, Trash2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function CatalogoAdminPage() {
  const [activeTab, setActiveTab] = useState<'diplomados' | 'cursos'>('diplomados');
  
  // Estados para modales y búsqueda
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemEditando, setItemEditando] = useState<any>(null);

  // Estados para selección múltiple (Eliminación en lote)
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  
  // Estados para visor y notificaciones
  const [diplomadoSeleccionado, setDiplomadoSeleccionado] = useState<any>(null);
  const [cargandoJson, setCargandoJson] = useState(false);
  const [cargandoSupabase, setCargandoSupabase] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados del formulario de creación
  const [nuevoCodigo, setNuevoCodigo] = useState('DIP-23');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'diplomado' | 'curso'>('diplomado');
  const [nuevoPrecio, setNuevoPrecio] = useState('150.00');

  // Estado para el archivo importado
  const [archivoImportado, setArchivoImportado] = useState<File | null>(null);

  // Conteo real de módulos extraídos de cada JSON
  const [modulosCounts, setModulosCounts] = useState<Record<string, number>>({});

  // 22 Diplomados Oficiales (con códigos DIP-01 al DIP-22)
  const [catalogoDiplomados, setCatalogoDiplomados] = useState([
    { id: 'derecho-minero', codigo: 'DIP-01', titulo: "1. DERECHO MINERO" },
    { id: 'especialista-en-comercio-internacional-gestion-aduanera-y-logistica', codigo: 'DIP-02', titulo: "2. ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA" },
    { id: 'geologia-minera', codigo: 'DIP-03', titulo: "3. GEOLOGÍA MINERA" },
    { id: 'geomecanica-subterranea-y-superficial', codigo: 'DIP-04', titulo: "4. GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL" },
    { id: 'geometalurgia', codigo: 'DIP-05', titulo: "5. GEOMETALURGIA" },
    { id: 'geotecnia-minera', codigo: 'DIP-06', titulo: "6. GEOTECNIA MINERA" },
    { id: 'gerencia-de-sistemas-integrados-de-gestion-hseq', codigo: 'DIP-07', titulo: "7. GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ" },
    { id: 'gerencia-estrategica-y-liderazgo-de-equipos-en-la-mineria', codigo: 'DIP-08', titulo: "8. GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA" },
    { id: 'gestion-ambiental-para-el-sector-minero-e-industrial', codigo: 'DIP-09', titulo: "9. GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL" },
    { id: 'gestion-de-control-operativo-en-procesos-mineros', codigo: 'DIP-10', titulo: "10. GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS" },
    { id: 'gestion-de-operaciones-industriales', codigo: 'DIP-11', titulo: "11. GESTIÓN DE OPERACIONES INDUSTRIALES" },
    { id: 'gestion-estrategica-para-empresas-utilizando-big-data-y-analisis-predictivo', codigo: 'DIP-12', titulo: "12. GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO" },
    { id: 'gestion-logistica-compras-inventarios-y-manejo-de-proveedores', codigo: 'DIP-13', titulo: "13. GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES" },
    { id: 'gestion-logistica-y-almacenes-en-mineria', codigo: 'DIP-14', titulo: "14. GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA" },
    { id: 'gestion-logistica-y-proveedores-en-industria-y-mineria', codigo: 'DIP-15', titulo: "15. GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA" },
    { id: 'gestion-minera', codigo: 'DIP-16', titulo: "16. GESTIÓN MINERA" },
    { id: 'legislacion-laboral-y-elaboracion-de-planillas', codigo: 'DIP-17', titulo: "17. LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS" },
    { id: 'mineria-4-0-y-digitalizacion-minera', codigo: 'DIP-18', titulo: "18. MINERÍA 4.0 Y DIGITALIZACIÓN MINERA" },
    { id: 'prevencion-de-la-conflictividad-riesgos-sociales-y-responsabilidad-social-minera', codigo: 'DIP-19', titulo: "19. PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA" },
    { id: 'seguridad-industrial', codigo: 'DIP-20', titulo: "20. SEGURIDAD INDUSTRIAL" },
    { id: 'seguridad-y-salud-ocupacional-en-la-industria-y-mineria', codigo: 'DIP-21', titulo: "21. SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA" },
    { id: 'supply-chain-management-en-industria-y-mineria', codigo: 'DIP-22', titulo: "22. SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA" },
  ]);

  // Cursos desde Supabase public.cursos
  const [catalogoCursos, setCatalogoCursos] = useState<any[]>([]);

  useEffect(() => {
    cargarCatalogoSupabase();
  }, []);

  const cargarCatalogoSupabase = async () => {
    try {
      const res = await fetch('/api/admin/catalogo');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.cursos) && data.cursos.length > 0) {
          const cursosFormateados = data.cursos.map((c: any, index: number) => ({
            id: c.id,
            codigo: `CUR-${index + 1}`,
            titulo: c.titulo,
            duracion: c.duracion,
            precio: c.precio
          }));
          setCatalogoCursos(cursosFormateados);
        }
      }
    } catch (err) {
      console.error('Error al cargar catálogo de Supabase:', err);
    } finally {
      setCargandoSupabase(false);
    }
  };

  const abrirDiplomado = async (item: any) => {
    setCargandoJson(true);
    setDiplomadoSeleccionado({ titulo: item.titulo, modulos: [], id: item.id, errorMsg: null });
    
    try {
      const res = await fetch(`/api/admin/diplomados/${item.id}`);
      const data = await res.json();

      if (res.ok) {
        const mods = Array.isArray(data.modulos) ? data.modulos : [];
        setModulosCounts(prev => ({ ...prev, [item.id]: mods.length }));
        setDiplomadoSeleccionado({ titulo: data.diplomado || item.titulo, modulos: mods, id: item.id, errorMsg: null });
      } else {
        setDiplomadoSeleccionado({ titulo: item.titulo, modulos: [], id: item.id, errorMsg: data.error || 'Error al leer archivo.' });
      }
    } catch (error: any) {
      setDiplomadoSeleccionado({ titulo: item.titulo, modulos: [], id: item.id, errorMsg: error.message });
    } finally {
      setCargandoJson(false);
    }
  };

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoCodigo.trim()) return;

    const idGenerado = nuevoTitulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    try {
      // Guardar en Supabase a través del API /api/admin/catalogo
      const res = await fetch('/api/admin/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idGenerado,
          codigo: nuevoCodigo.toUpperCase(),
          titulo: nuevoTitulo.toUpperCase(),
          tipo: nuevoTipo,
          precio: Number(nuevoPrecio)
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (nuevoTipo === 'diplomado') {
          const nuevoItem = { id: idGenerado, codigo: nuevoCodigo.toUpperCase(), titulo: nuevoTitulo.toUpperCase() };
          setCatalogoDiplomados([nuevoItem, ...catalogoDiplomados]);
          setActiveTab('diplomados');
        } else {
          const nuevoItem = { id: idGenerado, codigo: nuevoCodigo.toUpperCase(), titulo: nuevoTitulo.toUpperCase(), precio: Number(nuevoPrecio) };
          setCatalogoCursos([nuevoItem, ...catalogoCursos]);
          setActiveTab('cursos');
        }

        setNuevoTitulo('');
        setShowCreateModal(false);
        setMensajeExito(`¡Producto [${nuevoCodigo.toUpperCase()}] guardado exitosamente en Supabase!`);
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
          titulo: itemEditando.titulo,
          precio: itemEditando.precio
        })
      });

      if (res.ok) {
        if (activeTab === 'diplomados') {
          setCatalogoDiplomados(prev => prev.map(item => item.id === itemEditando.id ? itemEditando : item));
        } else {
          setCatalogoCursos(prev => prev.map(item => item.id === itemEditando.id ? itemEditando : item));
        }

        setShowEditModal(false);
        setItemEditando(null);
        setMensajeExito("¡Producto actualizado correctamente en Supabase!");
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert("No se pudo actualizar en Supabase.");
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
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
        if (activeTab === 'diplomados') {
          setCatalogoDiplomados(prev => prev.filter(item => !seleccionados.includes(item.id)));
        } else {
          setCatalogoCursos(prev => prev.filter(item => !seleccionados.includes(item.id)));
        }

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
    const csvContent = "data:text/csv;charset=utf-8,codigo,tipo,titulo,precio\nDIP-23,diplomado,GESTIÓN AVANZADA DE PROYECTOS MINEROS,150\nCUR-77,curso,IMPLEMENTACIÓN DE NORMAS DE SEGURIDAD,150";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_productos_edumin.csv");
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
        const tipo = partes[1];
        const titulo = partes[2];
        const precio = partes[3] || '150';

        if (codigo && titulo) {
          const idGen = titulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
          try {
            await fetch('/api/admin/catalogo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: idGen,
                codigo: codigo.toUpperCase(),
                titulo: titulo.toUpperCase(),
                tipo: tipo || 'curso',
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
      setMensajeExito(`¡Se guardaron ${countAgregados} productos correctamente en Supabase!`);
      setTimeout(() => setMensajeExito(null), 5000);
    };

    reader.readAsText(archivoImportado);
  };

  const limpiarTexto = (texto: string) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const listaBase = activeTab === 'diplomados' ? catalogoDiplomados : catalogoCursos;
  const listaActual = listaBase.filter(item => {
    const textoBusqueda = limpiarTexto(busqueda);
    return limpiarTexto(item.titulo).includes(textoBusqueda) || limpiarTexto(item.codigo).includes(textoBusqueda);
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

          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Supabase Sincronizado</span>
                <span className="text-slate-400 text-xs font-mono">• Tabla public.cursos</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">Gestión de Catálogo & Cursos en Supabase</h1>
            </div>
            <div className="flex gap-3">
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
                <UploadCloud className="w-4 h-4 text-indigo-600" /> Carga Masiva a Supabase (CSV)
              </button>
              <button 
                type="button"
                onClick={() => setShowCreateModal(true)} 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar Producto a Supabase
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 mb-6 justify-between items-center">
            <div className="flex">
              <button onClick={() => { setActiveTab('diplomados'); setSeleccionados([]); }} className={`pb-3 px-4 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'diplomados' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                Diplomados Oficiales ({catalogoDiplomados.length})
              </button>
              <button onClick={() => { setActiveTab('cursos'); setSeleccionados([]); }} className={`pb-3 px-4 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'cursos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                Cursos de Alta Especialización ({catalogoCursos.length})
              </button>
            </div>

            <div className="relative mb-3 w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="size-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar (ej. logistica o cur-1)..."
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
                    <th className="pb-3 px-4">Nº Módulos</th>
                    <th className="pb-3 px-4">Nombre del Programa</th>
                    <th className="pb-3 px-4">Origen Data</th>
                    <th className="pb-3 px-4 text-right">Acciones Supabase</th>
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
                        <td className="py-4 px-4 font-bold text-slate-700 text-center">
                          {activeTab === 'diplomados' 
                            ? (modulosCounts[item.id] !== undefined ? `${modulosCounts[item.id]} Módulos` : '4 Módulos') 
                            : '1 Módulo'}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">{item.titulo}</td>
                        <td className="py-4 px-4 text-slate-500 font-semibold">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                            Supabase DB
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button 
                            onClick={() => { setItemEditando({ ...item }); setShowEditModal(true); }}
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Editar en Supabase"
                          >
                            <Edit3 className="size-3.5" /> Editar
                          </button>
                          {activeTab === 'diplomados' && (
                            <button 
                              onClick={() => abrirDiplomado(item)}
                              className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Layers className="size-3.5" /> Leer Temario
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                        No se encontraron resultados para "{busqueda}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL: EDITAR PRODUCTO EN SUPABASE */}
      {showEditModal && itemEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Editar en Supabase</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único</label>
                <input 
                  type="text" 
                  disabled
                  value={itemEditando.codigo}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-500 uppercase cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Título del Programa <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={itemEditando.titulo}
                  onChange={(e) => setItemEditando({ ...itemEditando, titulo: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  Guardar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVO PRODUCTO EN SUPABASE */}
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
                  onChange={(e) => setNuevoTipo(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                >
                  <option value="diplomado">Diplomado Oficial</option>
                  <option value="curso">Curso de Alta Especialización</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único (Ej: DIP-23 / CUR-77) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="DIP-23" 
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Título del Programa <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: GESTIÓN AVANZADA DE YACIMIENTOS" 
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

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
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  Guardar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGA MASIVA A SUPABASE */}
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

      {/* MODAL: VISOR DE MÓDULOS (JSON) */}
      {diplomadoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  lib/data/diplomados/{diplomadoSeleccionado.id}.json
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{diplomadoSeleccionado.titulo}</h3>
              </div>
              <button onClick={() => setDiplomadoSeleccionado(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              {cargandoJson ? (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                  <p className="text-xs font-bold text-slate-600">Buscando archivo en disco...</p>
                </div>
              ) : diplomadoSeleccionado.errorMsg ? (
                <div className="text-center py-12 bg-white border border-red-200 rounded-2xl p-6">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">Fallo de lectura en el servidor</h4>
                  <p className="text-xs text-red-600 mt-1 font-mono">{diplomadoSeleccionado.errorMsg}</p>
                </div>
              ) : diplomadoSeleccionado.modulos && diplomadoSeleccionado.modulos.length > 0 ? (
                diplomadoSeleccionado.modulos.map((mod: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-md font-mono">{mod.codigo}</span>
                        <h4 className="font-bold text-slate-900 text-base mt-2">{mod.nombre}</h4>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        Docente: {mod.docente || 'No especificado'}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clases / Temas Registrados:</h5>
                      <div className="space-y-2">
                        {mod.clases.map((clase: string, cIdx: number) => (
                          <div key={cIdx} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 flex items-center gap-2">
                            <ChevronRight className="size-4 text-indigo-500 shrink-0" />
                            <span>{clase}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">Archivo JSON vacío o sin módulos</h4>
                  <p className="text-xs text-slate-500 mt-1">El archivo existe pero aún no contiene el arreglo de módulos escrito en disco.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setDiplomadoSeleccionado(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}