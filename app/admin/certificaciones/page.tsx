'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Award, CheckCircle2, QrCode, FileText, Download, Layers, 
  UserCheck, Server, X, Plus, Eye, Send, RefreshCw, Search, Filter,
  Check, Copy, Sparkles, GraduationCap, AlertTriangle, Printer, Share2,
  Edit3, Trash2, LayoutTemplate, Palette, BookmarkCheck, Upload, Image as ImageIcon,
  ArrowLeft, FileCheck, Building2, Bell
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';

export interface ModeloCertificado {
  id: string;
  nombre: string;
  tipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER';
  tituloCertificado: string;
  textoOtorgamiento: string;
  estiloMarco: 'dorado' | 'azul' | 'esmeralda' | 'granate' | 'tecnologico';
  orientacion: 'horizontal' | 'vertical';
  horas: string;
  firmas: string[];
  incluyeQr: boolean;
  esPredeterminado: boolean;
  fechaCreacion: string;
  imagenFondoUrl?: string | null;
  asignacionAlcance: 'SUPERPLANTILLA_GLOBAL' | 'PRODUCTO_ESPECIFICO';
  recursoAsignadoNombre?: string;
  recursoAsignadoId?: string;
}

export default function CertificacionesAdminPage() {
  const [activeTab, setActiveTab] = useState<'emitidos' | 'modelos' | 'editor' | 'cip' | 'emision'>('emitidos');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Catálogo real de la plataforma para asignación y filtros
  const [catalogoDiplomados, setCatalogoDiplomados] = useState<any[]>([]);
  const [catalogoCursos, setCatalogoCursos] = useState<any[]>([]);
  const [catalogoTalleres, setCatalogoTalleres] = useState<any[]>([]);

  // Registro de certificados emitidos
  const [certificadosEmitidos, setCertificadosEmitidos] = useState<any[]>([]);

  // Filtros para la pestaña de certificados emitidos
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPrograma, setFiltroPrograma] = useState<string>('todos');
  const [filtroEstadoFinanciero, setFiltroEstadoFinanciero] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroNota, setFiltroNota] = useState<string>('todos');

  // Modal de vista previa y duplicado de certificado A4 emitido
  const [certificadoParaVer, setCertificadoParaVer] = useState<any | null>(null);
  const [copiadoLink, setCopiadoLink] = useState(false);

  // Modal de previsualización dinámica para modelos de certificados
  const [modeloParaPrevisualizar, setModeloParaPrevisualizar] = useState<ModeloCertificado | null>(null);
  const [programaSimuladoEnModal, setProgramaSimuladoEnModal] = useState<string>('Seguridad y salud ocupacional en minería');

  // Certificaciones externas (solicitudes de alumnos y registros directos de convenios)
  const [solicitudesCip, setSolicitudesCip] = useState<any[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  const [codigoQrGen, setCodigoQrGen] = useState('EDM-2026-CIP-9843');
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);

  // Modal para registro directo de certificación externa (sin requerir solicitud de alumno)
  const [mostrarModalRegistroExterno, setMostrarModalRegistroExterno] = useState(false);
  const [nuevoExternoEstudiante, setNuevoExternoEstudiante] = useState('');
  const [nuevoExternoDni, setNuevoExternoDni] = useState('');
  const [nuevoExternoEmail, setNuevoExternoEmail] = useState('');
  const [nuevoExternoPrograma, setNuevoExternoPrograma] = useState('');
  const [nuevoExternoInstitucion, setNuevoExternoInstitucion] = useState('Colegio de Ingenieros del Perú (CIP)');
  const [nuevoExternoHoras, setNuevoExternoHoras] = useState('120 horas cronológicas');
  const [nuevoExternoNotificar, setNuevoExternoNotificar] = useState(true);
  const [nuevoExternoArchivo, setNuevoExternoArchivo] = useState<File | null>(null);

  // Galería de modelos de certificados (superplantillas y asignaciones)
  const [modelosCertificados, setModelosCertificados] = useState<ModeloCertificado[]>([
    {
      id: 'mod-01',
      nombre: 'Superplantilla maestra - Diplomas oficiales DAEM',
      tipo: 'DIPLOMA',
      tituloCertificado: 'DIPLOMA DE ALTA ESPECIALIZACIÓN',
      textoOtorgamiento: 'Por haber cumplido y aprobado con excelencia los 3 módulos del programa oficial de:',
      estiloMarco: 'dorado',
      orientacion: 'horizontal',
      horas: '120 horas cronológicas',
      firmas: ['Director Académico', 'Coordinador General'],
      incluyeQr: true,
      esPredeterminado: true,
      fechaCreacion: '2026-09-01',
      asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
      recursoAsignadoNombre: 'Todos los diplomados oficiales (22 diplomados)'
    },
    {
      id: 'mod-02',
      nombre: 'Superplantilla maestra - Certificados modulares',
      tipo: 'MODULAR',
      tituloCertificado: 'CERTIFICADO MODULAR OFICIAL',
      textoOtorgamiento: 'Por haber completado satisfactoriamente la evaluación y contenidos del módulo:',
      estiloMarco: 'azul',
      orientacion: 'horizontal',
      horas: '40 horas cronológicas',
      firmas: ['Director Académico'],
      incluyeQr: true,
      esPredeterminado: true,
      fechaCreacion: '2026-09-05',
      asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
      recursoAsignadoNombre: 'Todos los módulos de diplomados'
    },
    {
      id: 'mod-03',
      nombre: 'Superplantilla maestra - Cursos de especialización',
      tipo: 'CURSO',
      tituloCertificado: 'CERTIFICADO DE ESPECIALIZACIÓN PROFESIONAL',
      textoOtorgamiento: 'Por su destacada participación y aprobación del curso técnico intensivo de:',
      estiloMarco: 'esmeralda',
      orientacion: 'horizontal',
      horas: '24 a 30 horas cronológicas',
      firmas: ['Director Académico', 'Docente Titular'],
      incluyeQr: true,
      esPredeterminado: true,
      fechaCreacion: '2026-09-10',
      asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
      recursoAsignadoNombre: 'Todos los cursos de especialización (76 cursos)'
    },
    {
      id: 'mod-04',
      nombre: 'Plantilla de convenio - CIP Nacional',
      tipo: 'CIP',
      tituloCertificado: 'CERTIFICACIÓN CONVENIO OFICIAL CIP',
      textoOtorgamiento: 'En convenio interinstitucional con el Colegio de Ingenieros del Perú (CIP), acredita a:',
      estiloMarco: 'granate',
      orientacion: 'horizontal',
      horas: '120 horas cronológicas',
      firmas: ['Decano CIP Nacional', 'Director EDUMIN'],
      incluyeQr: true,
      esPredeterminado: false,
      fechaCreacion: '2026-09-12',
      asignacionAlcance: 'PRODUCTO_ESPECIFICO',
      recursoAsignadoNombre: 'Diplomado en seguridad y salud ocupacional'
    },
    {
      id: 'mod-05',
      nombre: 'Plantilla de convenio - Miami Internacional',
      tipo: 'MIAMI',
      tituloCertificado: 'INTERNATIONAL CERTIFICATE OF COMPLETION',
      textoOtorgamiento: 'University international partner certificate awarded for professional excellence in:',
      estiloMarco: 'azul',
      orientacion: 'horizontal',
      horas: '150 horas internacionales',
      firmas: ['International Dean', 'Executive Director'],
      incluyeQr: true,
      esPredeterminado: false,
      fechaCreacion: '2026-09-15',
      asignacionAlcance: 'PRODUCTO_ESPECIFICO',
      recursoAsignadoNombre: 'Minería 4.0, automatización y digitalización'
    },
    {
      id: 'mod-06',
      nombre: 'Superplantilla maestra - Talleres y masterclasses',
      tipo: 'TALLER',
      tituloCertificado: 'CONSTANCIA DE TALLER PRÁCTICO EN VIVO',
      textoOtorgamiento: 'Por su asistencia y participación en el taller especializado de:',
      estiloMarco: 'tecnologico',
      orientacion: 'horizontal',
      horas: '08 horas prácticas',
      firmas: ['Director Académico'],
      incluyeQr: true,
      esPredeterminado: false,
      fechaCreacion: '2026-09-18',
      asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
      recursoAsignadoNombre: 'Todos los talleres y masterclasses'
    }
  ]);

  // Estado del editor de certificados
  const [editorNombre, setEditorNombre] = useState('Superplantilla maestra - Cursos 2026');
  const [editorTipo, setEditorTipo] = useState<'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER'>('DIPLOMA');
  const [editorTitulo, setEditorTitulo] = useState('DIPLOMA DE ALTA ESPECIALIZACIÓN');
  const [editorTextoOtorgamiento, setEditorTextoOtorgamiento] = useState('Por haber aprobado con excelencia todos los requisitos académicos del programa de:');
  const [editorEstiloMarco, setEditorEstiloMarco] = useState<'dorado' | 'azul' | 'esmeralda' | 'granate' | 'tecnologico'>('dorado');
  const [editorOrientacion, setEditorOrientacion] = useState<'horizontal' | 'vertical'>('horizontal');
  const [editorHoras, setEditorHoras] = useState('120 horas cronológicas');
  const [editorFirmas, setEditorFirmas] = useState<string[]>(['Director Académico', 'Coordinador General']);
  const [editorIncluyeQr, setEditorIncluyeQr] = useState(true);
  const [editorImagenFondo, setEditorImagenFondo] = useState<string | null>(null);
  const [editorAlcance, setEditorAlcance] = useState<'SUPERPLANTILLA_GLOBAL' | 'PRODUCTO_ESPECIFICO'>('SUPERPLANTILLA_GLOBAL');
  const [editorRecursoEspecifico, setEditorRecursoEspecifico] = useState<string>('');
  const [modeloSeleccionadoId, setModeloSeleccionadoId] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      // 1. Cargar certificaciones y emitidos
      const resCert = await fetch('/api/admin/certificaciones');
      if (resCert.ok) {
        const data = await resCert.json();
        if (data.solicitudes) setSolicitudesCip(data.solicitudes);
        if (data.emitidos) setCertificadosEmitidos(data.emitidos);
      }

      // 2. Cargar catálogo de productos
      const resCat = await fetch('/api/admin/catalogo');
      if (resCat.ok) {
        const dataCat = await resCat.json();
        setCatalogoDiplomados(dataCat.diplomados || []);
        setCatalogoCursos(dataCat.cursosEspecializacion || []);
        setCatalogoTalleres(dataCat.talleres || []);
      }
    } catch (e) {
      console.error('Error cargando datos de certificaciones y catálogo:', e);
    } finally {
      setCargando(false);
    }
  };

  // Manejar cambio de filtro de tipo en emitidos para resetear programa
  const handleCambioFiltroTipo = (nuevoTipo: string) => {
    setFiltroTipo(nuevoTipo);
    setFiltroPrograma('todos');
  };

  // Obtener lista dinámica de programas válidos según el tipo seleccionado
  const obtenerProgramasSegunTipo = () => {
    if (filtroTipo === 'DIPLOMA' || filtroTipo === 'MODULAR') {
      return catalogoDiplomados.length > 0 
        ? catalogoDiplomados.map(d => d.titulo) 
        : Array.from(new Set(certificadosEmitidos.filter(c => c.tipo === 'DIPLOMA' || c.tipo === 'MODULAR').map(c => c.programa)));
    }
    if (filtroTipo === 'CURSO') {
      return catalogoCursos.length > 0 
        ? catalogoCursos.map(c => c.titulo) 
        : Array.from(new Set(certificadosEmitidos.filter(c => c.tipo === 'CURSO').map(c => c.programa)));
    }
    if (filtroTipo === 'TALLER') {
      return catalogoTalleres.length > 0 
        ? catalogoTalleres.map(t => t.titulo) 
        : Array.from(new Set(certificadosEmitidos.filter(c => c.tipo === 'TALLER').map(c => c.programa)));
    }
    // Todos
    return Array.from(new Set(certificadosEmitidos.map(c => c.programa))).filter(Boolean);
  };

  const listaProgramasFiltrados = obtenerProgramasSegunTipo();

  // Filtrado reactivo de certificados emitidos
  const certificadosFiltrados = certificadosEmitidos.filter(cert => {
    const q = busqueda.toLowerCase().trim();
    const coincideTexto = !q || (
      cert.estudiante.toLowerCase().includes(q) ||
      cert.dni.includes(q) ||
      cert.codigo.toLowerCase().includes(q) ||
      cert.programa.toLowerCase().includes(q) ||
      (cert.modulo && cert.modulo.toLowerCase().includes(q))
    );

    const coincideTipo = filtroTipo === 'todos' || cert.tipo === filtroTipo;
    const coincidePrograma = filtroPrograma === 'todos' || cert.programa.toLowerCase() === filtroPrograma.toLowerCase() || (cert.modulo && cert.modulo.toLowerCase().includes(filtroPrograma.toLowerCase()));
    
    let coincideEstado = true;
    if (filtroEstadoFinanciero === 'AL_DIA') coincideEstado = cert.habilitado === true;
    if (filtroEstadoFinanciero === 'DEUDA_PENDIENTE') coincideEstado = cert.habilitado === false;

    let coincideMes = true;
    if (filtroMes !== 'todos') {
      const mesNum = new Date(cert.fecha).getMonth() + 1;
      if (filtroMes === '09') coincideMes = mesNum === 9;
      if (filtroMes === '08') coincideMes = mesNum === 8;
      if (filtroMes === '07') coincideMes = mesNum === 7;
    }

    let coincideNota = true;
    if (filtroNota === '18-20') coincideNota = cert.nota >= 18;
    if (filtroNota === '14-17') coincideNota = cert.nota >= 14 && cert.nota < 18;
    if (filtroNota === '12-13') coincideNota = cert.nota >= 12 && cert.nota < 14;

    return coincideTexto && coincideTipo && coincidePrograma && coincideEstado && coincideMes && coincideNota;
  });

  // Cargar modelo seleccionado al editor visual
  const cargarModeloEnEditor = (modelo: ModeloCertificado) => {
    setModeloSeleccionadoId(modelo.id);
    setEditorNombre(modelo.nombre);
    setEditorTipo(modelo.tipo);
    setEditorTitulo(modelo.tituloCertificado);
    setEditorTextoOtorgamiento(modelo.textoOtorgamiento);
    setEditorEstiloMarco(modelo.estiloMarco);
    setEditorOrientacion(modelo.orientacion || 'horizontal');
    setEditorHoras(modelo.horas);
    setEditorFirmas(modelo.firmas);
    setEditorIncluyeQr(modelo.incluyeQr);
    setEditorImagenFondo(modelo.imagenFondoUrl || null);
    setEditorAlcance(modelo.asignacionAlcance);
    setEditorRecursoEspecifico(modelo.recursoAsignadoNombre || '');
    setActiveTab('editor');
  };

  const iniciarNuevoModelo = () => {
    setModeloSeleccionadoId(null);
    setEditorNombre(`Nuevo modelo de certificado #${modelosCertificados.length + 1}`);
    setEditorTipo('DIPLOMA');
    setEditorTitulo('DIPLOMA DE ALTA ESPECIALIZACIÓN');
    setEditorTextoOtorgamiento('Por haber completado satisfactoriamente los requisitos académicos del programa de:');
    setEditorEstiloMarco('dorado');
    setEditorOrientacion('horizontal');
    setEditorHoras('120 horas cronológicas');
    setEditorFirmas(['Director Académico']);
    setEditorIncluyeQr(true);
    setEditorImagenFondo(null);
    setEditorAlcance('SUPERPLANTILLA_GLOBAL');
    setEditorRecursoEspecifico('');
    setActiveTab('editor');
  };

  const abrirPrevisualizacionModelo = (modelo: ModeloCertificado) => {
    setModeloParaPrevisualizar(modelo);
    if (modelo.recursoAsignadoNombre && modelo.asignacionAlcance === 'PRODUCTO_ESPECIFICO') {
      setProgramaSimuladoEnModal(modelo.recursoAsignadoNombre);
    } else if (modelo.tipo === 'CURSO') {
      setProgramaSimuladoEnModal(catalogoCursos[0]?.titulo || 'Gestión de trabajo en alto riesgo en minería');
    } else if (modelo.tipo === 'TALLER') {
      setProgramaSimuladoEnModal(catalogoTalleres[0]?.titulo || 'Primeros auxilios y emergencias mineras');
    } else {
      setProgramaSimuladoEnModal(catalogoDiplomados[0]?.titulo || 'Seguridad y salud ocupacional en minería');
    }
  };

  const guardarModeloEnGaleria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorNombre.trim()) return;

    const nombreRecursoFinal = editorAlcance === 'SUPERPLANTILLA_GLOBAL' 
      ? (editorTipo === 'DIPLOMA' ? 'Todos los diplomados oficiales (22 diplomados)' :
         editorTipo === 'MODULAR' ? 'Todos los módulos de diplomados' :
         editorTipo === 'CURSO' ? 'Todos los cursos de especialización (76 cursos)' :
         editorTipo === 'TALLER' ? 'Todos los talleres y masterclasses' : 'Todos los programas de esta categoría')
      : (editorRecursoEspecifico || 'Programa específico asignado');

    if (modeloSeleccionadoId) {
      setModelosCertificados(prev => prev.map(m => m.id === modeloSeleccionadoId ? {
        ...m,
        nombre: editorNombre,
        tipo: editorTipo,
        tituloCertificado: editorTitulo,
        textoOtorgamiento: editorTextoOtorgamiento,
        estiloMarco: editorEstiloMarco,
        orientacion: editorOrientacion,
        horas: editorHoras,
        firmas: editorFirmas,
        incluyeQr: editorIncluyeQr,
        imagenFondoUrl: editorImagenFondo,
        asignacionAlcance: editorAlcance,
        recursoAsignadoNombre: nombreRecursoFinal
      } : m));
      setMensajeExito(`¡Modelo "${editorNombre}" actualizado con éxito!`);
    } else {
      const nuevoId = `mod-${(modelosCertificados.length + 1).toString().padStart(2, '0')}`;
      const nuevoModelo: ModeloCertificado = {
        id: nuevoId,
        nombre: editorNombre,
        tipo: editorTipo,
        tituloCertificado: editorTitulo,
        textoOtorgamiento: editorTextoOtorgamiento,
        estiloMarco: editorEstiloMarco,
        orientacion: editorOrientacion,
        horas: editorHoras,
        firmas: editorFirmas,
        incluyeQr: editorIncluyeQr,
        imagenFondoUrl: editorImagenFondo,
        asignacionAlcance: editorAlcance,
        recursoAsignadoNombre: nombreRecursoFinal,
        esPredeterminado: editorAlcance === 'SUPERPLANTILLA_GLOBAL',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      setModelosCertificados(prev => [nuevoModelo, ...prev]);
      setModeloSeleccionadoId(nuevoId);
      setMensajeExito(`¡Nuevo modelo guardado y asignado a: ${nombreRecursoFinal}!`);
    }

    setActiveTab('modelos');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const duplicarModelo = (modelo: ModeloCertificado) => {
    const nuevoId = `mod-${Date.now().toString().slice(-4)}`;
    const clon: ModeloCertificado = {
      ...modelo,
      id: nuevoId,
      nombre: `${modelo.nombre} (copia)`,
      esPredeterminado: false,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
    setModelosCertificados(prev => [clon, ...prev]);
    setMensajeExito(`¡Modelo duplicado como "${clon.nombre}"!`);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const eliminarModelo = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este modelo de certificado de la galería?')) {
      setModelosCertificados(prev => prev.filter(m => m.id !== id));
      setMensajeExito('Modelo eliminado de la galería.');
      setTimeout(() => setMensajeExito(null), 3000);
    }
  };

  const handleSubirImagenFondo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditorImagenFondo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Registrar certificación externa directa
  const registrarCertificacionExternaDirecta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoExternoEstudiante.trim() || !nuevoExternoDni.trim()) return;

    const codigoGenerado = `EDM-2026-EXT-${Math.floor(1000 + Math.random() * 9000)}`;
    const nuevaCertificacion = {
      id: `ext-${Date.now().toString().slice(-4)}`,
      estudiante: nuevoExternoEstudiante,
      dni: nuevoExternoDni,
      email: nuevoExternoEmail || `${nuevoExternoDni}@edumin.pe`,
      programa: nuevoExternoPrograma || 'Programa de especialización con convenio institucional',
      tipo: nuevoExternoInstitucion,
      horas: nuevoExternoHoras,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Emitido',
      codigo: codigoGenerado
    };

    setSolicitudesCip(prev => [nuevaCertificacion, ...prev]);
    setMostrarModalRegistroExterno(false);
    setMensajeExito(`¡Certificación externa registrada exitosamente para ${nuevoExternoEstudiante} con código ${codigoGenerado}!`);
    
    // Limpiar campos
    setNuevoExternoEstudiante('');
    setNuevoExternoDni('');
    setNuevoExternoEmail('');
    setNuevoExternoPrograma('');
    setNuevoExternoArchivo(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const aprobarCertificadoCip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada) return;

    try {
      await fetch('/api/admin/certificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitudSeleccionada.id,
          dni: solicitudSeleccionada.dni,
          codigoQr: codigoQrGen
        })
      });
    } catch (err) {
      console.error(err);
    }

    setSolicitudesCip(prev => prev.map(s => s.id === solicitudSeleccionada.id ? { ...s, estado: 'Emitido' } : s));
    setSolicitudSeleccionada(null);
    setMensajeExito(`¡Certificación asignada exitosamente con código ${codigoQrGen}!`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const copiarEnlaceVerificacion = (codigo: string) => {
    const link = `https://edumin.pe/validar/${codigo}`;
    navigator.clipboard.writeText(link);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  // Estilos CSS para marcos vectoriales
  const marcoEstilos = {
    dorado: 'border-amber-600/40 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 shadow-amber-900/10 text-slate-900',
    azul: 'border-indigo-600/40 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/50 shadow-indigo-900/10 text-slate-900',
    esmeralda: 'border-emerald-600/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/50 shadow-emerald-900/10 text-slate-900',
    granate: 'border-rose-700/40 bg-gradient-to-br from-rose-50/40 via-white to-amber-50/40 shadow-rose-900/10 text-slate-900',
    tecnologico: 'border-purple-600/40 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-purple-900/20'
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar unificado */}
      <AdminSidebar />

      {/* Contenido principal */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0 h-full">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                  Acreditación y diseño
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">• Superplantillas dinámicas y duplicados</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Centro de certificaciones y modelos A4
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={iniciarNuevoModelo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear nuevo modelo
              </button>
            </div>
          </div>

          {mensajeExito && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          {/* Navegación por pestañas principales (Editor abre desde Modelos) */}
          {activeTab !== 'editor' && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
              
              {/* PESTAÑA 1: CERTIFICADOS EMITIDOS */}
              <button
                onClick={() => setActiveTab('emitidos')}
                className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'emitidos' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Award className="w-4 h-4 text-indigo-600" />
                Certificados emitidos ({certificadosEmitidos.length})
              </button>

              {/* PESTAÑA 2: MODELOS DE CERTIFICADOS */}
              <button
                onClick={() => setActiveTab('modelos')}
                className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'modelos' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LayoutTemplate className="w-4 h-4 text-purple-600" /> 
                Modelos de certificados ({modelosCertificados.length})
              </button>

              {/* PESTAÑA 3: CERTIFICACIONES EXTERNAS (CONVENIOS Y SOLICITUDES) */}
              <button
                onClick={() => setActiveTab('cip')}
                className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'cip' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" /> 
                Certificaciones externas ({solicitudesCip.length})
              </button>

              {/* PESTAÑA 4: EMISIÓN MASIVA */}
              <button
                onClick={() => setActiveTab('emision')}
                className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'emision' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Layers className="w-4 h-4" /> 
                Emisión masiva
              </button>
            </div>
          )}

          {/* TAB 1: REGISTRO GENERAL DE CERTIFICADOS EMITIDOS */}
          {activeTab === 'emitidos' && (
            <div className="space-y-6">
              
              {/* Barra de filtros dependientes */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Búsqueda y filtros por tipo y catálogo
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                    {certificadosFiltrados.length} certificados encontrados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Buscador de Alumno / DNI / Código */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Buscar alumno, DNI o código
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar por alumno, DNI o código..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Filtro Tipo de Certificado (Strictly: Todos, Diplomas generales, Certificados modulares, Cursos, Talleres) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tipo de certificado
                    </label>
                    <select 
                      value={filtroTipo} 
                      onChange={(e) => handleCambioFiltroTipo(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos</option>
                      <option value="DIPLOMA">Diplomas generales</option>
                      <option value="MODULAR">Certificados modulares</option>
                      <option value="CURSO">Cursos</option>
                      <option value="TALLER">Talleres</option>
                    </select>
                  </div>

                  {/* Filtro Programa Dependiente según Tipo */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Programa ({listaProgramasFiltrados.length})
                    </label>
                    <select 
                      value={filtroPrograma} 
                      onChange={(e) => setFiltroPrograma(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer truncate"
                    >
                      <option value="todos">
                        {filtroTipo === 'DIPLOMA' ? 'Todos los diplomados' :
                         filtroTipo === 'MODULAR' ? 'Todos los diplomados y módulos' :
                         filtroTipo === 'CURSO' ? 'Todos los cursos' :
                         filtroTipo === 'TALLER' ? 'Todos los talleres' : 'Todos los programas'}
                      </option>
                      {listaProgramasFiltrados.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Estado Financiero */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Estado de cuenta
                    </label>
                    <select 
                      value={filtroEstadoFinanciero} 
                      onChange={(e) => setFiltroEstadoFinanciero(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="AL_DIA">Al día (habilitado)</option>
                      <option value="DEUDA_PENDIENTE">Cuota pendiente (retenido)</option>
                    </select>
                  </div>

                  {/* Filtro Calificación */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Calificación
                    </label>
                    <select 
                      value={filtroNota} 
                      onChange={(e) => setFiltroNota(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todas las calificaciones</option>
                      <option value="18-20">Sobresaliente (18 - 20)</option>
                      <option value="14-17">Aprobado (14 - 17)</option>
                      <option value="12-13">Regular (12 - 13)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Tabla de Certificados Emitidos */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="py-3.5 px-4">Estudiante / DNI</th>
                        <th className="py-3.5 px-4">Tipo y certificación</th>
                        <th className="py-3.5 px-4">Código de validación</th>
                        <th className="py-3.5 px-4">Calificación</th>
                        <th className="py-3.5 px-4">Fecha de emisión</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones de soporte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {certificadosFiltrados.length > 0 ? (
                        certificadosFiltrados.map((cert) => (
                          <tr key={cert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            
                            {/* Estudiante (sin correo según solicitud) */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{cert.estudiante}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                DNI: {cert.dni}
                              </div>
                            </td>

                            {/* Tipo y Programa (sin horas en la tabla según solicitud) */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex items-center gap-1.5 mb-1">
                                {cert.tipo === 'DIPLOMA' && (
                                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-blue-200 dark:border-blue-800">
                                    Diploma general
                                  </span>
                                )}
                                {cert.tipo === 'MODULAR' && (
                                  <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-amber-200 dark:border-amber-800">
                                    Certificado modular
                                  </span>
                                )}
                                {cert.tipo === 'CURSO' && (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                                    Curso
                                  </span>
                                )}
                                {cert.tipo === 'TALLER' && (
                                  <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-purple-200 dark:border-purple-800">
                                    Taller
                                  </span>
                                )}
                              </div>

                              <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug truncate">
                                {cert.modulo ? cert.modulo : cert.programa}
                              </div>
                              {cert.modulo && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  Diplomado: {cert.programa}
                                </div>
                              )}
                            </td>

                            {/* Código QR Seguro */}
                            <td className="py-3.5 px-4 font-mono">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                                {cert.codigo}
                              </span>
                            </td>

                            {/* Calificación (solo el número, sin /20 según solicitud) */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                <span>{cert.nota}</span>
                              </div>
                            </td>

                            {/* Fecha */}
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {cert.fecha}
                            </td>

                            {/* Estado Financiero */}
                            <td className="py-3.5 px-4">
                              {cert.habilitado ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Habilitado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Requiere estar al día en pagos">
                                  <AlertTriangle className="w-3 h-3" /> Cuota pendiente
                                </span>
                              )}
                            </td>

                            {/* Acciones de Soporte */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setCertificadoParaVer(cert)}
                                  className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl transition cursor-pointer"
                                  title="Ver vista previa oficial"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => setCertificadoParaVer(cert)}
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                                  title="Descargar duplicado en PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => copiarEnlaceVerificacion(cert.codigo)}
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                                  title="Copiar enlace de validación QR"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                            No se encontraron certificados con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MODELOS DE CERTIFICADOS (SIN FILTROS Y CON BOTÓN DE PREVISUALIZACIÓN) */}
          {activeTab === 'modelos' && (
            <div className="space-y-6">
              
              {/* Encabezado limpio sin filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Modelos de certificados y plantillas A4</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Superplantillas maestras y plantillas asignadas a programas específicos.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={iniciarNuevoModelo}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Crear nuevo modelo
                  </button>
                </div>
              </div>

              {/* Grid de Modelos de Certificados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modelosCertificados.map((modelo) => (
                  <div 
                    key={modelo.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Miniatura Simulada A4 del Modelo */}
                    <div className="p-4 bg-slate-950 flex items-center justify-center relative min-h-[170px]">
                      <div 
                        className={`p-4 rounded-xl border-4 text-center w-full shadow-lg relative overflow-hidden transition-all ${
                          modelo.orientacion === 'vertical' ? 'max-w-[200px] min-h-[220px]' : 'max-w-[280px]'
                        } ${
                          modelo.imagenFondoUrl ? 'bg-cover bg-center border-slate-700 text-slate-900' :
                          modelo.estiloMarco === 'dorado' ? 'border-amber-500/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 text-slate-900' :
                          modelo.estiloMarco === 'azul' ? 'border-blue-500/60 bg-gradient-to-br from-blue-50 via-white to-blue-50/60 text-slate-900' :
                          modelo.estiloMarco === 'esmeralda' ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 text-slate-900' :
                          modelo.estiloMarco === 'granate' ? 'border-rose-600/60 bg-gradient-to-br from-rose-50 via-white to-amber-50/50 text-slate-900' :
                          'border-purple-500/60 bg-slate-900 text-white'
                        }`}
                        style={modelo.imagenFondoUrl ? { backgroundImage: `url(${modelo.imagenFondoUrl})` } : {}}
                      >
                        <div className="flex justify-between items-center pb-1 mb-1 border-b border-black/10">
                          <span className="text-[7px] font-mono font-bold tracking-widest uppercase opacity-70">EDUMIN LMS</span>
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <h5 className="text-[10px] font-black tracking-tight uppercase leading-tight line-clamp-1">{modelo.tituloCertificado}</h5>
                        <div className="my-1 py-0.5 border-y border-black/10 text-[8px] font-serif font-bold underline opacity-80">[Nombre del estudiante]</div>
                        <p className="text-[7px] font-bold opacity-80 line-clamp-1 text-indigo-900">
                          {modelo.recursoAsignadoNombre || 'Programa académico oficial'}
                        </p>
                        
                        <div className="mt-2 pt-1 border-t border-black/10 flex justify-between items-center text-[7px] opacity-60 font-mono">
                          <span>{modelo.horas}</span>
                          <QrCode className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="bg-slate-800/90 text-slate-300 text-[8px] font-mono px-2 py-0.5 rounded-full border border-slate-700">
                          {modelo.orientacion === 'vertical' ? 'Vertical A4' : 'Horizontal A4'}
                        </span>
                        {modelo.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' ? (
                          <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300" /> Superplantilla
                          </span>
                        ) : (
                          <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow">
                            Específico
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información y Asignación del Modelo */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {modelo.tipo}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {modelo.imagenFondoUrl ? 'Con fondo membretado' : `Marco ${modelo.estiloMarco}`}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{modelo.nombre}</h4>
                        
                        {/* Indicador de asignación en el catálogo */}
                        <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Asignado a:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                            {modelo.recursoAsignadoNombre || 'Superplantilla maestra'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-400 font-mono">
                          {modelo.horas}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Botón de Previsualización según diplomado o curso */}
                          <button
                            onClick={() => abrirPrevisualizacionModelo(modelo)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Previsualizar cómo se vería con cualquier curso o diplomado"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Previsualizar</span>
                          </button>

                          <button
                            onClick={() => cargarModeloEnEditor(modelo)}
                            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Editar plantilla"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => duplicarModelo(modelo)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Duplicar modelo"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => eliminarModelo(modelo.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                            title="Eliminar modelo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB DE EDICIÓN VISUAL (CANVAS A4 CON FONDO, ORIENTACIÓN Y ASIGNACIÓN) */}
          {activeTab === 'editor' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('modelos')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver a modelos de certificados
                  </button>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {modeloSeleccionadoId ? `Editando: ${editorNombre}` : 'Diseñar nuevo modelo de certificado A4'}
                  </h3>
                  <p className="text-xs text-slate-500">Configura orientación horizontal/vertical, marco, fondo membretado y alcance del modelo.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('modelos')}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Panel de Configuración Lateral */}
                <form onSubmit={guardarModeloEnGaleria} className="lg:col-span-5 space-y-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> Configuración y asignación
                  </h4>

                  {/* Nombre del modelo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Nombre del modelo / plantilla
                    </label>
                    <input 
                      type="text"
                      value={editorNombre}
                      onChange={(e) => setEditorNombre(e.target.value)}
                      required
                      placeholder="Ej. Superplantilla de cursos 2026"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {/* Orientación A4 Horizontal vs Vertical */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Orientación del papel A4
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditorOrientacion('horizontal')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          editorOrientacion === 'horizontal' 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>A4 Horizontal (Landscape)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorOrientacion('vertical')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          editorOrientacion === 'vertical' 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>A4 Vertical (Portrait)</span>
                      </button>
                    </div>
                  </div>

                  {/* Tipo de certificado y estilo de marco */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Tipo de certificado
                      </label>
                      <select 
                        value={editorTipo}
                        onChange={(e) => setEditorTipo(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="DIPLOMA">Diploma oficial (3 módulos)</option>
                        <option value="MODULAR">Certificado modular</option>
                        <option value="CURSO">Curso de especialización</option>
                        <option value="CIP">Convenio CIP nacional</option>
                        <option value="MIAMI">Convenio Miami internacional</option>
                        <option value="TALLER">Taller / masterclass</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Estilo de marco
                      </label>
                      <select 
                        value={editorEstiloMarco}
                        onChange={(e) => setEditorEstiloMarco(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="dorado">Dorado clásico</option>
                        <option value="azul">Azul institucional</option>
                        <option value="esmeralda">Esmeralda moderno</option>
                        <option value="granate">Granate académico</option>
                        <option value="tecnologico">Tecnológico oscuro</option>
                      </select>
                    </div>
                  </div>

                  {/* Asignación de alcance: Superplantilla vs Producto específico */}
                  <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-2.5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                      Asignación a productos del catálogo
                    </label>
                    
                    <div className="flex gap-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="alcance"
                          value="SUPERPLANTILLA_GLOBAL"
                          checked={editorAlcance === 'SUPERPLANTILLA_GLOBAL'}
                          onChange={() => setEditorAlcance('SUPERPLANTILLA_GLOBAL')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Superplantilla maestra (todos)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="alcance"
                          value="PRODUCTO_ESPECIFICO"
                          checked={editorAlcance === 'PRODUCTO_ESPECIFICO'}
                          onChange={() => setEditorAlcance('PRODUCTO_ESPECIFICO')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Producto específico</span>
                      </label>
                    </div>

                    {editorAlcance === 'PRODUCTO_ESPECIFICO' && (
                      <div className="pt-1">
                        <select
                          value={editorRecursoEspecifico}
                          onChange={(e) => setEditorRecursoEspecifico(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
                        >
                          <option value="">Selecciona el diplomado o curso específico...</option>
                          {editorTipo === 'DIPLOMA' || editorTipo === 'MODULAR' || editorTipo === 'CIP' || editorTipo === 'MIAMI' ? (
                            catalogoDiplomados.map(d => (
                              <option key={d.id} value={d.titulo}>{d.titulo}</option>
                            ))
                          ) : (
                            catalogoCursos.map(c => (
                              <option key={c.id} value={c.titulo}>{c.titulo}</option>
                            ))
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Carga de imagen de fondo / membrete */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Imagen de fondo o membrete oficial A4
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{editorImagenFondo ? 'Cambiar imagen de fondo' : 'Subir imagen A4 (PNG o JPG)'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleSubirImagenFondo} 
                          className="hidden" 
                        />
                      </label>

                      {editorImagenFondo && (
                        <button
                          type="button"
                          onClick={() => setEditorImagenFondo(null)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition text-xs font-bold"
                          title="Quitar imagen y usar marco vectorial"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Título de encabezado */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Título del encabezado
                    </label>
                    <input 
                      type="text"
                      value={editorTitulo}
                      onChange={(e) => setEditorTitulo(e.target.value)}
                      required
                      placeholder="Ej. DIPLOMA DE ALTA ESPECIALIZACIÓN"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {/* Texto de otorgamiento */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Texto de otorgamiento
                    </label>
                    <textarea 
                      rows={2}
                      value={editorTextoOtorgamiento}
                      onChange={(e) => setEditorTextoOtorgamiento(e.target.value)}
                      placeholder="Por haber cumplido y aprobado con excelencia..."
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {/* Horas */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Horas cronológicas
                    </label>
                    <input 
                      type="text"
                      value={editorHoras}
                      onChange={(e) => setEditorHoras(e.target.value)}
                      placeholder="Ej. 120 horas cronológicas"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {/* Variables dinámicas */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5">
                      Variables dinámicas automáticas
                    </label>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-indigo-600">[Nombre alumno]</span>
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-indigo-600">[Programa]</span>
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-indigo-600">[Módulo]</span>
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-indigo-600">[Fecha]</span>
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-indigo-600">[Código QR]</span>
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-indigo-600">[Nota]</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input 
                        type="checkbox"
                        checked={editorIncluyeQr}
                        onChange={(e) => setEditorIncluyeQr(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                      />
                      <span>Incluir código QR</span>
                    </label>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                      <span>{modeloSeleccionadoId ? 'Guardar cambios' : 'Guardar en galería'}</span>
                    </button>
                  </div>
                </form>

                {/* Canvas A4 en Tiempo Real (Adaptable Horizontal / Vertical) */}
                <div className="lg:col-span-7 bg-slate-950 p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center min-h-[460px] border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" /> Vista previa del lienzo A4 {editorOrientacion === 'vertical' ? 'Vertical (Portrait)' : 'Horizontal (Landscape)'}
                  </span>

                  <div 
                    className={`rounded-2xl border-8 text-center shadow-2xl relative transition-all overflow-hidden ${
                      editorOrientacion === 'vertical' ? 'w-full max-w-sm py-10 px-6' : 'w-full max-w-lg p-8'
                    } ${
                      editorImagenFondo ? 'bg-cover bg-center border-slate-700 text-slate-900' : marcoEstilos[editorEstiloMarco]
                    }`}
                    style={editorImagenFondo ? { backgroundImage: `url(${editorImagenFondo})` } : {}}
                  >
                    {/* Header Institucional */}
                    <div className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-3 mb-4">
                      <div className="text-left">
                        <span className="text-[8px] font-mono font-bold tracking-widest block opacity-70">ESCUELA DE POSTGRADO & MINERÍA</span>
                        <h4 className="text-[11px] font-black tracking-tight">INSTITUTO INTERNACIONAL EDUMIN</h4>
                      </div>
                      <div className="size-8 rounded-full bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center font-black text-xs text-indigo-600">
                        EM
                      </div>
                    </div>

                    <span className="text-[9px] uppercase font-bold tracking-widest opacity-75 block">
                      {editorTitulo}
                    </span>

                    <p className="text-[10px] opacity-70 mt-2">Otorgado a favor de:</p>
                    
                    <h3 className="text-lg font-extrabold font-serif my-2 underline decoration-amber-500 underline-offset-4">
                      [Nombre del estudiante]
                    </h3>
                    <p className="text-[9px] opacity-60 font-mono">DNI / CE: [DNI del estudiante]</p>

                    <p className="text-xs mt-3 px-2 leading-relaxed opacity-85">
                      {editorTextoOtorgamiento}
                    </p>
                    <p className="text-xs font-black mt-1 uppercase px-2">
                      {editorRecursoEspecifico || '[Nombre del programa académico / diplomado]'}
                    </p>

                    <div className="my-3 flex items-center justify-center gap-3 text-[10px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                        ⏱️ {editorHoras}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                        🏆 Calificación: [Nota]
                      </span>
                    </div>

                    {/* Footer del Certificado */}
                    <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex justify-between items-end text-[8px] opacity-80">
                      <div className="text-left font-mono">
                        <p>Emisión: [Fecha actual]</p>
                        <p className="font-bold mt-0.5">Código: EDM-2026-CERT-9X2K</p>
                      </div>

                      <div className="flex gap-4">
                        {editorFirmas.map((f, i) => (
                          <div key={i} className="text-center">
                            <div className="w-16 border-b border-black/30 dark:border-white/30 mb-0.5"></div>
                            <span className="text-[7px] block font-bold">{f}</span>
                          </div>
                        ))}
                      </div>

                      {editorIncluyeQr && (
                        <div className="flex flex-col items-center p-1 bg-white text-slate-900 rounded-md border border-slate-200 shadow-sm">
                          <QrCode className="w-5 h-5" />
                          <span className="text-[6px] font-mono font-bold">QR VÁLIDO</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: CERTIFICACIONES EXTERNAS (SOLICITUDES CIP/MIAMI Y REGISTRO DIRECTO) */}
          {activeTab === 'cip' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Certificaciones externas y convenios</h3>
                  <p className="text-xs text-slate-500">Gestión de certificaciones oficiales del Colegio de Ingenieros (CIP), University of Miami y aliados.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setMostrarModalRegistroExterno(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar certificación externa</span>
                  </button>

                  <button 
                    onClick={cargarDatosIniciales}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Actualizar bandeja"
                  >
                    <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="pb-3 px-4">DNI / CE</th>
                      <th className="pb-3 px-4">Estudiante</th>
                      <th className="pb-3 px-4">Programa aprobado</th>
                      <th className="pb-3 px-4">Institución / Convenio</th>
                      <th className="pb-3 px-4">Estado</th>
                      <th className="pb-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {solicitudesCip.length > 0 ? (
                      solicitudesCip.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.dni}</td>
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {s.estudiante}
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{s.programa}</td>
                          <td className="py-4 px-4">
                            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                              {s.tipo}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.estado === 'Emitido' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                              {s.estado}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {s.estado === 'Pendiente' ? (
                              <button
                                onClick={() => setSolicitudSeleccionada(s)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" /> Asignar PDF y QR
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Habilitado con QR
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                          {cargando ? 'Cargando certificaciones...' : 'No hay certificaciones externas registradas.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EMISIÓN MASIVA */}
          {activeTab === 'emision' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Emisión masiva de certificados</h3>
                <p className="text-xs text-slate-500">Genera certificados en lote para todos los estudiantes con calificación aprobatoria (nota &gt;= 12).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Seleccionar diplomado
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600">
                    <option value="1">1. Derecho minero y gestión de tierras</option>
                    <option value="2">2. Geología minera, yacimientos y exploración</option>
                    <option value="3">3. Sistemas integrados de gestión HSEQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Seleccionar módulo
                  </label>
                  <select className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600">
                    <option value="m1">Módulo I: Marco legal minero</option>
                    <option value="m2">Módulo II: Permisos ambientales</option>
                    <option value="all">Todos los módulos del diplomado</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => { setMensajeExito('¡Se generaron certificados PDF con código de validación para los alumnos aprobados!'); setTimeout(() => setMensajeExito(null), 4000); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" /> Generar diplomas masivos (nota &gt;= 12)
              </button>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: PREVISUALIZACIÓN DINÁMICA DE MODELO / SUPERPLANTILLA */}
      {modeloParaPrevisualizar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-8">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Previsualización dinámica del modelo ({modeloParaPrevisualizar.orientacion === 'vertical' ? 'A4 Vertical' : 'A4 Horizontal'})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {modeloParaPrevisualizar.nombre}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModeloParaPrevisualizar(null)} 
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector interactivo de simulación con programas del catálogo */}
            <div className="px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Simular con este programa:</span>
              </label>

              <select
                value={programaSimuladoEnModal}
                onChange={(e) => setProgramaSimuladoEnModal(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 max-w-sm truncate"
              >
                <optgroup label="Diplomados oficiales">
                  {catalogoDiplomados.map(d => (
                    <option key={d.id} value={d.titulo}>{d.titulo}</option>
                  ))}
                  {catalogoDiplomados.length === 0 && (
                    <>
                      <option value="Seguridad y salud ocupacional en minería">Seguridad y salud ocupacional en minería</option>
                      <option value="Derecho minero y gestión de tierras">Derecho minero y gestión de tierras</option>
                      <option value="Geología minera, yacimientos y exploración">Geología minera, yacimientos y exploración</option>
                    </>
                  )}
                </optgroup>
                <optgroup label="Cursos de especialización">
                  {catalogoCursos.map(c => (
                    <option key={c.id} value={c.titulo}>{c.titulo}</option>
                  ))}
                  {catalogoCursos.length === 0 && (
                    <>
                      <option value="Gestión de trabajo en alto riesgo en minería">Gestión de trabajo en alto riesgo en minería</option>
                      <option value="Software aplicado: Leapfrog Geo y Datamine">Software aplicado: Leapfrog Geo y Datamine</option>
                    </>
                  )}
                </optgroup>
                <optgroup label="Talleres">
                  {catalogoTalleres.map(t => (
                    <option key={t.id} value={t.titulo}>{t.titulo}</option>
                  ))}
                  {catalogoTalleres.length === 0 && (
                    <option value="Primeros auxilios y emergencias mineras">Primeros auxilios y emergencias mineras</option>
                  )}
                </optgroup>
              </select>
            </div>

            {/* Certificado Canvas A4 Simulado */}
            <div className="p-6 bg-slate-950 flex items-center justify-center">
              <div 
                className={`rounded-2xl border-8 text-center shadow-2xl relative transition-all overflow-hidden ${
                  modeloParaPrevisualizar.orientacion === 'vertical' ? 'w-full max-w-sm py-10 px-6' : 'w-full max-w-lg p-8'
                } ${
                  modeloParaPrevisualizar.imagenFondoUrl ? 'bg-cover bg-center border-slate-700 text-slate-900' : marcoEstilos[modeloParaPrevisualizar.estiloMarco]
                }`}
                style={modeloParaPrevisualizar.imagenFondoUrl ? { backgroundImage: `url(${modeloParaPrevisualizar.imagenFondoUrl})` } : {}}
              >
                
                {/* Logo y Encabezado */}
                <div className="flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-3 mb-4">
                  <div className="text-left">
                    <span className="text-[9px] font-mono font-bold tracking-widest block opacity-70">ESCUELA DE POSTGRADO & MINERÍA</span>
                    <h4 className="text-xs font-black">INSTITUTO INTERNACIONAL EDUMIN</h4>
                  </div>
                  <div className="size-8 rounded-full bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-700 font-black text-xs">
                    EM
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block">
                  {modeloParaPrevisualizar.tituloCertificado}
                </span>

                <p className="text-[11px] opacity-70 mt-2">Otorgado a favor de:</p>
                
                <h3 className="text-xl font-extrabold font-serif my-2 underline decoration-amber-500 underline-offset-4">
                  Ing. Carlos Mendoza Quispe
                </h3>
                <p className="text-[10px] opacity-60 font-mono">DNI / CE: 74589210</p>

                <p className="text-xs mt-3 px-4 leading-relaxed opacity-85">
                  {modeloParaPrevisualizar.textoOtorgamiento}
                </p>
                <p className="text-sm font-black mt-1 uppercase px-4 text-indigo-950 dark:text-indigo-200">
                  {programaSimuladoEnModal}
                </p>

                <div className="my-4 flex items-center justify-center gap-4 text-xs font-bold">
                  <span className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                    ⏱️ {modeloParaPrevisualizar.horas}
                  </span>
                  <span className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                    🏆 Calificación: 19
                  </span>
                </div>

                {/* Footer del Certificado */}
                <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 flex justify-between items-end text-[9px] opacity-80">
                  <div className="text-left font-mono">
                    <p>Fecha de emisión: {new Date().toISOString().split('T')[0]}</p>
                    <p className="font-bold mt-0.5">Código: EDM-2026-DIP-8F4K2A</p>
                  </div>

                  <div className="flex gap-6">
                    {modeloParaPrevisualizar.firmas.map((f, i) => (
                      <div key={i} className="text-center">
                        <div className="w-20 border-b border-black/30 dark:border-white/30 mb-1"></div>
                        <span className="text-[8px] block font-bold">{f}</span>
                        <span className="text-[7px] opacity-70">EDUMIN LMS</span>
                      </div>
                    ))}
                  </div>

                  {modeloParaPrevisualizar.incluyeQr && (
                    <div className="flex flex-col items-center p-1 bg-white text-slate-900 rounded-lg border border-slate-200 shadow-sm">
                      <QrCode className="w-7 h-7" />
                      <span className="text-[7px] font-mono mt-0.5 font-bold">VÁLIDO</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                {modeloParaPrevisualizar.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' ? 'Superplantilla global' : 'Asignación específica'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const m = modeloParaPrevisualizar;
                    setModeloParaPrevisualizar(null);
                    cargarModeloEnEditor(m);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar este modelo</span>
                </button>
                <button
                  onClick={() => setModeloParaPrevisualizar(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: VISTA PREVIA Y DUPLICADO A4 DE CERTIFICADO EMITIDO */}
      {certificadoParaVer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-8">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vista previa del certificado A4 • Duplicado oficial
                </h3>
              </div>
              <button 
                onClick={() => setCertificadoParaVer(null)} 
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificado Canvas A4 Simulado */}
            <div className="p-6 bg-slate-950 flex items-center justify-center">
              <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/60 border-8 border-amber-600/40 p-8 rounded-2xl w-full text-center shadow-2xl relative text-slate-900">
                
                {/* Logo y Encabezado */}
                <div className="flex justify-between items-center border-b border-amber-300/60 pb-3 mb-4">
                  <div className="text-left">
                    <span className="text-[9px] font-mono font-bold text-amber-800 tracking-widest block">ESCUELA DE POSTGRADO & MINERÍA</span>
                    <h4 className="text-xs font-black text-slate-900">INSTITUTO INTERNACIONAL EDUMIN</h4>
                  </div>
                  <div className="size-8 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center text-amber-700 font-black text-xs">
                    EM
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700">
                  {certificadoParaVer.tipo === 'DIPLOMA' ? 'DIPLOMA DE ALTA ESPECIALIZACIÓN' : certificadoParaVer.tipo === 'MODULAR' ? 'CERTIFICADO MODULAR OFICIAL' : 'CERTIFICADO DE ESPECIALIZACIÓN'}
                </span>

                <p className="text-[11px] text-slate-500 mt-2">Otorgado con distinción a:</p>
                
                <h3 className="text-xl font-extrabold font-serif text-indigo-950 my-2 underline decoration-amber-500 underline-offset-4">
                  {certificadoParaVer.estudiante}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">DNI / CE: {certificadoParaVer.dni}</p>

                <p className="text-xs text-slate-700 mt-3 px-4 leading-relaxed">
                  Por haber cursado y aprobado satisfactoriamente los requisitos académicos del programa de:
                </p>
                <p className="text-sm font-black text-slate-900 mt-1 uppercase px-4">
                  {certificadoParaVer.modulo ? `${certificadoParaVer.modulo} • ${certificadoParaVer.programa}` : certificadoParaVer.programa}
                </p>

                <div className="my-4 flex items-center justify-center gap-4 text-xs font-bold text-slate-700">
                  <span className="bg-amber-100/80 text-amber-900 px-3 py-1 rounded-lg border border-amber-300">
                    ⏱️ {certificadoParaVer.horas}
                  </span>
                  <span className="bg-indigo-100/80 text-indigo-900 px-3 py-1 rounded-lg border border-indigo-300">
                    🏆 Calificación: {certificadoParaVer.nota}
                  </span>
                </div>

                {/* Footer del Certificado con QR y Firmas */}
                <div className="mt-6 pt-4 border-t border-amber-200 flex justify-between items-end text-[9px] text-slate-600">
                  <div className="text-left">
                    <p className="font-mono">Fecha de emisión: {certificadoParaVer.fecha}</p>
                    <p className="font-mono font-bold text-indigo-900 mt-0.5">Código: {certificadoParaVer.codigo}</p>
                  </div>

                  {/* Firmas Simuladas */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="w-20 border-b border-slate-400 mb-1"></div>
                      <span className="text-[8px] block font-bold text-slate-700">Director Académico</span>
                      <span className="text-[7px] text-slate-400">EDUMIN LMS</span>
                    </div>
                  </div>

                  {/* Código QR */}
                  <div className="flex flex-col items-center p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <QrCode className="w-7 h-7 text-slate-900" />
                    <span className="text-[7px] font-mono mt-0.5 font-bold">VÁLIDO</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copiarEnlaceVerificacion(certificadoParaVer.codigo)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {copiadoLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoLink ? '¡Enlace copiado!' : 'Copiar enlace de validación'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
                <button
                  onClick={() => setCertificadoParaVer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: ASIGNAR / VALIDAR SOLICITUD PENDIENTE CIP */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Validar y adjuntar certificación</h3>
              <button onClick={() => setSolicitudSeleccionada(null)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={aprobarCertificadoCip} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Estudiante solicitante:</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                  {solicitudSeleccionada.estudiante} <span className="text-indigo-600 dark:text-indigo-400 font-mono">({solicitudSeleccionada.dni})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Código de validación QR
                </label>
                <input 
                  type="text" 
                  value={codigoQrGen}
                  onChange={(e) => setCodigoQrGen(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjuntar archivo PDF validado
                </label>
                <input 
                  type="file" 
                  accept=".pdf"
                  required
                  onChange={(e) => e.target.files && setArchivoPdf(e.target.files[0])}
                  className="w-full text-xs text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setSolicitudSeleccionada(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  Emitir y notificar al alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REGISTRAR CERTIFICACIÓN EXTERNA DIRECTA (NUEVA FUNCIÓN) */}
      {mostrarModalRegistroExterno && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 my-8">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar certificación externa directa
                </h3>
              </div>
              <button 
                onClick={() => setMostrarModalRegistroExterno(false)} 
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={registrarCertificacionExternaDirecta} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    DNI / Carné de extranjería *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. 74589210"
                    value={nuevoExternoDni}
                    onChange={(e) => setNuevoExternoDni(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre completo del estudiante *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Ing. Carlos Mendoza"
                    value={nuevoExternoEstudiante}
                    onChange={(e) => setNuevoExternoEstudiante(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Institución emisora / Convenio oficial *
                </label>
                <select
                  value={nuevoExternoInstitucion}
                  onChange={(e) => setNuevoExternoInstitucion(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Colegio de Ingenieros del Perú (CIP)">Colegio de Ingenieros del Perú (CIP Nacional)</option>
                  <option value="University of Miami (Internacional)">University of Miami (Certificación Internacional)</option>
                  <option value="Colegio de Arquitectos del Perú (CAP)">Colegio de Arquitectos del Perú (CAP)</option>
                  <option value="Convenio Interinstitucional Minero">Convenio Interinstitucional Minero Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Programa o diplomado acreditado *
                </label>
                <select
                  value={nuevoExternoPrograma}
                  onChange={(e) => setNuevoExternoPrograma(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Selecciona el programa académico...</option>
                  {catalogoDiplomados.map(d => (
                    <option key={d.id} value={d.titulo}>{d.titulo}</option>
                  ))}
                  {catalogoCursos.map(c => (
                    <option key={c.id} value={c.titulo}>{c.titulo}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Horas cronológicas
                  </label>
                  <input 
                    type="text" 
                    value={nuevoExternoHoras}
                    onChange={(e) => setNuevoExternoHoras(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Código de validación
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                    Auto: EDM-2026-EXT-...
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjuntar documento PDF oficial de la institución *
                </label>
                <input 
                  type="file" 
                  accept=".pdf"
                  required
                  onChange={(e) => e.target.files && setNuevoExternoArchivo(e.target.files[0])}
                  className="w-full text-xs text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox"
                    checked={nuevoExternoNotificar}
                    onChange={(e) => setNuevoExternoNotificar(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 size-4"
                  />
                  <span>Enviar notificación automática por correo al estudiante con enlace de descarga</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setMostrarModalRegistroExterno(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Registrar y habilitar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
