'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, BookOpen, Users, Settings, LogOut, 
  ShieldCheck, Activity, X, Layers, ChevronRight, UploadCloud, Plus, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Download, Search, Edit3, Trash2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados del formulario de creación
  const [nuevoCodigo, setNuevoCodigo] = useState('DIP-23');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoDocente, setNuevoDocente] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'diplomado' | 'curso'>('diplomado');

  // Estado para el archivo importado
  const [archivoImportado, setArchivoImportado] = useState<File | null>(null);

  // Conteo real de módulos extraídos de cada JSON
  const [modulosCounts, setModulosCounts] = useState<Record<string, number>>({});

  const router = useRouter();

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

 // 76 Cursos de Alta Especialización oficiales limpios de marcas
  const [catalogoCursos, setCatalogoCursos] = useState([
    { id: 'cur-1', codigo: 'CUR-1', titulo: "1. MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783" },
    { id: 'cur-2', codigo: 'CUR-2', titulo: "2. IMPLEMENTACIÓN DE MEDIDAS DE CONTROL EN RIESGOS MINEROS" },
    { id: 'cur-3', codigo: 'CUR-3', titulo: "3. ERGONOMÍA Y SALUD OCUPACIONAL EN EL SECTOR MINERO E INDUSTRIAL" },
    { id: 'cur-4', codigo: 'CUR-4', titulo: "4. MARCO JURÍDICO Y NORMATIVO DE LA MINERÍA" },
    { id: 'cur-5', codigo: 'CUR-5', titulo: "5. GESTIÓN DE PROVEEDORES EN MINERÍA" },
    { id: 'cur-6', codigo: 'CUR-6', titulo: "6. CONTROL DE COSTOS EN ALMACENES MINEROS" },
    { id: 'cur-7', codigo: 'CUR-7', titulo: "7. LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA" },
    { id: 'cur-8', codigo: 'CUR-8', titulo: "8. CONTRATOS EN LA INDUSTRIA MINERA" },
    { id: 'cur-9', codigo: 'CUR-9', titulo: "9. DERECHOS HUMANOS EN MINERÍA" },
    { id: 'cur-10', codigo: 'CUR-10', titulo: "10. GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA" },
    { id: 'cur-11', codigo: 'CUR-11', titulo: "11. RESPONSABILIDAD PENAL EN MINERÍA" },
    { id: 'cur-12', codigo: 'CUR-12', titulo: "12. DERECHO LABORAL EN MINERÍA" },
    { id: 'cur-13', codigo: 'CUR-13', titulo: "13. TIPOS DE CONCESIONES MINERAS" },
    { id: 'cur-14', codigo: 'CUR-14', titulo: "14. GESTIÓN DE CONTRATOS LOGÍSTICOS EN LA INDUSTRIA Y MINERÍA" },
    { id: 'cur-15', codigo: 'CUR-15', titulo: "15. CURSO DE PREVENCIÓN DE RIESGOS" },
    { id: 'cur-16', codigo: 'CUR-16', titulo: "16. IMPLEMENTACIÓN DE LA ISO 45001:2018" },
    { id: 'cur-17', codigo: 'CUR-17', titulo: "17. GESTIÓN DE EMERGENCIAS EN INDUSTRIA Y MINERÍA" },
    { id: 'cur-18', codigo: 'CUR-18', titulo: "18. GESTIÓN DE INVENTARIOS EN INDUSTRIA Y MINERÍA" },
    { id: 'cur-19', codigo: 'CUR-19', titulo: "19. CONTROL FINANCIERO EN ALMACENES" },
    { id: 'cur-20', codigo: 'CUR-20', titulo: "20. LOGÍSTICA INTERNA EN CONTROL DE ALMACENES" },
    { id: 'cur-21', codigo: 'CUR-21', titulo: "21. FUNDAMENTOS DE BIG DATA" },
    { id: 'cur-22', codigo: 'CUR-22', titulo: "22. MÉTODOS DE CAPTURA DE INFORMACIÓN EN BIG DATA" },
    { id: 'cur-23', codigo: 'CUR-23', titulo: "23. TENDENCIAS 2025-2026 CLAVES DE BIG DATA" },
    { id: 'cur-24', codigo: 'CUR-24', titulo: "24. BIG DATA: TRANSFORMACIÓN DE DATOS (PYTHON Y R)" },
    { id: 'cur-25', codigo: 'CUR-25', titulo: "25. MINERÍA 4.0 ESSENTIALS (NUEVAS HERRAMIENTAS)" },
    { id: 'cur-26', codigo: 'CUR-26', titulo: "26. INNOVACIÓN EN MINERÍA: APLICACIONES DE INTELIGENCIA ARTIFICIAL" },
    { id: 'cur-27', codigo: 'CUR-27', titulo: "27. AUTOMATIZACIÓN 4.0 EN PROCESOS MINEROS" },
    { id: 'cur-28', codigo: 'CUR-28', titulo: "28. CADENA DE SUMINISTRO LOGÍSTICA Y DISTRIBUCIÓN" },
    { id: 'cur-29', codigo: 'CUR-29', titulo: "29. MEJORA DE LOS MÉTODOS Y MEDICIÓN DE LOS RECURSOS" },
    { id: 'cur-30', codigo: 'CUR-30', titulo: "30. INTRODUCCIÓN A LA GESTIÓN DE PROYECTOS" },
    { id: 'cur-31', codigo: 'CUR-31', titulo: "31. ARQUITECTURA DE DATOS: LA IMPORTANCIA DEL DISEÑO, COMPONENTES, FUNCIÓN, CONFIGURACIÓN Y PATRONES" },
    { id: 'cur-32', codigo: 'CUR-32', titulo: "32. ECOSISTEMA BIG DATA: HERRAMIENTAS Y TECNOLOGÍAS ESENCIALES" },
    { id: 'cur-33', codigo: 'CUR-33', titulo: "33. INTRODUCCIÓN A MACHINE LEARNING PARA BIG DATA" },
    { id: 'cur-34', codigo: 'CUR-34', titulo: "34. PROYECTOS CON HERRAMIENTAS DIGITALES PARA MINERÍA" },
    { id: 'cur-35', codigo: 'CUR-35', titulo: "35. INTRODUCCIÓN A MACHINE LEARNING EN MINERÍA" },
    { id: 'cur-36', codigo: 'CUR-36', titulo: "36. TIPOS DE INTELIGENCIA ARTIFICIAL APLICADAS A LA MINERÍA" },
    { id: 'cur-37', codigo: 'CUR-37', titulo: "37. HERRAMIENTAS DE BIG DATA APLICADA A MINERÍA" },
    { id: 'cur-38', codigo: 'CUR-38', titulo: "38. GESTIÓN AVANZADA DE OPERACIONES INDUSTRIALES" },
    { id: 'cur-39', codigo: 'CUR-39', titulo: "39. BIG DATA APLICADA A PROCESOS INDUSTRIALES" },
    { id: 'cur-40', codigo: 'CUR-40', titulo: "40. CONTROL DE COSTOS EN PRODUCCIÓN INDUSTRIAL O EN ÁREAS DE PRODUCCIÓN" },
    { id: 'cur-41', codigo: 'CUR-41', titulo: "41. IMPORTACIÓN Y EXPORTACIÓN DESDE 0: CLAVES PARA EL ÉXITO" },
    { id: 'cur-42', codigo: 'CUR-42', titulo: "42. IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015" },
    { id: 'cur-43', codigo: 'CUR-43', titulo: "43. ANÁLISIS DE MERCADOS INTERNACIONALES: ESTRATEGIAS DE IMPORTACIÓN Y EXPORTACIÓN 2025-2026" },
    { id: 'cur-44', codigo: 'CUR-44', titulo: "44. DE LA IMPORTACIÓN A LA VENTA ONLINE: IMPLEMENTA TU TIENDA VIRTUAL DESDE CERO" },
    { id: 'cur-45', codigo: 'CUR-45', titulo: "45. CONTROL Y SUPERVISIÓN DE PROCESOS CON SOFTWARE SCADA" },
    { id: 'cur-46', codigo: 'CUR-46', titulo: "46. GESTIÓN DE OPERACIONES Y PROCESOS EN LA MINERÍA" },
    { id: 'cur-47', codigo: 'CUR-47', titulo: "47. PIRÁMIDE DE PROCESOS: TÉCNICAS DE CONTROL EN MINERÍA" },
    { id: 'cur-48', codigo: 'CUR-48', titulo: "48. PROCESO DE OPTIMIZACIÓN DE MANTENIMIENTO A PARTIR DEL USO DE TÉCNICAS DE LA INDUSTRIA 4.0" },
    { id: 'cur-49', codigo: 'CUR-49', titulo: "49. SISTEMAS INTEGRADOS PARA LA GESTIÓN DE MANTENIMIENTO" },
    { id: 'cur-50', codigo: 'CUR-50', titulo: "50. ESTÁNDARES Y SISTEMA DE CALIDAD DEL MANTENIMIENTO" },
    { id: 'cur-51', codigo: 'CUR-51', titulo: "51. DOCUMENTACIÓN Y TRÁMITES ADUANEROS" },
    { id: 'cur-52', codigo: 'CUR-52', titulo: "52. REVISIÓN DE PROVEEDORES PARA EVITAR ESTAFAS EN IMPORTACIONES CHINAS" },
    { id: 'cur-53', codigo: 'CUR-53', titulo: "53. PLANIFICACIÓN DE RIESGOS PARA IMPORTACIÓN Y EXPORTACIÓN" },
    { id: 'cur-54', codigo: 'CUR-54', titulo: "54. CONTROL DE CALIDAD EN PROCESOS MINEROS" },
    { id: 'cur-55', codigo: 'CUR-55', titulo: "55. MONITOREO Y CONTROL EN LA OPERACIÓN DE PLANTAS MINERAS" },
    { id: 'cur-56', codigo: 'CUR-56', titulo: "56. SOSTENIBILIDAD Y SEGURIDAD EN CAMPAMENTOS MINEROS" },
    { id: 'cur-57', codigo: 'CUR-57', titulo: "57. ANÁLISIS DE DATOS PARA OPTIMIZAR OPERACIONES MINERAS" },
    { id: 'cur-58', codigo: 'CUR-58', titulo: "58. SEGURIDAD Y CONTROL AMBIENTAL EN EL MANTENIMIENTO" },
    { id: 'cur-59', codigo: 'CUR-59', titulo: "59. GERENCIA DE PROYECTOS DEL MANTENIMIENTO" },
    { id: 'cur-60', codigo: 'CUR-60', titulo: "60. GESTIÓN DE COSTOS DEL MANTENIMIENTO EN LA INDUSTRIA 4.0" },
    { id: 'cur-61', codigo: 'CUR-61', titulo: "61. SOSTENIBILIDAD Y MINERÍA RESPONSABLE" },
    { id: 'cur-62', codigo: 'CUR-62', titulo: "62. PRIMEROS AUXILIOS EN MINERÍA" },
    { id: 'cur-63', codigo: 'CUR-63', titulo: "63. INDICADORES CLAVE (KPIS) PARA LA CADENA DE ABASTECIMIENTOS" },
    { id: 'cur-64', codigo: 'CUR-64', titulo: "64. EXPLORACIÓN MINERA Y EVALUACIÓN DE YACIMIENTOS" },
    { id: 'cur-65', codigo: 'CUR-65', titulo: "65. REQUISITOS CLAVE DE ISO 14001 Y CÓMO APLICARLOS EN LA EMPRESA" },
    { id: 'cur-66', codigo: 'CUR-66', titulo: "66. SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)" },
    { id: 'cur-67', codigo: 'CUR-67', titulo: "67. GERENCIA DE CRISIS Y MANEJO DE CONFLICTOS EN AMBIENTES INDUSTRIALES" },
    { id: 'cur-68', codigo: 'CUR-68', titulo: "68. PLANIFICACIÓN ESTRATÉGICA Y BALANCED SCORECARD" },
    { id: 'cur-69', codigo: 'CUR-69', titulo: "69. GESTIÓN DE LA ENERGÍA EN OPERACIONES MINERAS" },
    { id: 'cur-70', codigo: 'CUR-70', titulo: "70. GESTIÓN DE LA CADENA DE SUMINISTRO EN EMPRESAS MINERAS" },
    { id: 'cur-71', codigo: 'CUR-71', titulo: "71. SEGURIDAD Y NORMATIVA EN EL CONTROL DE INVENTARIO Y LÓGISTICA MINERA" },
    { id: 'cur-72', codigo: 'CUR-72', titulo: "72. SALUD MENTAL EN EL TRABAJO: DETECCIÓN Y PREVENCIÓN DE TRASTORNOS PSICOLÓGICOS" },
    { id: 'cur-73', codigo: 'CUR-73', titulo: "73. IMPLEMENTACIÓN DE LEAN MANUFACTURING EN PROCESOS INDUSTRIALES" },
    { id: 'cur-74', codigo: 'CUR-74', titulo: "74. ERGONOMÍA Y DISEÑO DE PUESTOS DE TRABAJO EN LA INDUSTRIA" },
    { id: 'cur-75', codigo: 'CUR-75', titulo: "75. GESTIÓN DE SEGURIDAD DURANTE LAS PARADAS DE PLANTA Y MANTENIMIENTO" },
    { id: 'cur-76', codigo: 'CUR-76', titulo: "76. GESTIÓN DE RELAVES Y RESIDUOS MINEROS" }
  ]);

  useEffect(() => {
    catalogoDiplomados.forEach(async (item) => {
      try {
        const res = await fetch(`/api/admin/diplomados/${item.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.modulos)) {
            setModulosCounts(prev => ({ ...prev, [item.id]: data.modulos.length }));
          }
        }
      } catch (e) {
        // Silencioso
      }
    });
  }, []);

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

  const handleCrearProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoCodigo.trim()) return;

    const idGenerado = nuevoTitulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    if (nuevoTipo === 'diplomado') {
      const nuevoItem = { id: idGenerado, codigo: nuevoCodigo.toUpperCase(), titulo: nuevoTitulo.toUpperCase() };
      setCatalogoDiplomados([nuevoItem, ...catalogoDiplomados]);
      setActiveTab('diplomados');
    } else {
      const nuevoItem = { id: `cur-${catalogoCursos.length + 1}`, codigo: nuevoCodigo.toUpperCase(), titulo: nuevoTitulo.toUpperCase() };
      setCatalogoCursos([nuevoItem, ...catalogoCursos]);
      setActiveTab('cursos');
    }

    setNuevoTitulo('');
    setNuevoDocente('');
    setShowCreateModal(false);
    setMensajeExito(`¡Producto [${nuevoCodigo.toUpperCase()}] creado con éxito!`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Guardar cambios de edición
  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditando) return;

    if (activeTab === 'diplomados') {
      setCatalogoDiplomados(prev => prev.map(item => item.id === itemEditando.id ? itemEditando : item));
    } else {
      setCatalogoCursos(prev => prev.map(item => item.id === itemEditando.id ? itemEditando : item));
    }

    setShowEditModal(false);
    setItemEditando(null);
    setMensajeExito("¡Producto actualizado correctamente!");
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Selección individual o deselección de un elemento
  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Seleccionar o deseleccionar todos los elementos visibles de la tabla actual
  const toggleSeleccionarTodos = () => {
    const idsVisibles = listaActual.map(item => item.id);
    const todosSeleccionados = idsVisibles.every(id => seleccionados.includes(id));

    if (todosSeleccionados) {
      setSeleccionados(prev => prev.filter(id => !idsVisibles.includes(id)));
    } else {
      setSeleccionados(prev => Array.from(new Set([...prev, ...idsVisibles])));
    }
  };

  // Eliminar elementos seleccionados (múltiples)
  const eliminarSeleccionados = () => {
    if (seleccionados.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${seleccionados.length} producto(s) seleccionado(s)?`)) return;

    if (activeTab === 'diplomados') {
      setCatalogoDiplomados(prev => prev.filter(item => !seleccionados.includes(item.id)));
    } else {
      setCatalogoCursos(prev => prev.filter(item => !seleccionados.includes(item.id)));
    }

    setSeleccionados([]);
    setMensajeExito("¡Productos eliminados correctamente!");
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const descargarPlantillaCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,codigo,tipo,docente,titulo\nDIP-23,diplomado,Reginaldo Andía,GESTIÓN AVANZADA DE PROYECTOS MINEROS\nCUR-77,curso,,IMPLEMENTACIÓN DE NORMAS DE SEGURIDAD";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_productos_edumin.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarPlantillaXlsx = () => {
    const csvContent = "data:application/vnd.ms-excel;charset=utf-8,codigo\ttipo\tdocente\ttitulo\nDIP-23\tdiplomado\tReginaldo Andía\tGESTIÓN AVANZADA DE PROYECTOS MINEROS\nCUR-77\tcurso\t\tIMPLEMENTACIÓN DE NORMAS DE SEGURIDAD";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_productos_edumin.xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportarArchivo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoImportado) {
      alert("Por favor selecciona un archivo CSV o XLSX primero.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const delimitador = text.includes('\t') ? '\t' : ',';
      const lineas = text.split('\n').filter(l => l.trim() !== '');
      let countAgregados = 0;

      for (let i = 1; i < lineas.length; i++) {
        const partes = lineas[i].split(delimitador).map(val => val ? val.trim().replace(/^"|"$/g, '') : '');
        const codigo = partes[0];
        const tipo = partes[1];
        const titulo = partes[3] || partes[2];

        if (codigo && titulo) {
          const idGen = titulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
          if (tipo?.toLowerCase() === 'curso') {
            setCatalogoCursos(prev => [{ id: idGen, codigo: codigo.toUpperCase(), titulo: titulo.toUpperCase() }, ...prev]);
          } else {
            setCatalogoDiplomados(prev => [{ id: idGen, codigo: codigo.toUpperCase(), titulo: titulo.toUpperCase() }, ...prev]);
          }
          countAgregados++;
        }
      }

      setShowCsvModal(false);
      setArchivoImportado(null);
      setMensajeExito(`¡Se importaron ${countAgregados} productos correctamente!`);
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
              <h1 className="text-3xl font-bold text-slate-900">Gestión de Productos Académicos</h1>
              <p className="text-slate-500 mt-1">Conexión directa con los archivos de <code className="text-indigo-600 font-mono">lib/data/diplomados/</code>.</p>
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
                <UploadCloud className="w-4 h-4 text-indigo-600" /> Carga Masiva (CSV / XLSX)
              </button>
              <button 
                type="button"
                onClick={() => setShowCreateModal(true)} 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Crear Nuevo Producto
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
                placeholder="Buscar (ej. logistica o dip-01)..."
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
                    <th className="pb-3 px-4">Docente</th>
                    <th className="pb-3 px-4 text-right">Acciones</th>
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
                            ? (modulosCounts[item.id] !== undefined ? `${modulosCounts[item.id]} Módulos` : 'Consultando...') 
                            : '1 Módulo'}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">{item.titulo}</td>
                        <td className="py-4 px-4 text-slate-500 italic">{(item as any).docente || 'Según JSON'}</td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button 
                            onClick={() => { setItemEditando({ ...item }); setShowEditModal(true); }}
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          {activeTab === 'diplomados' && (
                            <button 
                              onClick={() => abrirDiplomado(item)}
                              className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Layers className="size-3.5" /> Leer JSON
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

      {/* ========================================================= */}
      {/* MODAL: EDITAR PRODUCTO                                    */}
      {/* ========================================================= */}
      {showEditModal && itemEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Editar Producto Académico</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={itemEditando.codigo}
                  onChange={(e) => setItemEditando({ ...itemEditando, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 uppercase"
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
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVO PRODUCTO                               */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Crear Nuevo Producto Académico</h3>
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
                  <option value="diplomado">Diplomado Oficial (Con archivo JSON)</option>
                  <option value="curso">Curso de Alta Especialización</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único (Ej: DIP-23) <span className="text-red-500">*</span></label>
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
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CARGA MASIVA                                       */}
      {/* ========================================================= */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Carga Masiva de Productos</h3>
              <button onClick={() => setShowCsvModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleImportarArchivo} className="p-6 space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900">Descargar formato de plantilla vacía:</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={descargarPlantillaCsv}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="size-3.5" /> Plantilla CSV
                  </button>
                  <button
                    type="button"
                    onClick={descargarPlantillaXlsx}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="size-3.5" /> Plantilla XLSX
                  </button>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition relative">
                <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <label className="block text-xs font-bold text-slate-700 cursor-pointer">
                  <span>{archivoImportado ? archivoImportado.name : "Selecciona o arrastra tu archivo CSV / XLSX"}</span>
                  <input 
                    type="file" 
                    accept=".csv, .xlsx, .xls"
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
                  Subir y Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VISOR DE MÓDULOS (JSON)                            */}
      {/* ========================================================= */}
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
              <button onClick={() => setDiplomadoSeleccionado(null)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}