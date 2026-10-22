'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Award, CheckCircle2, QrCode, FileText, Download, Layers, 
  UserCheck, Server, X, Plus, Eye, EyeOff, Send, RefreshCw, Search, Filter,
  Check, Copy, Sparkles, GraduationCap, AlertTriangle, Printer, Share2,
  Edit3, Trash2, LayoutTemplate, Palette, BookmarkCheck, Upload, Image as ImageIcon,
  ArrowLeft, FileCheck, Building2, Bell, Loader2,
  Sliders, Move, AlignCenter, AlignLeft, AlignRight, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Shuffle, Type, Bold, Italic, Underline
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import AvanzaCertificateRenderer, { 
  DisenoCoordenadas, 
  PosicionElemento, 
  ElementoAlineacion, 
  DISENO_DEFAULT_HORIZONTAL, 
  DISENO_DEFAULT_VERTICAL,
  FUENTES_CERTIFICADO,
  TipoFuenteCertificado,
  FormatoFechaCertificado,
  formatearFechaSegunEstilo
} from '@/components/certificates/AvanzaCertificateRenderer';
import { descargarCertificadoA4Pdf, optimizarImagenFondo } from '@/lib/utils/certificatePdf';

export interface ModeloCertificado {
  id: string;
  nombre: string;
  tipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER';
  tituloCertificado?: string;
  textoOtorgamiento?: string;
  estiloMarco?: 'dorado' | 'azul' | 'esmeralda' | 'granate' | 'tecnologico';
  orientacion: 'horizontal' | 'vertical';
  horas?: string;
  firmas?: string[];
  incluyeQr: boolean;
  esPredeterminado: boolean;
  fechaCreacion: string;
  imagenFondoUrl?: string | null;
  asignacionAlcance: 'SUPERPLANTILLA_GLOBAL' | 'PRODUCTO_ESPECIFICO';
  recursoAsignadoNombre?: string;
  recursoAsignadoId?: string;
  disenoCoordenadas?: DisenoCoordenadas;
}


// Control numérico compacto con flechitas para subir/bajar (0.1 en 0.1 cm, 1 en 1 pt) o edición directa
function ControlPasoNumero({
  valor,
  alCambiar,
  min,
  max,
  paso = 0.1,
  unidad = 'cm',
  precision = 1,
  ancho = 'w-14'
}: {
  valor: number;
  alCambiar: (nuevo: number) => void;
  min?: number;
  max?: number;
  paso?: number;
  unidad?: string;
  precision?: number;
  ancho?: string;
}) {
  const decrementar = () => {
    let nuevo = Number((valor - paso).toFixed(precision));
    if (min !== undefined && nuevo < min) nuevo = min;
    alCambiar(nuevo);
  };
  const incrementar = () => {
    let nuevo = Number((valor + paso).toFixed(precision));
    if (max !== undefined && nuevo > max) nuevo = max;
    alCambiar(nuevo);
  };

  return (
    <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
      <button
        type="button"
        onClick={decrementar}
        className="px-2 py-1.5 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none font-bold active:scale-95"
        title="Disminuir valor"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center px-1">
        <input
          type="number"
          value={Number(valor.toFixed(precision))}
          step={paso}
          min={min}
          max={max}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              let v = Number(val.toFixed(precision));
              if (min !== undefined && v < min) v = min;
              if (max !== undefined && v > max) v = max;
              alCambiar(v);
            }
          }}
          className={`${ancho} text-center text-xs font-bold bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {unidad && <span className="text-[10px] font-semibold text-slate-500 select-none mr-1">{unidad}</span>}
      </div>
      <button
        type="button"
        onClick={incrementar}
        className="px-2 py-1.5 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer select-none font-bold active:scale-95"
        title="Aumentar valor"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
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

  // Modal para cambiar modelo y editar horas a un certificado ya emitido
  const [certificadoParaCambiarModelo, setCertificadoParaCambiarModelo] = useState<any | null>(null);
  const [modeloSeleccionadoParaCert, setModeloSeleccionadoParaCert] = useState<string>('mod-avanza-mod');
  const [horasParaEditarCert, setHorasParaEditarCert] = useState<string>('');
  const [fechaParaEditarCert, setFechaParaEditarCert] = useState<string>('');

  // Estados para Habilitar y Emitir Certificado Manualmente a un Estudiante (sin examen requerido)
  const [mostrarModalHabilitarManual, setMostrarModalHabilitarManual] = useState(false);
  const [listaEstudiantesPlataforma, setListaEstudiantesPlataforma] = useState<any[]>([]);
  const [estudianteManualSeleccionado, setEstudianteManualSeleccionado] = useState<string>('');
  const [nombreManualInput, setNombreManualInput] = useState('');
  const [dniManualInput, setDniManualInput] = useState('');
  const [tipoManual, setTipoManual] = useState<'DIPLOMA' | 'MODULAR' | 'CURSO' | 'TALLER' | 'CIP' | 'MIAMI'>('DIPLOMA');
  const [programaManual, setProgramaManual] = useState('');
  const [moduloManual, setModuloManual] = useState('');
  const [modeloManualId, setModeloManualId] = useState('');
  const [horasManual, setHorasManual] = useState('325 horas académicas y 13 créditos académicos');
  const [notaManual, setNotaManual] = useState('18');
  const [fechaManual, setFechaManual] = useState(new Date().toISOString().split('T')[0]);
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [filtroEstudianteManual, setFiltroEstudianteManual] = useState('');



  // Estados para Emisión Masiva
  const [diplomadoEmisionMasiva, setDiplomadoEmisionMasiva] = useState<string>('');
  const [moduloEmisionMasiva, setModuloEmisionMasiva] = useState<string>('all');
  const [modeloEmisionMasiva, setModeloEmisionMasiva] = useState<string>('mod-avanza-dip');

  // Modal de previsualización dinámica para modelos de certificados
  const [modeloParaPrevisualizar, setModeloParaPrevisualizar] = useState<ModeloCertificado | null>(null);
  const [programaSimuladoEnModal, setProgramaSimuladoEnModal] = useState<string>('DERECHO MINERO');

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
      id: 'mod-avanza-dip',
      nombre: 'Superplantilla Oficial Avanza & EDUMIN - Diploma de Alta Especialización',
      tipo: 'DIPLOMA',
      orientacion: 'horizontal',
      horas: '325 horas académicas y 13 créditos académicos',
      firmas: ['Italo Carrera Yepez (Gerente General)', 'Alejandra Alva Porto (Coordinadora Académica)'],
      incluyeQr: true,
      esPredeterminado: true,
      fechaCreacion: '2026-10-15',
      imagenFondoUrl: '/assets/certificates/plantilla_avanza_diploma_bg.png',
      asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
      recursoAsignadoNombre: 'Todos los diplomados oficiales Avanza - EDUMIN'
    },
    {
      id: 'mod-avanza-mod',
      nombre: 'Superplantilla Oficial Avanza & EDUMIN - Certificado Modular',
      tipo: 'MODULAR',
      orientacion: 'horizontal',
      horas: '108 horas académicas',
      firmas: ['Italo Carrera Yepez (Gerente General)', 'Alejandra Alva Porto (Coordinadora Académica)'],
      incluyeQr: true,
      esPredeterminado: true,
      fechaCreacion: '2026-10-15',
      imagenFondoUrl: '/assets/certificates/plantilla_avanza_modular_bg.png',
      asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
      recursoAsignadoNombre: 'Todos los módulos de diplomados Avanza - EDUMIN'
    }
  ]);

  // Estado del editor de certificados (se inicia limpio o con la plantilla elegida)
  const [editorNombre, setEditorNombre] = useState('Nuevo modelo de certificado A4');
  const [editorTipo, setEditorTipo] = useState<'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER'>('DIPLOMA');
  const [editorOrientacion, setEditorOrientacion] = useState<'horizontal' | 'vertical'>('horizontal');
  const [editorFirmas, setEditorFirmas] = useState<string[]>(['Director Académico', 'Coordinador General']);
  const [editorIncluyeQr, setEditorIncluyeQr] = useState(true);
  const [editorImagenFondo, setEditorImagenFondo] = useState<string | null>(null);
  const [editorAlcance, setEditorAlcance] = useState<'SUPERPLANTILLA_GLOBAL' | 'PRODUCTO_ESPECIFICO'>('SUPERPLANTILLA_GLOBAL');
  const [editorRecursoEspecifico, setEditorRecursoEspecifico] = useState<string>('');
  const [modeloSeleccionadoId, setModeloSeleccionadoId] = useState<string | null>(null);
  const [subiendoFondo, setSubiendoFondo] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [limpiandoStorage, setLimpiandoStorage] = useState(false);
  const [resultadoLimpieza, setResultadoLimpieza] = useState<{ eliminados: number; liberadosKb: number; message: string } | null>(null);
  const [archivoFondoPendiente, setArchivoFondoPendiente] = useState<File | null>(null);

  // Estados para simulación interactiva manual y en tiempo real sobre el lienzo
  const [nombreSimuladoPrueba, setNombreSimuladoPrueba] = useState('Quispe Ramos, Juan Carlos');
  const [programaSimuladoPrueba, setProgramaSimuladoPrueba] = useState('');
  const [moduloSimuladoPrueba, setModuloSimuladoPrueba] = useState('Módulo 01: Legislación Minera y Marco Legal del Sector');
  const [estadoSnapshotInicial, setEstadoSnapshotInicial] = useState<string>('');

  // Sistema de coordenadas y posicionamiento milimétrico A4
  const [editorDisenoCoordenadas, setEditorDisenoCoordenadas] = useState<DisenoCoordenadas>(DISENO_DEFAULT_HORIZONTAL);
  const [elementoSeleccionado, setElementoSeleccionado] = useState<keyof DisenoCoordenadas>('estudiante');

  // Medidas físicas de la hoja A4 (Landscape: 29.7 x 21.0 cm | Portrait: 21.0 x 29.7 cm)
  const anchoHojaCm = editorOrientacion === 'vertical' ? 21.0 : 29.7;
  const altoHojaCm = editorOrientacion === 'vertical' ? 29.7 : 21.0;

  const pctToCmX = (pct: number) => Number(((pct / 100) * anchoHojaCm).toFixed(1));
  const cmToPctX = (cm: number) => Number(Math.max(0, Math.min(100, (cm / anchoHojaCm) * 100)).toFixed(1));
  const pctToCmY = (pct: number) => Number(((pct / 100) * altoHojaCm).toFixed(1));
  const cmToPctY = (cm: number) => Number(Math.max(0, Math.min(100, (cm / altoHojaCm) * 100)).toFixed(1));

  const getAnchoCm = (el: PosicionElemento, defecto: number = 25.0) => {
    if (el.anchoMaximoCm) return el.anchoMaximoCm;
    if (el.anchoMaximo) return Number(((el.anchoMaximo / 100) * anchoHojaCm).toFixed(1));
    return defecto;
  };

  const actualizarPosicionElemento = (
    campo: keyof DisenoCoordenadas,
    cambios: Partial<PosicionElemento>
  ) => {
    setEditorDisenoCoordenadas(prev => ({
      ...prev,
      [campo]: {
        ...prev[campo],
        ...cambios
      }
    }));
  };

  const ajustarCoordenadaDelta = (
    campo: keyof DisenoCoordenadas,
    deltaX: number,
    deltaY: number
  ) => {
    setEditorDisenoCoordenadas(prev => {
      const act = prev[campo];
      const nuevoX = Math.max(0, Math.min(100, Math.round((act.x + deltaX) * 10) / 10));
      const nuevoY = Math.max(0, Math.min(100, Math.round((act.y + deltaY) * 10) / 10));
      return {
        ...prev,
        [campo]: {
          ...act,
          x: nuevoX,
          y: nuevoY
        }
      };
    });
  };

  const restablecerDisenoPorDefecto = () => {
    if (confirm('¿Restablecer las coordenadas de todos los elementos a sus posiciones estándar?')) {
      setEditorDisenoCoordenadas(
        editorOrientacion === 'vertical' ? { ...DISENO_DEFAULT_VERTICAL } : { ...DISENO_DEFAULT_HORIZONTAL }
      );
    }
  };

  const handleLimpiarStorageHuerfanos = async () => {
    if (!confirm('¿Deseas analizar y limpiar imágenes huérfanas de Supabase Storage?\n\nSolo se eliminarán imágenes que nunca se guardaron en ningún modelo ni se emitieron a ningún estudiante. Las imágenes activas y de certificados emitidos están 100% protegidas y nunca se tocarán.')) {
      return;
    }

    setLimpiandoStorage(true);
    try {
      const res = await fetch('/api/admin/certificaciones/storage-clean', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResultadoLimpieza(data);
        setMensajeExito(data.message || `Limpieza completada: ${data.eliminados} archivos eliminados.`);
        setTimeout(() => setMensajeExito(null), 6000);
      } else {
        alert(data.error || 'Error al ejecutar limpieza de almacenamiento.');
      }
    } catch (err: any) {
      console.error('Error limpiando storage:', err);
      alert('Error al conectar con el servidor.');
    } finally {
      setLimpiandoStorage(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
    if (typeof window !== 'undefined') {
      try {
        const guardados = localStorage.getItem('edumin_modelos_certificados_v2');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModelosCertificados(parsed);
          }
        }
      } catch (e) {
        console.error('Error recuperando modelos de localStorage:', e);
      }
    }
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
        const dips = dataCat.diplomados || [];
        setCatalogoDiplomados(dips);
        setCatalogoCursos(dataCat.cursosEspecializacion || []);
        setCatalogoTalleres(dataCat.talleres || []);
        if (dips.length > 0) {
          setDiplomadoEmisionMasiva(dips[0].titulo || dips[0].nombre);
        }
      }

      // Cargar estudiantes registrados para selector de emisión manual
      try {
        const resEst = await fetch('/api/admin/estudiantes');
        if (resEst.ok) {
          const dataEst = await resEst.json();
          if (Array.isArray(dataEst.estudiantes)) {
            setListaEstudiantesPlataforma(dataEst.estudiantes);
          }
        }
      } catch (errEst) {
        console.warn('Error cargando estudiantes para emision manual:', errEst);
      }

      // 3. Cargar modelos de certificados guardados permanentemente en Supabase
      try {
        const resModelos = await fetch('/api/admin/certificaciones/modelos');
        if (resModelos.ok) {
          const dataModelos = await resModelos.json();
          if (Array.isArray(dataModelos.modelos) && dataModelos.modelos.length > 0) {
            setModelosCertificados(dataModelos.modelos);
            if (typeof window !== 'undefined') {
              localStorage.setItem('edumin_modelos_certificados_v2', JSON.stringify(dataModelos.modelos));
            }
          }
        }
      } catch (errM) {
        console.warn('Error cargando modelos desde Supabase:', errM);
      }
    } catch (e) {
      console.error('Error cargando datos de certificaciones y catálogo:', e);
    } finally {
      setCargando(false);
    }
  };


  const abrirModalHabilitarManual = () => {
    setEstudianteManualSeleccionado('');
    setNombreManualInput('');
    setDniManualInput('');
    setTipoManual('DIPLOMA');
    const progInicial = catalogoDiplomados[0]?.titulo || 'DIPLOMADO DE ALTA ESPECIALIZACIÓN';
    setProgramaManual(progInicial);
    setModuloManual('');
    const modeloDefault = modelosCertificados.find(m => m.tipo === 'DIPLOMA' && m.esPredeterminado) || modelosCertificados[0];
    setModeloManualId(modeloDefault?.id || 'mod-avanza-dip');
    setHorasManual('325 horas académicas y 13 créditos académicos');
    setNotaManual('18');
    setFechaManual(new Date().toISOString().split('T')[0]);
    setFiltroEstudianteManual('');
    setMostrarModalHabilitarManual(true);
  };

  const handleCambioTipoManual = (nuevoTipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'TALLER' | 'CIP' | 'MIAMI') => {
    setTipoManual(nuevoTipo);
    if (nuevoTipo === 'DIPLOMA' || nuevoTipo === 'CIP' || nuevoTipo === 'MIAMI') {
      const prog = catalogoDiplomados[0]?.titulo || 'DIPLOMADO';
      setProgramaManual(prog);
      setModuloManual('');
      setHorasManual('325 horas académicas y 13 créditos académicos');
      const mod = modelosCertificados.find(m => m.tipo === nuevoTipo && m.esPredeterminado) || modelosCertificados.find(m => m.tipo === nuevoTipo) || modelosCertificados[0];
      if (mod) setModeloManualId(mod.id);
    } else if (nuevoTipo === 'MODULAR') {
      const prog = catalogoDiplomados[0]?.titulo || 'DIPLOMADO';
      setProgramaManual(prog);
      const primerDip = catalogoDiplomados.find(d => (d.titulo || d.nombre) === prog) || catalogoDiplomados[0];
      const modNombre = primerDip?.modulos?.[0]?.nombre || primerDip?.modulos?.[0]?.titulo || 'Módulo 01: Marco Legal y Fundamentos';
      setModuloManual(modNombre);
      setHorasManual('108 horas académicas');
      const mod = modelosCertificados.find(m => m.tipo === 'MODULAR' && m.esPredeterminado) || modelosCertificados.find(m => m.tipo === 'MODULAR') || modelosCertificados[0];
      if (mod) setModeloManualId(mod.id);
    } else if (nuevoTipo === 'CURSO') {
      const prog = catalogoCursos[0]?.titulo || 'CURSO DE ESPECIALIZACIÓN';
      setProgramaManual(prog);
      setModuloManual('');
      setHorasManual('24 horas cronológicas');
      const mod = modelosCertificados.find(m => m.tipo === 'CURSO') || modelosCertificados[0];
      if (mod) setModeloManualId(mod.id);
    } else if (nuevoTipo === 'TALLER') {
      const prog = catalogoTalleres[0]?.titulo || 'TALLER ESPECIALIZADO';
      setProgramaManual(prog);
      setModuloManual('');
      setHorasManual('16 horas cronológicas');
      const mod = modelosCertificados.find(m => m.tipo === 'TALLER') || modelosCertificados[0];
      if (mod) setModeloManualId(mod.id);
    }
  };

  const handleSeleccionarEstudianteManual = (dni: string) => {
    setEstudianteManualSeleccionado(dni);
    const est = listaEstudiantesPlataforma.find(e => e.dni_ce === dni);
    if (est) {
      setNombreManualInput(est.nombre || `${est.nombres || ''} ${est.apellidos || ''}`.trim());
      setDniManualInput(est.dni_ce || dni);
    }
  };

  const guardarEmisionManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreManualInput.trim() || !dniManualInput.trim() || !programaManual.trim()) {
      alert('Por favor completa el nombre del estudiante, DNI y programa académico.');
      return;
    }

    setGuardandoManual(true);
    const modeloElegido = modelosCertificados.find(m => m.id === modeloManualId) || modelosCertificados[0];

    try {
      const res = await fetch('/api/admin/certificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'EMITIR_MANUAL',
          estudiante: nombreManualInput.trim().toUpperCase(),
          dni: dniManualInput.trim(),
          programa: programaManual.trim(),
          modulo: tipoManual === 'MODULAR' ? moduloManual.trim() : null,
          tipo: tipoManual,
          horas: horasManual.trim(),
          nota: Number(notaManual) || 18,
          fecha: fechaManual,
          modelo_id: modeloElegido.id,
          habilitado: true,
          plantilla_snapshot: {
            ...modeloElegido,
            horas: horasManual.trim()
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.certificado) {
          setCertificadosEmitidos(prev => [data.certificado, ...prev]);
        }
        setMensajeExito(data.message || '¡Certificado habilitado y emitido con éxito!');
        setMostrarModalHabilitarManual(false);
        setTimeout(() => setMensajeExito(null), 5000);
      } else {
        alert(data.error || 'Error al emitir el certificado.');
      }
    } catch (err: any) {
      alert('Error de conexión al emitir certificado: ' + err.message);
    } finally {
      setGuardandoManual(false);
    }
  };

  const sincronizarModelosEnSupabase = async (lista: ModeloCertificado[]) => {
    try {
      await fetch('/api/admin/certificaciones/modelos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelos: lista })
      });
    } catch (e) {
      console.warn('Error sincronizando modelos con Supabase:', e);
    }
  };

  const guardarCambioModelo = async () => {
    if (!certificadoParaCambiarModelo) return;
    const modeloElegido = modelosCertificados.find(m => m.id === modeloSeleccionadoParaCert) || modelosCertificados[0];

    try {
      await fetch('/api/admin/certificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: certificadoParaCambiarModelo.id,
          codigo: certificadoParaCambiarModelo.codigo,
          modelo_id: modeloElegido.id,
          horas: horasParaEditarCert || certificadoParaCambiarModelo.horas,
          fecha: fechaParaEditarCert || certificadoParaCambiarModelo.fecha,
          dni: certificadoParaCambiarModelo.dni,
          estudiante: certificadoParaCambiarModelo.estudiante,
          programa: certificadoParaCambiarModelo.programa,
          modulo: certificadoParaCambiarModelo.modulo,
          tipo: certificadoParaCambiarModelo.tipo,
          nota: certificadoParaCambiarModelo.nota,
          plantilla_snapshot: {
            ...modeloElegido,
            horas: horasParaEditarCert || certificadoParaCambiarModelo.horas
          }
        })
      });
    } catch (e) {
      console.error('Error al actualizar certificación en Supabase:', e);
    }

    setCertificadosEmitidos(prev => prev.map(c => {
      if (c.id === certificadoParaCambiarModelo.id || c.codigo === certificadoParaCambiarModelo.codigo) {
        return {
          ...c,
          modelo_id: modeloElegido.id,
          horas: horasParaEditarCert || c.horas,
          fecha: fechaParaEditarCert || c.fecha,
          plantilla_snapshot: modeloElegido
        };
      }
      return c;
    }));

    setMensajeExito(`¡Certificado actualizado con éxito! Se aplicó el modelo "${modeloElegido.nombre}" y horas "${horasParaEditarCert || certificadoParaCambiarModelo.horas}".`);
    setCertificadoParaCambiarModelo(null);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const ejecutarEmisionMasiva = () => {
    const modeloElegido = modelosCertificados.find(m => m.id === modeloEmisionMasiva) || modelosCertificados[0];
    setMensajeExito(`¡Emisión masiva completada! Se procesaron y validaron los certificados para los alumnos con nota >= 12 en "${diplomadoEmisionMasiva || 'Diplomado'}" aplicando la plantilla "${modeloElegido.nombre}".`);
    setTimeout(() => setMensajeExito(null), 5000);
  };

  // Manejar cambio de filtro de tipo en emitidos para resetear programa
  const handleCambioFiltroTipo = (nuevoTipo: string) => {
    setFiltroTipo(nuevoTipo);
    setFiltroPrograma('todos');
  };

  // Obtener lista dinámica de programas válidos según el tipo seleccionado
  const obtenerProgramasSegunTipo = () => {
    if (filtroTipo === 'DIPLOMA' || filtroTipo === 'MODULAR' || filtroTipo === 'CIP' || filtroTipo === 'MIAMI') {
      return catalogoDiplomados.length > 0 
        ? catalogoDiplomados.map(d => d.titulo) 
        : Array.from(new Set(certificadosEmitidos.filter(c => c.tipo === 'DIPLOMA' || c.tipo === 'MODULAR' || c.tipo === 'CIP' || c.tipo === 'MIAMI').map(c => c.programa)));
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

  const serializarEstadoEditor = (
    nombre: string,
    tipo: string,
    orientacion: string,
    firmas: string[],
    incluyeQr: boolean,
    imagenFondo: string | null,
    alcance: string,
    recurso: string,
    diseno: DisenoCoordenadas
  ) => {
    return JSON.stringify({
      nombre: nombre.trim(),
      tipo,
      orientacion,
      firmas,
      incluyeQr,
      imagenFondo,
      alcance,
      recurso: recurso.trim(),
      diseno
    });
  };

  const hayCambiosSinGuardar = () => {
    if (activeTab !== 'editor') return false;
    if (archivoFondoPendiente !== null) return true;
    if (!estadoSnapshotInicial) return false;
    const estadoActual = serializarEstadoEditor(
      editorNombre,
      editorTipo,
      editorOrientacion,
      editorFirmas,
      editorIncluyeQr,
      editorImagenFondo,
      editorAlcance,
      editorRecursoEspecifico,
      editorDisenoCoordenadas
    );
    return estadoActual !== estadoSnapshotInicial;
  };

  // Protección contra pérdida de cambios al cerrar pestaña o recargar el navegador (solo si hay cambios reales)
  useEffect(() => {
    if (activeTab !== 'editor') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hayCambiosSinGuardar()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    activeTab,
    editorNombre,
    editorTipo,
    editorOrientacion,
    editorFirmas,
    editorIncluyeQr,
    editorImagenFondo,
    archivoFondoPendiente,
    editorAlcance,
    editorRecursoEspecifico,
    editorDisenoCoordenadas,
    estadoSnapshotInicial
  ]);

  // Interceptar navegación por enlaces externos o del panel izquierdo/sidebar si hay cambios sin guardar
  useEffect(() => {
    if (activeTab !== 'editor') return;

    const handleCapturingClick = (e: MouseEvent) => {
      if (!hayCambiosSinGuardar()) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      const confirmar = window.confirm('¿Deseas salir del editor de modelo? Los cambios no guardados se descartarán.');
      if (!confirmar) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    document.addEventListener('click', handleCapturingClick, true);
    return () => {
      document.removeEventListener('click', handleCapturingClick, true);
    };
  }, [
    activeTab,
    editorNombre,
    editorTipo,
    editorOrientacion,
    editorFirmas,
    editorIncluyeQr,
    editorImagenFondo,
    archivoFondoPendiente,
    editorAlcance,
    editorRecursoEspecifico,
    editorDisenoCoordenadas,
    estadoSnapshotInicial
  ]);

  const salirDelEditorConConfirmacion = (accion: () => void) => {
    if (hayCambiosSinGuardar()) {
      if (window.confirm('¿Deseas salir del editor de modelo? Los cambios no guardados se descartarán.')) {
        accion();
      }
    } else {
      accion();
    }
  };

  // Cargar modelo seleccionado al editor visual
  const cargarModeloEnEditor = (modelo: ModeloCertificado) => {
    if (activeTab === 'editor' && modeloSeleccionadoId !== modelo.id && hayCambiosSinGuardar()) {
      if (!window.confirm('¿Deseas descartar los cambios actuales para abrir y editar este otro modelo?')) {
        return;
      }
    }
    const coordsFinales = modelo.disenoCoordenadas || (modelo.orientacion === 'vertical' ? { ...DISENO_DEFAULT_VERTICAL } : { ...DISENO_DEFAULT_HORIZONTAL });
    setModeloSeleccionadoId(modelo.id);
    setEditorNombre(modelo.nombre);
    setEditorTipo(modelo.tipo);
    setEditorOrientacion(modelo.orientacion || 'horizontal');
    setEditorFirmas(modelo.firmas || ['Director Académico', 'Coordinador General']);
    setEditorIncluyeQr(modelo.incluyeQr !== false);
    setEditorImagenFondo(modelo.imagenFondoUrl || null);
    setArchivoFondoPendiente(null);
    setEditorAlcance(modelo.asignacionAlcance);
    setEditorRecursoEspecifico(modelo.recursoAsignadoNombre || '');
    setEditorDisenoCoordenadas(coordsFinales);
    setElementoSeleccionado('estudiante');
    setEstadoSnapshotInicial(serializarEstadoEditor(
      modelo.nombre,
      modelo.tipo,
      modelo.orientacion || 'horizontal',
      modelo.firmas || ['Director Académico', 'Coordinador General'],
      modelo.incluyeQr !== false,
      modelo.imagenFondoUrl || null,
      modelo.asignacionAlcance,
      modelo.recursoAsignadoNombre || '',
      coordsFinales
    ));
    setActiveTab('editor');
  };



  const iniciarNuevoModelo = () => {
    if (activeTab === 'editor' && hayCambiosSinGuardar()) {
      if (!window.confirm('¿Deseas descartar la edición actual para iniciar un nuevo modelo en blanco?')) {
        return;
      }
    }
    const nombreNuevo = `Nuevo modelo A4 #${modelosCertificados.length + 1}`;
    // Inicia desde cero con todas las variables apagadas (visible: false)
    const coordsVacias: DisenoCoordenadas = {
      estudiante: { ...DISENO_DEFAULT_HORIZONTAL.estudiante, visible: false },
      programa: { ...DISENO_DEFAULT_HORIZONTAL.programa, visible: false },
      horas: { ...DISENO_DEFAULT_HORIZONTAL.horas, visible: false },
      fecha: { ...DISENO_DEFAULT_HORIZONTAL.fecha, visible: false },
      codigo: { ...DISENO_DEFAULT_HORIZONTAL.codigo, visible: false },
      qr: { ...DISENO_DEFAULT_HORIZONTAL.qr, visible: false }
    };

    setModeloSeleccionadoId(null);
    setEditorNombre(nombreNuevo);
    setEditorTipo('DIPLOMA');
    setEditorOrientacion('horizontal');
    setEditorFirmas(['Director Académico']);
    setEditorIncluyeQr(false);
    setEditorImagenFondo(null);
    setArchivoFondoPendiente(null);
    setEditorAlcance('SUPERPLANTILLA_GLOBAL');
    setEditorRecursoEspecifico('');
    setEditorDisenoCoordenadas(coordsVacias);
    setElementoSeleccionado('estudiante');
    setProgramaSimuladoPrueba('');
    setEstadoSnapshotInicial(serializarEstadoEditor(
      nombreNuevo,
      'DIPLOMA',
      'horizontal',
      ['Director Académico'],
      false,
      null,
      'SUPERPLANTILLA_GLOBAL',
      '',
      coordsVacias
    ));
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

  const guardarModeloEnGaleria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorNombre.trim()) return;

    let urlFondoFinal = editorImagenFondo;

    // Si el usuario subió una imagen local para vista previa, optimizarla y subirla AHORA de forma permanente a Supabase
    if (archivoFondoPendiente) {
      setSubiendoFondo(true);
      try {
        const { blob } = await optimizarImagenFondo(archivoFondoPendiente);
        const formData = new FormData();
        formData.append('file', blob, `fondo_${Date.now()}.webp`);
        if (modeloSeleccionadoId) formData.append('modeloId', modeloSeleccionadoId);

        const res = await fetch('/api/admin/certificaciones/upload-fondo', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Error al almacenar el fondo en Supabase Storage.');
        }

        urlFondoFinal = data.url;
        setEditorImagenFondo(urlFondoFinal);
        setArchivoFondoPendiente(null);
      } catch (err: any) {
        console.error('Error al subir imagen de fondo definitiva:', err);
        alert(`No se pudo optimizar y subir el fondo: ${err.message || 'Error de conexión'}`);
        setSubiendoFondo(false);
        return;
      } finally {
        setSubiendoFondo(false);
      }
    }

    const nombreRecursoFinal = editorAlcance === 'SUPERPLANTILLA_GLOBAL' 
      ? (editorTipo === 'DIPLOMA' ? 'Todos los diplomados oficiales (22 diplomados)' :
         editorTipo === 'MODULAR' ? 'Todos los módulos de diplomados' :
         editorTipo === 'CURSO' ? 'Todos los cursos de especialización (76 cursos)' :
         editorTipo === 'TALLER' ? 'Todos los talleres y masterclasses' :
         editorTipo === 'CIP' ? 'Todos los diplomados con Certificado CIP' :
         editorTipo === 'MIAMI' ? 'Todos los diplomados con Certificado Miami' : 'Todos los programas de esta categoría')
      : (editorRecursoEspecifico || 'Programa específico asignado');

    let listaActualizada: ModeloCertificado[] = [];

    if (modeloSeleccionadoId) {
      listaActualizada = modelosCertificados.map(m => m.id === modeloSeleccionadoId ? {
        ...m,
        nombre: editorNombre,
        tipo: editorTipo,
        orientacion: editorOrientacion,
        firmas: editorFirmas,
        incluyeQr: editorIncluyeQr,
        imagenFondoUrl: urlFondoFinal,
        asignacionAlcance: editorAlcance,
        recursoAsignadoNombre: nombreRecursoFinal,
        disenoCoordenadas: editorDisenoCoordenadas
      } : m);
      setMensajeExito(`¡Modelo "${editorNombre}" actualizado con éxito!`);
    } else {
      const nuevoId = `mod-${Date.now().toString().slice(-6)}`;
      const nuevoModelo: ModeloCertificado = {
        id: nuevoId,
        nombre: editorNombre,
        tipo: editorTipo,
        orientacion: editorOrientacion,
        horas: editorTipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos académicos',
        firmas: editorFirmas,
        incluyeQr: editorIncluyeQr,
        imagenFondoUrl: urlFondoFinal,
        asignacionAlcance: editorAlcance,
        recursoAsignadoNombre: nombreRecursoFinal,
        esPredeterminado: editorAlcance === 'SUPERPLANTILLA_GLOBAL',
        fechaCreacion: new Date().toISOString().split('T')[0],
        disenoCoordenadas: editorDisenoCoordenadas
      };
      listaActualizada = [nuevoModelo, ...modelosCertificados];
      setModeloSeleccionadoId(nuevoId);
      setMensajeExito(`¡Nuevo modelo guardado y asignado a: ${nombreRecursoFinal}!`);
    }

    setModelosCertificados(listaActualizada);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('edumin_modelos_certificados_v2', JSON.stringify(listaActualizada));
      } catch (e) {
        console.warn('Error guardando en localStorage:', e);
      }
    }
    sincronizarModelosEnSupabase(listaActualizada);

    setActiveTab('modelos');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const establecerComoPredeterminado = (modelo: ModeloCertificado) => {
    const listaActualizada = modelosCertificados.map(m => {
      if (m.tipo === modelo.tipo) {
        return {
          ...m,
          esPredeterminado: m.id === modelo.id
        };
      }
      return m;
    });
    setModelosCertificados(listaActualizada);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('edumin_modelos_certificados_v2', JSON.stringify(listaActualizada));
      } catch (e) {}
    }
    sincronizarModelosEnSupabase(listaActualizada);
    setMensajeExito(`¡El modelo "${modelo.nombre}" ahora es el Oficial Predeterminado para ${modelo.tipo}!`);
    setTimeout(() => setMensajeExito(null), 3500);
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
    const listaActualizada = [clon, ...modelosCertificados];
    setModelosCertificados(listaActualizada);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('edumin_modelos_certificados_v2', JSON.stringify(listaActualizada));
      } catch (e) {}
    }
    sincronizarModelosEnSupabase(listaActualizada);
    setMensajeExito(`¡Modelo duplicado como "${clon.nombre}"!`);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const eliminarModelo = (id: string) => {
    const modeloAEliminar = modelosCertificados.find(m => m.id === id);
    if (modeloAEliminar?.esPredeterminado) {
      alert('Esta plantilla está configurada como la oficial activa para emitir certificados automáticos. Si deseas eliminarla, primero marca otra plantilla como oficial activa con el botón "Hacer Oficial".');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este modelo de certificado de la galería?\n\nNOTA DE SEGURIDAD: Los certificados que ya fueron emitidos anteriormente con este diseño NO se verán afectados ni darán error, ya que su diseño fue sellado de forma permanente e inmutable al momento de emitirse.')) {
      const listaActualizada = modelosCertificados.filter(m => m.id !== id);
      setModelosCertificados(listaActualizada);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('edumin_modelos_certificados_v2', JSON.stringify(listaActualizada));
        } catch (e) {}
      }
      sincronizarModelosEnSupabase(listaActualizada);
      setMensajeExito('Modelo eliminado de la galería.');
      setTimeout(() => setMensajeExito(null), 3000);
    }
  };

  const handleSubirImagenFondo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG o WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('La imagen original excede los 20MB. Selecciona una imagen más liviana.');
      return;
    }

    // Carga de vista previa instantánea local sin demoras de subida ni saturar Storage con pruebas
    const previewUrl = URL.createObjectURL(file);
    setEditorImagenFondo(previewUrl);
    setArchivoFondoPendiente(file);
    setMensajeExito('Fondo cargado en vista previa inmediata. Se optimizará y guardará en Supabase al guardar el modelo.');
    setTimeout(() => setMensajeExito(null), 4500);
    e.target.value = '';
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

      {/* Contenido principal con Header Superior Institucional */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <AdminHeader breadcrumb="Certificaciones y Convenios" />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Centro de certificaciones y modelos A4
              </h1>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={abrirModalHabilitarManual}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Habilitar certificado a estudiante</span>
                    </button>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                      {certificadosFiltrados.length} certificados encontrados
                    </span>
                  </div>
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
                      <option value="DIPLOMA">Diploma general</option>
                      <option value="MODULAR">Certificado modular</option>
                      <option value="CURSO">Curso</option>
                      <option value="TALLER">Taller</option>
                      <option value="CIP">Certificado CIP</option>
                      <option value="MIAMI">Certificado Miami</option>
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
                              <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
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
                                {cert.tipo === 'CIP' && (
                                  <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-rose-200 dark:border-rose-800">
                                    Certificado CIP
                                  </span>
                                )}
                                {cert.tipo === 'MIAMI' && (
                                  <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-indigo-200 dark:border-indigo-800">
                                    Certificado Miami
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

                            {/* Código de validación (texto limpio sin badge ni bordes) */}
                            <td className="py-3.5 px-4 tabular-nums">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {cert.codigo}
                              </span>
                            </td>

                            {/* Calificación (solo número como texto limpio sin icono) */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {cert.nota}
                              </span>
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
                                  onClick={() => {
                                    setCertificadoParaCambiarModelo(cert);
                                    setModeloSeleccionadoParaCert(cert.modelo_id || (cert.tipo === 'MODULAR' ? 'mod-avanza-mod' : 'mod-avanza-dip'));
                                    setHorasParaEditarCert(cert.horas || (cert.tipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos académicos'));
                                    setFechaParaEditarCert(cert.fecha || '');
                                  }}
                                  className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-xl transition cursor-pointer"
                                  title="Editar modelo asignado y horas académicas"
                                >
                                  <LayoutTemplate className="w-4 h-4" />
                                </button>

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
              
              {/* Notificación tras depuración segura de storage */}
              {resultadoLimpieza && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">{resultadoLimpieza.message}</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                        Espacio liberado: {Math.round(resultadoLimpieza.liberadosKb)} KB • Los fondos de certificados emitidos y modelos en galería se preservan intactos.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setResultadoLimpieza(null)} 
                    className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Encabezado limpio sin filtros con acción de mantenimiento de almacenamiento */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Modelos de certificados y plantillas A4</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Superplantillas maestras y plantillas asignadas a programas específicos.</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleLimpiarStorageHuerfanos}
                    disabled={limpiandoStorage}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    title="Analiza y elimina imágenes huérfanas en Supabase Storage que nunca fueron emitidas ni guardadas en modelos"
                  >
                    {limpiandoStorage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Trash2 className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{limpiandoStorage ? 'Depurando Storage...' : 'Limpiar fondos huérfanos'}</span>
                  </button>

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
                    {/* Miniatura A4 del Modelo (refleja fielmente el diseño, fondo y coordenadas modificadas) */}
                    <div className="p-4 bg-slate-950 flex items-center justify-center relative min-h-[195px] overflow-hidden">
                      <div 
                        className={`relative shadow-xl pointer-events-none select-none transition-transform duration-300 ${
                          modelo.orientacion === 'vertical' ? 'w-[145px]' : 'w-[230px]'
                        }`}
                      >
                        <AvanzaCertificateRenderer
                          tipo={modelo.tipo}
                          orientacion={modelo.orientacion || 'horizontal'}
                          estudiante="QUISPE RAMOS, JUAN CARLOS"
                          programa={
                            modelo.recursoAsignadoNombre && modelo.asignacionAlcance === 'PRODUCTO_ESPECIFICO'
                              ? modelo.recursoAsignadoNombre
                              : (modelo.tipo === 'CURSO' 
                                  ? (catalogoCursos[0]?.titulo || 'GESTIÓN DE SEGURIDAD MINERA')
                                  : (catalogoDiplomados[0]?.titulo || 'SEGURIDAD Y SALUD OCUPACIONAL EN MINERÍA'))
                          }
                          modulo={modelo.tipo === 'MODULAR' ? 'Módulo 01: Legislación Minera y Marco Legal' : undefined}
                          horas={modelo.horas || (modelo.tipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos')}
                          codigo="EDM-2026-A4"
                          fecha="2026-10-20"
                          imagenFondoUrl={modelo.imagenFondoUrl}
                          incluyeQr={modelo.incluyeQr !== false}
                          diseno={modelo.disenoCoordenadas}
                          modoArrastrable={false}
                          className="rounded-lg border border-slate-700/80 shadow-md"
                        />
                      </div>

                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 flex-wrap justify-end">
                        
                        {modelo.esPredeterminado ? (
                          <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-200" /> Oficial Activo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => establecerComoPredeterminado(modelo)}
                            className="bg-slate-900/90 hover:bg-emerald-600 text-slate-300 hover:text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow transition cursor-pointer flex items-center gap-1 border border-slate-700"
                            title="Establecer como la plantilla oficial activa para certificados automáticos"
                          >
                            <Check className="w-3 h-3" /> Hacer Oficial
                          </button>
                        )}
                        {modelo.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' ? (
                          <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-300" /> Superplantilla
                          </span>
                        ) : (
                          <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow">
                            Específico
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información y Asignación del Modelo */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {modelo.tipo === 'DIPLOMA' ? 'Diploma general' :
                             modelo.tipo === 'MODULAR' ? 'Certificado modular' :
                             modelo.tipo === 'CURSO' ? 'Curso' :
                             modelo.tipo === 'TALLER' ? 'Taller' :
                             modelo.tipo === 'CIP' ? 'Certificado CIP' :
                             modelo.tipo === 'MIAMI' ? 'Certificado Miami' : modelo.tipo}
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

                      {/* Pie del card: exclusivamente los botones de acción sin horas ni créditos */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5 text-xs w-full">
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
                ))}
              </div>
            </div>
          )}

          {/* TAB DE EDICIÓN VISUAL (CANVAS A4 CON FONDO, ORIENTACIÓN Y ASIGNACIÓN) */}
          {activeTab === 'editor' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => salirDelEditorConConfirmacion(() => setActiveTab('modelos'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer shrink-0"
                    title="Volver a la galería de modelos"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {modeloSeleccionadoId ? `Editando: ${editorNombre}` : 'Diseñar nuevo modelo de certificado A4'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
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
                        onClick={() => {
                          setEditorOrientacion('horizontal');
                          setEditorDisenoCoordenadas({ ...DISENO_DEFAULT_HORIZONTAL });
                        }}
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
                        onClick={() => {
                          setEditorOrientacion('vertical');
                          setEditorDisenoCoordenadas({ ...DISENO_DEFAULT_VERTICAL });
                        }}
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

                  {/* Tipo de certificado */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Tipo de certificado
                    </label>
                    <select 
                      value={editorTipo}
                      onChange={(e) => {
                        const nuevoTipo = e.target.value as any;
                        setEditorTipo(nuevoTipo);
                        setProgramaSimuladoPrueba('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="DIPLOMA">Diploma general</option>
                      <option value="MODULAR">Certificado modular</option>
                      <option value="CURSO">Curso</option>
                      <option value="TALLER">Taller</option>
                      <option value="CIP">Certificado CIP</option>
                      <option value="MIAMI">Certificado Miami</option>
                    </select>
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

                  {/* Carga de imagen de fondo */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Imagen de fondo
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-dashed rounded-xl text-xs font-bold transition ${
                        subiendoFondo 
                          ? 'opacity-60 cursor-wait border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600'
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-slate-700 dark:text-slate-300 cursor-pointer'
                      }`}>
                        {subiendoFondo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span>Optimizando y guardando imagen en Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{editorImagenFondo ? 'Cambiar plantilla membretada A4' : 'Seleccionar plantilla A4 de tu computadora'}</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/png,image/jpeg,image/webp" 
                          disabled={subiendoFondo}
                          onChange={handleSubirImagenFondo} 
                          className="hidden" 
                        />
                      </label>

                      {editorImagenFondo && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditorImagenFondo(null);
                            setArchivoFondoPendiente(null);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition text-xs font-bold border border-red-200 dark:border-red-900/60 cursor-pointer"
                          title="Volver a lienzo en blanco"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Panel de Posicionamiento y formato de variables */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Posicionamiento y formato de variables
                      </label>
                      <button
                        type="button"
                        onClick={restablecerDisenoPorDefecto}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
                        title="Restablecer posiciones originales"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restablecer</span>
                      </button>
                    </div>

                    {/* Selector de variable activa: todo el chip es clickeable para seleccionar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      {[
                        { key: 'estudiante', label: 'Estudiante' },
                        { key: 'programa', label: 'Programa' },
                        { key: 'horas', label: 'Horas / Créd.' },
                        { key: 'fecha', label: 'Fecha' },
                        { key: 'codigo', label: 'Código' },
                        { key: 'qr', label: 'Código QR' }
                      ].map((item) => {
                        const estaVisible = editorDisenoCoordenadas[item.key as keyof DisenoCoordenadas]?.visible !== false;
                        const esSeleccionado = elementoSeleccionado === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => setElementoSeleccionado(item.key as keyof DisenoCoordenadas)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                              esSeleccionado
                                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                            }`}
                            title={`Seleccionar ${item.label} para editar`}
                          >
                            <span className="truncate flex-1">
                              {item.label}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nuevoEstado = !estaVisible;
                                actualizarPosicionElemento(item.key as keyof DisenoCoordenadas, { visible: nuevoEstado });
                                if (item.key === 'qr') setEditorIncluyeQr(nuevoEstado);
                              }}
                              className={`p-1 rounded-md transition cursor-pointer shrink-0 ml-1 ${
                                esSeleccionado 
                                  ? (estaVisible ? 'text-white hover:bg-indigo-700' : 'text-indigo-200 hover:bg-indigo-700 opacity-60')
                                  : (estaVisible ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 opacity-50')
                              }`}
                              title={estaVisible ? 'Visible en este certificado (clic para ocultar)' : 'Oculto (clic para activar)'}
                            >
                              {estaVisible ? <Eye className="w-3.5 h-3.5 text-white" /> : <EyeOff className={`w-3.5 h-3.5 ${esSeleccionado ? 'text-white/60' : ''}`} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Controles para la variable seleccionada */}
                    {(() => {
                      const act = editorDisenoCoordenadas[elementoSeleccionado];
                      return (
                        <div className="space-y-3 pt-1">

                          {/* Coordenadas en Centímetros (cm) limpias con control de paso 0.1 cm y presets esenciales */}
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Eje X */}
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                  Posición X (horizontal):
                                </span>
                                <ControlPasoNumero
                                  valor={pctToCmX(act.x)}
                                  min={0}
                                  max={anchoHojaCm}
                                  paso={0.1}
                                  unidad="cm"
                                  precision={1}
                                  ancho="w-14"
                                  alCambiar={(nuevoCm) => actualizarPosicionElemento(elementoSeleccionado, { x: cmToPctX(nuevoCm) })}
                                />
                              </div>

                              {/* Eje Y */}
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                  Posición Y (vertical):
                                </span>
                                <ControlPasoNumero
                                  valor={pctToCmY(act.y)}
                                  min={0}
                                  max={altoHojaCm}
                                  paso={0.1}
                                  unidad="cm"
                                  precision={1}
                                  ancho="w-14"
                                  alCambiar={(nuevoCm) => actualizarPosicionElemento(elementoSeleccionado, { y: cmToPctY(nuevoCm) })}
                                />
                              </div>
                            </div>

                            {/* Atajos de centrado esenciales */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400">Atajos rápidos:</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => actualizarPosicionElemento(elementoSeleccionado, { x: 50, alineacion: 'center' })}
                                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Centrar horizontalmente"
                                >
                                  Centrar H (50%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => actualizarPosicionElemento(elementoSeleccionado, { y: 50 })}
                                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Centrar verticalmente"
                                >
                                  Centrar V (50%)
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Alineación de texto / bloque */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Alineación respecto al punto de anclaje:
                            </label>
                            <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => actualizarPosicionElemento(elementoSeleccionado, { alineacion: 'left' })}
                                className={`py-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                                  act.alineacion === 'left' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <AlignLeft className="w-3 h-3" /> Izquierda
                              </button>
                              <button
                                type="button"
                                onClick={() => actualizarPosicionElemento(elementoSeleccionado, { alineacion: 'center' })}
                                className={`py-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                                  act.alineacion === 'center' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <AlignCenter className="w-3 h-3" /> Centro
                              </button>
                              <button
                                type="button"
                                onClick={() => actualizarPosicionElemento(elementoSeleccionado, { alineacion: 'right' })}
                                className={`py-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                                  act.alineacion === 'right' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <AlignRight className="w-3 h-3" /> Derecha
                              </button>
                            </div>
                          </div>

                          {/* Configuración Tipográfica y Visual (solo para variables de texto) */}
                          {elementoSeleccionado !== 'qr' && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                              {/* Fuente */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                  <Type className="w-3 h-3 text-indigo-500" /> Fuente tipográfica:
                                </label>
                                <select
                                  value={act.fuente || (elementoSeleccionado === 'estudiante' ? 'serif-institucional' : elementoSeleccionado === 'programa' ? 'sans-moderna' : 'sans-formal')}
                                  onChange={(e) => actualizarPosicionElemento(elementoSeleccionado, { fuente: e.target.value as TipoFuenteCertificado })}
                                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                >
                                  {FUENTES_CERTIFICADO.map(f => (
                                    <option key={f.id} value={f.id} style={{ fontFamily: f.fontFamily }}>{f.nombre}</option>
                                  ))}
                                </select>
                                <div className="mt-1 flex items-center justify-between px-2 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-100 dark:border-slate-700/60 text-[11px]">
                                  <span className="text-[10px] text-slate-400 font-medium">Muestra en vivo:</span>
                                  <span 
                                    style={{ fontFamily: FUENTES_CERTIFICADO.find(f => f.id === (act.fuente || (elementoSeleccionado === 'estudiante' ? 'serif-institucional' : elementoSeleccionado === 'programa' ? 'sans-moderna' : 'sans-formal')))?.fontFamily }}
                                    className="font-bold text-slate-900 dark:text-white"
                                  >
                                    Tipografía Oficial (Aa Bb Gg 123)
                                  </span>
                                </div>
                              </div>

                              {/* Tamaño de fuente compacto (de 1 en 1 pt con flechitas o entrada directa) */}
                              <div className="flex items-center justify-between py-0.5">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  Tamaño del texto:
                                </span>
                                <ControlPasoNumero
                                  valor={act.tamanoFuente || (elementoSeleccionado === 'estudiante' ? 36 : elementoSeleccionado === 'programa' ? 22 : 12)}
                                  min={6}
                                  max={72}
                                  paso={1}
                                  unidad="pt"
                                  precision={0}
                                  ancho="w-12"
                                  alCambiar={(nuevoPt) => actualizarPosicionElemento(elementoSeleccionado, { tamanoFuente: nuevoPt })}
                                />
                              </div>

                              {/* Estilo tipográfico: Negrita, Cursiva, Subrayado */}
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 mr-1">Estilo:</span>
                                <button
                                  type="button"
                                  onClick={() => actualizarPosicionElemento(elementoSeleccionado, { negrita: act.negrita !== undefined ? !act.negrita : false })}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    act.negrita !== false
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Negrita"
                                >
                                  <Bold className="w-3 h-3" />
                                  <span className="text-[10px]">Negrita</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => actualizarPosicionElemento(elementoSeleccionado, { cursiva: !act.cursiva })}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    act.cursiva
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Cursiva"
                                >
                                  <Italic className="w-3 h-3" />
                                  <span className="text-[10px]">Cursiva</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => actualizarPosicionElemento(elementoSeleccionado, { subrayado: !act.subrayado })}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    act.subrayado
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Subrayado"
                                >
                                  <Underline className="w-3 h-3" />
                                  <span className="text-[10px]">Subrayado</span>
                                </button>
                              </div>

                              {/* Color del texto limpio */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  <Palette className="w-3 h-3 text-indigo-500" /> Color del texto:
                                </span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={act.color && act.color.startsWith('#') && act.color.length === 7 ? act.color : '#000000'}
                                    onChange={(e) => actualizarPosicionElemento(elementoSeleccionado, { color: e.target.value })}
                                    className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent shrink-0"
                                    title="Elegir color"
                                  />
                                  <input
                                    type="text"
                                    value={act.color || '#000000'}
                                    onChange={(e) => actualizarPosicionElemento(elementoSeleccionado, { color: e.target.value })}
                                    placeholder="#000000"
                                    maxLength={7}
                                    className="w-20 px-2 py-1 text-xs font-bold text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 uppercase"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Configuración especial: Ancho delimitado en CM, Formato de Nombre y 1 sola línea para Estudiante */}
                          {elementoSeleccionado === 'estudiante' && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  Ancho físico máximo (1 sola línea):
                                </span>
                                <ControlPasoNumero
                                  valor={getAnchoCm(act, 25.0)}
                                  min={5.0}
                                  max={anchoHojaCm}
                                  paso={0.1}
                                  unidad="cm"
                                  precision={1}
                                  ancho="w-14"
                                  alCambiar={(cmVal) => {
                                    actualizarPosicionElemento('estudiante', { 
                                      anchoMaximoCm: cmVal,
                                      anchoMaximo: Number(((cmVal / anchoHojaCm) * 100).toFixed(1))
                                    });
                                  }}
                                />
                              </div>

                              {/* Selector de formato de nombre */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                  Formato de presentación del nombre:
                                </label>
                                <select
                                  value={act.formatoNombre || 'apellidos-nombres'}
                                  onChange={(e) => actualizarPosicionElemento('estudiante', { formatoNombre: e.target.value as any })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                >
                                  <option value="apellidos-nombres">Apellidos, Nombres (Ej: Quispe Ramos, Juan Carlos)</option>
                                  <option value="nombres-apellidos">Nombres y Apellidos (Ej: Juan Carlos Quispe Ramos)</option>
                                  <option value="mayusculas">MAYÚSCULAS COMPLETAS (Ej: QUISPE RAMOS, JUAN CARLOS)</option>
                                </select>
                              </div>

                              <p className="text-[10px] text-slate-400 leading-tight">
                                Si el nombre es muy largo, el sistema ajustará automáticamente el tamaño de fuente para encajar con nitidez en el ancho delimitado sin desbordar.
                              </p>
                            </div>
                          )}

                          {/* Configuración especial: Ancho en CM, Interlineado y Balance conector "Y" para Programa */}
                          {elementoSeleccionado === 'programa' && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  Ancho físico del título (Máx. 2 líneas):
                                </span>
                                <ControlPasoNumero
                                  valor={getAnchoCm(act, 25.5)}
                                  min={5.0}
                                  max={anchoHojaCm}
                                  paso={0.1}
                                  unidad="cm"
                                  precision={1}
                                  ancho="w-14"
                                  alCambiar={(cmVal) => {
                                    actualizarPosicionElemento('programa', { 
                                      anchoMaximoCm: cmVal,
                                      anchoMaximo: Number(((cmVal / anchoHojaCm) * 100).toFixed(1))
                                    });
                                  }}
                                />
                              </div>

                              {/* Selector de Interlineado / Line Height */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  Interlineado (entre filas):
                                </span>
                                <ControlPasoNumero
                                  valor={act.interlineado || 1.25}
                                  min={0.8}
                                  max={2.5}
                                  paso={0.05}
                                  unidad="x"
                                  precision={2}
                                  ancho="w-14"
                                  alCambiar={(val) => actualizarPosicionElemento('programa', { interlineado: val })}
                                />
                              </div>

                              <p className="text-[10px] text-slate-400 leading-tight">
                                Limita a 2 líneas con balance visual y mantiene la conjunción &quot;Y&quot; unida a la palabra anterior para evitar quiebres huérfanos.
                              </p>
                            </div>
                          )}

                          {/* Configuración especial: Horas / Créditos (juntas, solo horas, solo créditos o personalizada) */}
                          {elementoSeleccionado === 'horas' && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Modalidad de acreditación:
                                </label>
                                <select
                                  value={act.modoHorasCreditos || 'horas-y-creditos'}
                                  onChange={(e) => actualizarPosicionElemento('horas', { modoHorasCreditos: e.target.value as any })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                >
                                  <option value="horas-y-creditos">Horas y Créditos (Ambos juntos)</option>
                                  <option value="solo-horas">Solo Horas académicas</option>
                                  <option value="solo-creditos">Solo Créditos académicos</option>
                                  <option value="personalizado">Texto libre personalizado</option>
                                </select>
                              </div>

                              {(act.modoHorasCreditos === 'horas-y-creditos' || act.modoHorasCreditos === 'solo-horas' || !act.modoHorasCreditos) && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Texto de horas:
                                  </label>
                                  <input
                                    type="text"
                                    value={act.horasValor !== undefined ? act.horasValor : (editorTipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas')}
                                    onChange={(e) => actualizarPosicionElemento('horas', { horasValor: e.target.value })}
                                    placeholder="Ej: 325 horas académicas o 120 horas cronológicas"
                                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                  />
                                </div>
                              )}

                              {(act.modoHorasCreditos === 'horas-y-creditos' || act.modoHorasCreditos === 'solo-creditos' || !act.modoHorasCreditos) && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Texto de créditos:
                                  </label>
                                  <input
                                    type="text"
                                    value={act.creditosValor !== undefined ? act.creditosValor : '13 créditos académicos'}
                                    onChange={(e) => actualizarPosicionElemento('horas', { creditosValor: e.target.value })}
                                    placeholder="Ej: 13 créditos académicos"
                                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                  />
                                </div>
                              )}

                              {act.modoHorasCreditos === 'personalizado' && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Frase completa personalizada:
                                  </label>
                                  <input
                                    type="text"
                                    value={act.textoHorasPersonalizado || ''}
                                    onChange={(e) => actualizarPosicionElemento('horas', { textoHorasPersonalizado: e.target.value })}
                                    placeholder="Ej: con un total de 200 horas cronológicas aprobadas"
                                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                  />
                                </div>
                              )}

                              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  Ancho de caja de texto:
                                </span>
                                <ControlPasoNumero
                                  valor={getAnchoCm(act, 25.0)}
                                  min={5.0}
                                  max={anchoHojaCm}
                                  paso={0.1}
                                  unidad="cm"
                                  precision={1}
                                  ancho="w-14"
                                  alCambiar={(cmVal) => {
                                    actualizarPosicionElemento('horas', { 
                                      anchoMaximoCm: cmVal,
                                      anchoMaximo: Number(((cmVal / anchoHojaCm) * 100).toFixed(1))
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Configuración especial: Fecha con Prefijo y Selector de Formato */}
                          {elementoSeleccionado === 'fecha' && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Prefijo o texto antes de la fecha:
                                </label>
                                <input
                                  type="text"
                                  value={act.textoPrefijo !== undefined ? act.textoPrefijo : 'Fecha de emisión: '}
                                  onChange={(e) => actualizarPosicionElemento('fecha', { textoPrefijo: e.target.value })}
                                  placeholder='Ej: "Fecha de emisión: ", "Arequipa, ", o vacío'
                                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Formato de la fecha:
                                </label>
                                <select
                                  value={act.formatoFecha || 'larga'}
                                  onChange={(e) => actualizarPosicionElemento('fecha', { formatoFecha: e.target.value as FormatoFechaCertificado })}
                                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                >
                                  <option value="larga">Completa (Ej: 20 de octubre de 2026)</option>
                                  <option value="corta">Corta Numérica (Ej: 20/10/2026)</option>
                                  <option value="mes-ano">Solo Mes y Año (Ej: Octubre de 2026)</option>
                                </select>
                              </div>

                              <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-100 dark:border-slate-700/60">
                                <span className="text-[10px] text-slate-400 block font-bold mb-0.5">Resultado en el certificado:</span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  &quot;{act.textoPrefijo !== undefined ? act.textoPrefijo : 'Fecha de emisión: '}{formatearFechaSegunEstilo(new Date().toISOString(), act.formatoFecha || 'larga')}&quot;
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Configuración especial: Código alfanumérico limpio */}
                          {elementoSeleccionado === 'codigo' && (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                  Prefijo o texto antes del código:
                                </label>
                                <input
                                  type="text"
                                  value={act.textoPrefijo !== undefined ? act.textoPrefijo : 'CÓD.: '}
                                  onChange={(e) => actualizarPosicionElemento('codigo', { textoPrefijo: e.target.value })}
                                  placeholder='Ej: "CÓD.: ", "REGISTRO N° ", o vacío'
                                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                                />
                              </div>

                              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-300 leading-snug">
                                <span className="font-bold block">✓ Texto puro y sin duplicados:</span>
                                Se imprime como texto limpio sin cuadros de fondo. Los códigos se generan con algoritmo Crockford Base32 (34 mil millones de variantes) con índice UNIQUE garantizado en base de datos.
                              </div>
                            </div>
                          )}

                          {/* Si es QR, control de tamaño en CM y relación 1:1 estricta */}
                          {elementoSeleccionado === 'qr' && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  Tamaño del Código QR (1:1):
                                </span>
                                <ControlPasoNumero
                                  valor={act.tamanoCm || (act.tamano ? Number((act.tamano / 28.346).toFixed(1)) : 2.0)}
                                  min={1.0}
                                  max={6.0}
                                  paso={0.1}
                                  unidad="cm"
                                  precision={1}
                                  ancho="w-14"
                                  alCambiar={(cm) => {
                                    actualizarPosicionElemento('qr', { 
                                      tamanoCm: cm,
                                      tamano: Math.round(cm * 28.346)
                                    });
                                  }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight">
                                Proporción cuadrada 1:1 exacta sin sombras ni distorsión en el PDF.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => salirDelEditorConConfirmacion(() => setActiveTab('modelos'))}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Descartar cambios
                    </button>
                    <button
                      type="submit"
                      disabled={subiendoFondo}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {subiendoFondo ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkCheck className="w-4 h-4" />}
                      <span>{subiendoFondo ? 'Optimizando y guardando...' : (modeloSeleccionadoId ? 'Guardar cambios' : 'Guardar en galería')}</span>
                    </button>
                  </div>
                </form>

                {/* Columna de Previsualización A4 Fija / Sticky (Permite hacer scroll libre en la configuración) */}
                <div className="lg:col-span-7 lg:sticky lg:top-4 self-start">
                  <div className="bg-slate-950 p-5 sm:p-6 rounded-3xl flex flex-col items-center justify-start border border-slate-800 shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-2">
                    <div>
                      <span className="text-[10px] tabular-nums text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" /> Vista previa lienzo A4 {editorOrientacion === 'vertical' ? 'Vertical (21.0×29.7 cm)' : 'Horizontal (29.7×21.0 cm)'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        ✨ Arrastra cualquier variable directamente sobre el lienzo para ubicarla libremente
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={descargandoPdf}
                      onClick={async () => {
                        try {
                          setDescargandoPdf(true);
                          const esNombreAlcanceGlobal = (nombre?: string) => 
                            !nombre || nombre.startsWith('TODOS LOS') || nombre.startsWith('SUPERPLANTILLA');
                          const programaParaPdf = programaSimuladoPrueba || (
                            !esNombreAlcanceGlobal(editorRecursoEspecifico)
                              ? editorRecursoEspecifico
                              : (editorTipo === 'CURSO' 
                                  ? (catalogoCursos[0]?.titulo || 'GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA')
                                  : editorTipo === 'TALLER'
                                  ? (catalogoTalleres[0]?.titulo || 'PRIMEROS AUXILIOS Y EMERGENCIAS MINERAS')
                                  : (catalogoDiplomados[0]?.titulo || 'SEGURIDAD Y SALUD OCUPACIONAL EN MINERÍA'))
                          );
                          await descargarCertificadoA4Pdf({
                            tipo: editorTipo,
                            orientacion: editorOrientacion,
                            estudiante: nombreSimuladoPrueba || 'Quispe Ramos, Juan Carlos',
                            programa: programaParaPdf,
                            modulo: editorTipo === 'MODULAR' ? moduloSimuladoPrueba : undefined,
                            horas: editorTipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos académicos',
                            fecha: new Date().toISOString().split('T')[0],
                            codigo: 'HNYNXT2',
                            imagenFondoUrl: editorImagenFondo,
                            incluyeQr: editorDisenoCoordenadas.qr.visible,
                            diseno: editorDisenoCoordenadas
                          }, `Modelo_${editorNombre.replace(/[^a-zA-Z0-9_-]/g, '_')}_A4.pdf`);
                        } catch (e) {
                          console.error('Error generando PDF:', e);
                          alert('Error al descargar el PDF de muestra.');
                        } finally {
                          setDescargandoPdf(false);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0 self-start sm:self-auto"
                      title="Descargar este modelo de certificado en PDF A4 exacto"
                    >
                      {descargandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Descargar PDF</span>
                    </button>
                  </div>

                  {/* Barra de Simulación Interactiva (Nombres manuales y Selección de programas reales) */}
                  <div className="w-full mb-4 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                    {/* Simulación manual de nombre */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Type className="w-3 h-3 text-indigo-400" /> Probar nombre de estudiante (Simulación en vivo):
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setNombreSimuladoPrueba('Ana Paz')}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            Corto
                          </button>
                          <button
                            type="button"
                            onClick={() => setNombreSimuladoPrueba('Quispe Ramos, Juan Carlos')}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            Estándar
                          </button>
                          <button
                            type="button"
                            onClick={() => setNombreSimuladoPrueba('De la Flor Montenegro de los Ríos, María de los Ángeles')}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          >
                            Largo (1 línea)
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={nombreSimuladoPrueba}
                        onChange={(e) => setNombreSimuladoPrueba(e.target.value)}
                        placeholder="Escribe cualquier nombre largo o corto para verificar que nunca se corte..."
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Selector interactivo de programas del catálogo filtrado según el tipo de certificado */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-400" /> Probar con {editorTipo === 'CURSO' ? 'curso' : editorTipo === 'TALLER' ? 'taller' : 'diplomado'}:
                      </label>
                      <select
                        value={programaSimuladoPrueba}
                        onChange={(e) => setProgramaSimuladoPrueba(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Usar asignado o predeterminado --</option>
                        
                        {editorTipo === 'CURSO' ? (
                          <>
                            <optgroup label="Cursos de Especialización">
                              {catalogoCursos.map((c: any) => (
                                <option key={c.id || c.titulo} value={c.titulo || c.nombre}>
                                  {c.titulo || c.nombre}
                                </option>
                              ))}
                              {catalogoCursos.length === 0 && (
                                <>
                                  <option value="GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA">
                                    GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA
                                  </option>
                                  <option value="SOFTWARE APLICADO: LEAPFROG GEO Y DATAMINE">
                                    SOFTWARE APLICADO: LEAPFROG GEO Y DATAMINE
                                  </option>
                                  <option value="TOPOGRAFÍA MINERA SUBTERRÁNEA">
                                    TOPOGRAFÍA MINERA SUBTERRÁNEA
                                  </option>
                                </>
                              )}
                            </optgroup>
                          </>
                        ) : editorTipo === 'TALLER' ? (
                          <>
                            <optgroup label="Talleres y Masterclasses">
                              {catalogoTalleres.map((t: any) => (
                                <option key={t.id || t.titulo} value={t.titulo || t.nombre}>
                                  {t.titulo || t.nombre}
                                </option>
                              ))}
                              {catalogoTalleres.length === 0 && (
                                <option value="PRIMEROS AUXILIOS Y EMERGENCIAS MINERAS">
                                  PRIMEROS AUXILIOS Y EMERGENCIAS MINERAS
                                </option>
                              )}
                            </optgroup>
                          </>
                        ) : (
                          <>
                            <optgroup label="Casos especiales de tipografía">
                              <option value="GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA">
                                GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA (Prueba conector &quot;Y&quot;)
                              </option>
                              <option value="SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE EN OPERACIONES MINERAS">
                                SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE EN OPERACIONES MINERAS (Título largo 2 líneas)
                              </option>
                              <option value="DERECHO MINERO">
                                DERECHO MINERO (Título corto)
                              </option>
                            </optgroup>
                            <optgroup label="Diplomados Oficiales">
                              {catalogoDiplomados.map((d: any) => (
                                <option key={d.id || d.titulo} value={d.titulo || d.nombre}>
                                  {d.titulo || d.nombre}
                                </option>
                              ))}
                              {catalogoDiplomados.length === 0 && (
                                <>
                                  <option value="SEGURIDAD Y SALUD OCUPACIONAL EN MINERÍA">
                                    SEGURIDAD Y SALUD OCUPACIONAL EN MINERÍA
                                  </option>
                                  <option value="DERECHO MINERO Y GESTIÓN DE TIERRAS">
                                    DERECHO MINERO Y GESTIÓN DE TIERRAS
                                  </option>
                                </>
                              )}
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Si es modular, input para probar módulo */}
                    {editorTipo === 'MODULAR' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Título del módulo de prueba:
                        </label>
                        <input
                          type="text"
                          value={moduloSimuladoPrueba}
                          onChange={(e) => setModuloSimuladoPrueba(e.target.value)}
                          placeholder="Módulo 01: ..."
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Lienzo del certificado A4 con Drag & Drop interactivo */}
                  {(() => {
                    const esNombreAlcanceGlobal = (nombre?: string) => 
                      !nombre || nombre.startsWith('TODOS LOS') || nombre.startsWith('SUPERPLANTILLA');
                    const programaParaLienzo = programaSimuladoPrueba || (
                      !esNombreAlcanceGlobal(editorRecursoEspecifico)
                        ? editorRecursoEspecifico
                        : (editorTipo === 'CURSO' 
                            ? (catalogoCursos[0]?.titulo || 'GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA')
                            : editorTipo === 'TALLER'
                            ? (catalogoTalleres[0]?.titulo || 'PRIMEROS AUXILIOS Y EMERGENCIAS MINERAS')
                            : (catalogoDiplomados[0]?.titulo || 'SEGURIDAD Y SALUD OCUPACIONAL EN MINERÍA'))
                    );
                    return (
                      <div className={`w-full flex items-center justify-center ${editorOrientacion === 'vertical' ? 'max-w-sm' : 'max-w-xl'}`}>
                        <AvanzaCertificateRenderer
                          tipo={editorTipo}
                          orientacion={editorOrientacion}
                          estudiante={nombreSimuladoPrueba || 'Quispe Ramos, Juan Carlos'}
                          programa={programaParaLienzo}
                          modulo={editorTipo === 'MODULAR' ? moduloSimuladoPrueba : undefined}
                          horas={editorTipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos académicos'}
                          fecha={new Date().toISOString().split('T')[0]}
                          codigo="HNYNXT2"
                          imagenFondoUrl={editorImagenFondo}
                          incluyeQr={editorDisenoCoordenadas.qr.visible}
                          diseno={editorDisenoCoordenadas}
                          elementoActivo={elementoSeleccionado}
                          modoArrastrable={true}
                          onMoverElemento={(campo, x, y) => actualizarPosicionElemento(campo, { x, y })}
                          onSeleccionarElemento={(campo) => setElementoSeleccionado(campo)}
                        />
                      </div>
                    );
                  })()}
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
                          <td className="py-4 px-4 tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{s.dni}</td>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Seleccionar diplomado ({catalogoDiplomados.length})
                  </label>
                  <select 
                    value={diplomadoEmisionMasiva}
                    onChange={(e) => setDiplomadoEmisionMasiva(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                  >
                    {catalogoDiplomados.map((dip, dIdx) => (
                      <option key={dip.id || dIdx} value={dip.titulo || dip.nombre}>
                        {dip.codigo || `DIP-0${dIdx + 1}`}: {dip.titulo || dip.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Alcance de emisión
                  </label>
                  <select 
                    value={moduloEmisionMasiva}
                    onChange={(e) => setModuloEmisionMasiva(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="all">Todos los módulos y diploma general</option>
                    <option value="m1">Módulo 01 (Aprobados nota &gt;= 12)</option>
                    <option value="m2">Módulo 02 (Aprobados nota &gt;= 12)</option>
                    <option value="m3">Módulo 03 (Aprobados nota &gt;= 12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Modelo de certificado a aplicar
                  </label>
                  <select 
                    value={modeloEmisionMasiva}
                    onChange={(e) => setModeloEmisionMasiva(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600"
                  >
                    {modelosCertificados.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.estiloMarco})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-xs text-slate-500 font-medium">
                  Se generarán certificados oficiales para todos los alumnos que tengan calificación aprobatoria (nota &gt;= 12).
                </span>
                <button
                  onClick={ejecutarEmisionMasiva}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Layers className="w-4 h-4" /> Generar diplomas masivos con modelo seleccionado
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>

      {/* MODAL: CAMBIAR MODELO DE CERTIFICADO ASIGNADO */}
      {certificadoParaCambiarModelo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cambiar modelo de certificado asignado
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Estudiante: {certificadoParaCambiarModelo.estudiante} (DNI: {certificadoParaCambiarModelo.dni})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCertificadoParaCambiarModelo(null)} 
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Certificación:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right truncate max-w-[240px]">
                    {certificadoParaCambiarModelo.modulo || certificadoParaCambiarModelo.programa}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Código:</span>
                  <span className="tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{certificadoParaCambiarModelo.codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Calificación:</span>
                  <span className="font-bold text-emerald-600">Nota {certificadoParaCambiarModelo.nota}/20</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Seleccionar nueva plantilla / modelo
                </label>
                <select
                  value={modeloSeleccionadoParaCert}
                  onChange={(e) => setModeloSeleccionadoParaCert(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  {modelosCertificados.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} · Marco {(m.estiloMarco || 'dorado').toUpperCase()} ({m.tipo})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Al cambiar el modelo, el certificado del estudiante se emitirá y visualizará con este nuevo diseño, marco y firmas institucionales.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Horas académicas / lectivas
                </label>
                <input
                  type="text"
                  value={horasParaEditarCert}
                  onChange={(e) => setHorasParaEditarCert(e.target.value)}
                  placeholder="Ej: 108 horas académicas"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Puedes editar la cantidad de horas acreditadas según la normativa académica.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Fecha de emisión
                </label>
                <input
                  type="text"
                  value={fechaParaEditarCert}
                  onChange={(e) => setFechaParaEditarCert(e.target.value)}
                  placeholder="Ej: 15/10/2026"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Fecha que figura impresa en el certificado oficial.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCertificadoParaCambiarModelo(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCambioModelo}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Aplicar Modelo</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                {/* Si el modelo está asignado a un recurso específico, permitir seleccionarlo */}
                {modeloParaPrevisualizar.asignacionAlcance === 'PRODUCTO_ESPECIFICO' && modeloParaPrevisualizar.recursoAsignadoNombre && (
                  <option value={modeloParaPrevisualizar.recursoAsignadoNombre}>
                    {modeloParaPrevisualizar.recursoAsignadoNombre} (Asignado al modelo)
                  </option>
                )}

                {/* Si es certificado para cursos, mostrar ÚNICAMENTE cursos */}
                {modeloParaPrevisualizar.tipo === 'CURSO' ? (
                  <optgroup label="Cursos de especialización">
                    {catalogoCursos.map(c => (
                      <option key={c.id || c.titulo} value={c.titulo}>{c.titulo}</option>
                    ))}
                    {catalogoCursos.length === 0 && (
                      <>
                        <option value="Gestión de trabajo en alto riesgo en minería">Gestión de trabajo en alto riesgo en minería</option>
                        <option value="Software aplicado: Leapfrog Geo y Datamine">Software aplicado: Leapfrog Geo y Datamine</option>
                        <option value="Topografía minera subterránea con escáner láser">Topografía minera subterránea con escáner láser</option>
                      </>
                    )}
                  </optgroup>
                ) : modeloParaPrevisualizar.tipo === 'TALLER' ? (
                  <optgroup label="Talleres y Masterclasses">
                    {catalogoTalleres.map(t => (
                      <option key={t.id || t.titulo} value={t.titulo}>{t.titulo}</option>
                    ))}
                    {catalogoTalleres.length === 0 && (
                      <option value="Primeros auxilios y emergencias mineras">Primeros auxilios y emergencias mineras</option>
                    )}
                  </optgroup>
                ) : (
                  /* Para diplomas generales y modulares, mostrar ÚNICAMENTE diplomados */
                  <optgroup label="Diplomados oficiales">
                    {catalogoDiplomados.map(d => (
                      <option key={d.id || d.titulo} value={d.titulo}>{d.titulo}</option>
                    ))}
                    {catalogoDiplomados.length === 0 && (
                      <>
                        <option value="Seguridad y salud ocupacional en minería">Seguridad y salud ocupacional en minería</option>
                        <option value="Derecho minero y gestión de tierras">Derecho minero y gestión de tierras</option>
                        <option value="Geología minera, yacimientos y exploración">Geología minera, yacimientos y exploración</option>
                      </>
                    )}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Certificado Canvas A4 Simulado */}
            <div className="p-4 sm:p-6 bg-slate-950 flex items-center justify-center">
              <div className={`w-full flex items-center justify-center ${modeloParaPrevisualizar.orientacion === 'vertical' ? 'max-w-sm' : 'max-w-xl'}`}>
                <AvanzaCertificateRenderer
                  tipo={modeloParaPrevisualizar.tipo}
                  orientacion={modeloParaPrevisualizar.orientacion || 'horizontal'}
                  estudiante="QUISPE RAMOS, JUAN CARLOS"
                  programa={programaSimuladoEnModal}
                  modulo={modeloParaPrevisualizar.tipo === 'MODULAR' ? 'Módulo 01: Legislación Minera y Marco Legal del Sector' : undefined}
                  horas={modeloParaPrevisualizar.horas || (modeloParaPrevisualizar.tipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos')}
                  fecha={new Date().toISOString().split('T')[0]}
                  codigo="HNYNXT2"
                  imagenFondoUrl={modeloParaPrevisualizar.imagenFondoUrl}
                  incluyeQr={modeloParaPrevisualizar.incluyeQr !== false}
                  diseno={modeloParaPrevisualizar.disenoCoordenadas}
                />
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 tabular-nums">
                {modeloParaPrevisualizar.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' ? 'Superplantilla global' : 'Asignación específica'} • {modeloParaPrevisualizar.orientacion === 'vertical' ? 'A4 Vertical (Portrait)' : 'A4 Horizontal (Landscape)'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={descargandoPdf}
                  onClick={async () => {
                    try {
                      setDescargandoPdf(true);
                      await descargarCertificadoA4Pdf({
                        tipo: modeloParaPrevisualizar.tipo,
                        orientacion: modeloParaPrevisualizar.orientacion || 'horizontal',
                        estudiante: 'QUISPE RAMOS, JUAN CARLOS',
                        programa: programaSimuladoEnModal,
                        modulo: modeloParaPrevisualizar.tipo === 'MODULAR' ? 'Módulo 01: Legislación Minera y Marco Legal del Sector' : undefined,
                        horas: modeloParaPrevisualizar.horas || (modeloParaPrevisualizar.tipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos académicos'),
                        fecha: new Date().toISOString().split('T')[0],
                        codigo: 'HNYNXT2',
                        imagenFondoUrl: modeloParaPrevisualizar.imagenFondoUrl,
                        incluyeQr: modeloParaPrevisualizar.incluyeQr !== false,
                        diseno: modeloParaPrevisualizar.disenoCoordenadas
                      }, `Modelo_${modeloParaPrevisualizar.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')}_A4.pdf`);
                    } catch (e) {
                      console.error('Error generando PDF de muestra:', e);
                      alert('Error al descargar el PDF de muestra.');
                    } finally {
                      setDescargandoPdf(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Descargar este modelo como documento PDF A4"
                >
                  {descargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Descargar PDF de muestra</span>
                </button>

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

      
      {/* MODAL PARA HABILITAR / EMITIR CERTIFICADO MANUALMENTE A UN ESTUDIANTE */}
      {mostrarModalHabilitarManual && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Habilitar Certificado a Estudiante
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Emite y habilita de forma inmediata el certificado oficial con código de validación QR sin requerir examen previo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalHabilitarManual(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={guardarEmisionManual} className="p-6 space-y-5 text-xs">
              
              {/* Sección 1: Estudiante */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    1. Datos del Estudiante
                  </label>
                  {listaEstudiantesPlataforma.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      {listaEstudiantesPlataforma.length} alumnos registrados
                    </span>
                  )}
                </div>

                {/* Seleccionar alumno registrado existente */}
                {listaEstudiantesPlataforma.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Seleccionar de la lista de estudiantes registrados (o escribir abajo):
                    </label>
                    <select
                      value={estudianteManualSeleccionado}
                      onChange={(e) => handleSeleccionarEstudianteManual(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="">-- Seleccionar un estudiante registrado --</option>
                      {listaEstudiantesPlataforma.map((est) => (
                        <option key={est.id || est.dni_ce} value={est.dni_ce}>
                          {est.nombre || `${est.nombres || ''} ${est.apellidos || ''}`.trim()} — DNI: {est.dni_ce}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Nombre completo del estudiante *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. QUISPE RAMOS, JUAN CARLOS"
                      value={nombreManualInput}
                      onChange={(e) => setNombreManualInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      DNI / Documento de identidad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 74839201"
                      value={dniManualInput}
                      onChange={(e) => setDniManualInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl tabular-nums font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Tipo de Certificado y Programa */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  2. Certificación y Programa Académico
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Tipo de Certificado
                    </label>
                    <select
                      value={tipoManual}
                      onChange={(e) => handleCambioTipoManual(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="DIPLOMA">Diploma general</option>
                      <option value="MODULAR">Certificado modular</option>
                      <option value="CURSO">Curso</option>
                      <option value="TALLER">Taller</option>
                      <option value="CIP">Certificado CIP</option>
                      <option value="MIAMI">Certificado Miami</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Programa Académico *
                    </label>
                    {(tipoManual === 'DIPLOMA' || tipoManual === 'MODULAR' || tipoManual === 'CIP' || tipoManual === 'MIAMI') && catalogoDiplomados.length > 0 ? (
                      <select
                        value={programaManual}
                        onChange={(e) => {
                          const p = e.target.value;
                          setProgramaManual(p);
                          if (tipoManual === 'MODULAR') {
                            const dip = catalogoDiplomados.find(d => (d.titulo || d.nombre) === p);
                            const modNombre = dip?.modulos?.[0]?.nombre || dip?.modulos?.[0]?.titulo || 'Módulo 01: Marco Legal y Fundamentos';
                            setModuloManual(modNombre);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer truncate"
                      >
                        {catalogoDiplomados.map((d, i) => (
                          <option key={d.id || i} value={d.titulo || d.nombre}>
                            {d.titulo || d.nombre}
                          </option>
                        ))}
                      </select>
                    ) : tipoManual === 'CURSO' && catalogoCursos.length > 0 ? (
                      <select
                        value={programaManual}
                        onChange={(e) => setProgramaManual(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer truncate"
                      >
                        {catalogoCursos.map((c, i) => (
                          <option key={c.id || i} value={c.titulo}>
                            {c.titulo}
                          </option>
                        ))}
                      </select>
                    ) : tipoManual === 'TALLER' && catalogoTalleres.length > 0 ? (
                      <select
                        value={programaManual}
                        onChange={(e) => setProgramaManual(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer truncate"
                      >
                        {catalogoTalleres.map((t, i) => (
                          <option key={t.id || i} value={t.titulo}>
                            {t.titulo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Nombre del programa"
                        value={programaManual}
                        onChange={(e) => setProgramaManual(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    )}
                  </div>
                </div>

                {/* Si es modular, seleccionar o ingresar módulo */}
                {tipoManual === 'MODULAR' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Módulo Específico *
                    </label>
                    {(() => {
                      const dipSel = catalogoDiplomados.find(d => (d.titulo || d.nombre) === programaManual);
                      if (dipSel?.modulos && dipSel.modulos.length > 0) {
                        return (
                          <select
                            value={moduloManual}
                            onChange={(e) => setModuloManual(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                          >
                            {dipSel.modulos.map((m: any, idx: number) => {
                              const mNombre = m.nombre || m.titulo || `Módulo 0${idx + 1}`;
                              return (
                                <option key={idx} value={mNombre}>
                                  {mNombre}
                                </option>
                              );
                            })}
                          </select>
                        );
                      }
                      return (
                        <input
                          type="text"
                          required
                          placeholder="Ej. Módulo 01: Marco Legal y Fundamentos"
                          value={moduloManual}
                          onChange={(e) => setModuloManual(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Sección 3: Plantilla, Horas, Nota y Fecha */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
                  3. Modelo de Diseño y Parámetros Oficiales
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Modelo / Plantilla A4
                    </label>
                    <select
                      value={modeloManualId}
                      onChange={(e) => setModeloManualId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer truncate"
                    >
                      {modelosCertificados.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} {m.esPredeterminado ? '★ (Oficial Activa)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Horas Lectivas / Académicas
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 325 horas académicas y 13 créditos"
                      value={horasManual}
                      onChange={(e) => setHorasManual(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Calificación (Nota aprobatoria)
                    </label>
                    <input
                      type="number"
                      min={12}
                      max={20}
                      required
                      value={notaManual}
                      onChange={(e) => setNotaManual(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Fecha de Emisión
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaManual}
                      onChange={(e) => setFechaManual(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Banner de estado habilitado */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold">
                    El certificado se emitirá con <strong>código QR oficial único</strong>, quedará <strong>habilitado para descarga inmediata</strong> y disponible en el validador público.
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalHabilitarManual(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoManual}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {guardandoManual ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Habilitando certificado...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Habilitar y Emitir Certificado
                    </>
                  )}
                </button>
              </div>

            </form>
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
            <div className="p-4 sm:p-6 bg-slate-950 flex items-center justify-center">
              {(() => {
                const snapshot = certificadoParaVer.plantilla_snapshot || {};
                const modeloActual = modelosCertificados.find(m => m.id === (snapshot.modelo_id || certificadoParaVer.modelo_id)) || 
                  (certificadoParaVer.tipo === 'DIPLOMA' ? modelosCertificados.find(m => m.id === 'mod-avanza-dip') : modelosCertificados.find(m => m.id === 'mod-avanza-mod')) || 
                  modelosCertificados[0];

                const orientacionFinal = snapshot.orientacion || modeloActual?.orientacion || 'horizontal';
                const imagenFondoFinal = snapshot.imagenFondoUrl !== undefined ? snapshot.imagenFondoUrl : modeloActual?.imagenFondoUrl;
                const disenoFinal = snapshot.disenoCoordenadas || modeloActual?.disenoCoordenadas;

                return (
                  <div className={`w-full flex items-center justify-center ${orientacionFinal === 'vertical' ? 'max-w-sm' : 'max-w-xl'}`}>
                    <AvanzaCertificateRenderer
                      tipo={certificadoParaVer.tipo}
                      orientacion={orientacionFinal}
                      estudiante={certificadoParaVer.estudiante}
                      programa={certificadoParaVer.programa}
                      modulo={certificadoParaVer.modulo}
                      horas={certificadoParaVer.horas}
                      fecha={certificadoParaVer.fecha}
                      codigo={certificadoParaVer.codigo}
                      imagenFondoUrl={imagenFondoFinal}
                      incluyeQr={true}
                      diseno={disenoFinal}
                    />
                  </div>
                );
              })()}
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
                  type="button"
                  disabled={descargandoPdf}
                  onClick={async () => {
                    try {
                      setDescargandoPdf(true);
                      const snapshot = certificadoParaVer.plantilla_snapshot || {};
                      const modeloActual = modelosCertificados.find(m => m.id === (snapshot.modelo_id || certificadoParaVer.modelo_id)) || modelosCertificados[0];
                      const orientacionFinal = snapshot.orientacion || modeloActual?.orientacion || 'horizontal';
                      const imagenFondoFinal = snapshot.imagenFondoUrl !== undefined ? snapshot.imagenFondoUrl : modeloActual?.imagenFondoUrl;
                      const disenoFinal = snapshot.disenoCoordenadas || modeloActual?.disenoCoordenadas;

                      await descargarCertificadoA4Pdf({
                        tipo: certificadoParaVer.tipo,
                        orientacion: orientacionFinal,
                        estudiante: certificadoParaVer.estudiante,
                        programa: certificadoParaVer.programa,
                        modulo: certificadoParaVer.modulo,
                        horas: certificadoParaVer.horas,
                        fecha: certificadoParaVer.fecha,
                        codigo: certificadoParaVer.codigo,
                        imagenFondoUrl: imagenFondoFinal,
                        incluyeQr: true,
                        diseno: disenoFinal
                      }, `Certificado_${certificadoParaVer.codigo}_${certificadoParaVer.dni}.pdf`);
                    } catch (e) {
                      console.error('Error al descargar PDF:', e);
                      alert('Error generando el archivo PDF.');
                    } finally {
                      setDescargandoPdf(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Descargar duplicado oficial en formato A4 exacto"
                >
                  {descargandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Descargar PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
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
                  {solicitudSeleccionada.estudiante} <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">({solicitudSeleccionada.dni})</span>
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
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs tabular-nums font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
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
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs tabular-nums font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
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
