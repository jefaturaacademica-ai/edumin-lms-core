'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, Search, RefreshCw, Eye, Pencil,
  CheckCircle2, AlertTriangle, UserCheck, GraduationCap, Download,
  UserPlus, Plus, Sparkles, BookOpen, CreditCard, AlertCircle, ArrowRight,
  Check, Mail, Phone, Hash, Coins, Calendar,
  FileSpreadsheet, UploadCloud, FileText, CheckCircle, XCircle, Trash2, Loader2
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useTabSlug } from '@/lib/hooks/useTabSlug';
import AnularPagoModal from '@/components/admin/anular-pago-modal';
import ReciboModal from '@/components/admin/recibo-modal';
import EditarCronogramaModal from '@/components/admin/editar-cronograma-modal';
import Ficha360Modal from '@/components/admin/ficha-360-modal';
import { EstudianteCompleto } from '@/lib/data/mockStudents';
import { PaqueteDefinicion, PAQUETES_DEFAULT } from '@/lib/types/paquetes';
import { getClientCachedData, fetchWithClientCache } from '@/lib/utils/clientCache';
import { LISTA_PAISES, formatearCelularGuardar } from '@/lib/utils/paisesYRegiones';

const DIPLOMADOS_EDUMIN = [
  "DERECHO MINERO",
  "ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA",
  "GEOLOGÍA MINERA",
  "GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL",
  "GEOMETALURGIA",
  "GEOTECNIA MINERA",
  "GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ",
  "GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA",
  "GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL",
  "GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS",
  "GESTIÓN DE OPERACIONES INDUSTRIALES",
  "GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO",
  "GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES",
  "GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA",
  "GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA",
  "GESTIÓN MINERA",
  "LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS",
  "MINERÍA 4.0 Y DIGITALIZACIÓN MINERA",
  "PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA",
  "SEGURIDAD INDUSTRIAL",
  "SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA",
  "SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA"
];

export default function AdminEstudiantesPage() {
  const [activeTab, setActiveTab] = useTabSlug<'directorio' | 'nuevo' | 'masivo'>('directorio', ['directorio', 'nuevo', 'masivo'] as const);
  const [estudiantes, setEstudiantes] = useState<EstudianteCompleto[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos');
  
  // Modal Ficha 360°
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<EstudianteCompleto | null>(null);

  const [catalogoFull, setCatalogoFull] = useState<any[]>([]);

  // Estados Formulario Nuevo Estudiante
  // Estados Carga Masiva Excel
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [filasPrevia, setFilasPrevia] = useState<any[]>([]);
  const [analizandoArchivo, setAnalizandoArchivo] = useState(false);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [resultadoMasivo, setResultadoMasivo] = useState<{
    success: boolean;
    total: number;
    creados: number;
    omitidos: number;
    errores: number;
    mensaje?: string;
    detalles: Array<{ dni_ce: string; nombre: string; estado: 'creado' | 'omitido' | 'error'; mensaje: string }>;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const descargarPlantillaExcel = () => {
    const sampleRows = [
      {
        TIPO_DOC: 'DNI',
        DNI_CE: '71234567',
        NOMBRES: 'Carlos Alberto',
        APELLIDOS: 'Quispe Ramos',
        EMAIL: 'carlos.quispe@gmail.com',
        TELEFONO: '987654321',
        PAQUETE: 'COMPLETO',
        DIPLOMADO_INICIAL: 'DERECHO MINERO',
        TIPO_PAGO: 'CUOTAS',
        TOTAL_CUOTAS: 3,
        MONTO_TOTAL: 540,
        MONTO_CUOTA: 180,
        FECHA_NACIMIENTO: '1996-08-15'
      },
      {
        TIPO_DOC: 'CE',
        DNI_CE: '001234567',
        NOMBRES: 'María Elena',
        APELLIDOS: 'Flores Vargas',
        EMAIL: 'maria.flores@hotmail.com',
        TELEFONO: '912345678',
        PAQUETE: 'FULL',
        DIPLOMADO_INICIAL: 'GESTIÓN DE SEGURIDAD MINERA Y SALUD OCUPACIONAL',
        TIPO_PAGO: 'CUOTAS',
        TOTAL_CUOTAS: 3,
        MONTO_TOTAL: 900,
        MONTO_CUOTA: 300,
        FECHA_NACIMIENTO: '1994-03-22'
      },
      {
        TIPO_DOC: 'PASAPORTE',
        DNI_CE: 'A8492019',
        NOMBRES: 'Jorge Luis',
        APELLIDOS: 'Mendoza Chávez',
        EMAIL: 'jorge.mendoza@outlook.com',
        TELEFONO: '956789123',
        PAQUETE: 'ILIMITADO',
        DIPLOMADO_INICIAL: 'OPERACIONES MINERAS Y SOSTENIMIENTO DE LABORES',
        TIPO_PAGO: 'CONTADO',
        TOTAL_CUOTAS: 1,
        MONTO_TOTAL: 1500,
        MONTO_CUOTA: 1500,
        FECHA_NACIMIENTO: '1992-11-05'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 28 },
      { wch: 15 },
      { wch: 14 },
      { wch: 45 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Estudiantes');
    XLSX.writeFile(workbook, 'Plantilla_Carga_Masiva_Estudiantes_EDUMIN.xlsx');
  };

  const descargarPlantillaCsv = () => {
    const csvContent =
      'TIPO_DOC,DNI_CE,NOMBRES,APELLIDOS,EMAIL,TELEFONO,PAQUETE,DIPLOMADO_INICIAL,TIPO_PAGO,TOTAL_CUOTAS,MONTO_TOTAL,MONTO_CUOTA,FECHA_NACIMIENTO\n' +
      'DNI,71234567,Carlos Alberto,Quispe Ramos,carlos.quispe@gmail.com,987654321,COMPLETO,DERECHO MINERO,CUOTAS,3,540,180,1996-08-15\n' +
      'CE,001234567,María Elena,Flores Vargas,maria.flores@hotmail.com,912345678,FULL,GESTIÓN DE SEGURIDAD MINERA Y SALUD OCUPACIONAL,CUOTAS,3,900,300,1994-03-22\n' +
      'PASAPORTE,A8492019,Jorge Luis,Mendoza Chávez,jorge.mendoza@outlook.com,956789123,ILIMITADO,OPERACIONES MINERAS Y SOSTENIMIENTO DE LABORES,CONTADO,1,1500,1500,1992-11-05';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Carga_Masiva_Estudiantes_EDUMIN.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const procesarArchivoExcel = async (file: File) => {
    try {
      setAnalizandoArchivo(true);
      setResultadoMasivo(null);
      setArchivoExcel(file);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        alert('El archivo cargado está vacío o no contiene filas con datos.');
        setFilasPrevia([]);
        setAnalizandoArchivo(false);
        return;
      }

      const setDnisExistentes = new Set(
        estudiantes.map(e => String(e.dni_ce || '').trim().toLowerCase())
      );
      const setEmailsExistentes = new Set(
        estudiantes.map(e => String(e.email || '').trim().toLowerCase())
      );

      const dnisEnLote = new Set<string>();
      const emailsEnLote = new Set<string>();

      const procesadas = rawRows.map((row, idx) => {
        const dni_ce = String(
          row.DNI_CE || row.DNI || row.dni || row.dni_ce || row['DNI / CE'] || row.DOCUMENTO || row.NUMERO_DOCUMENTO || ''
        ).trim();

        const tipo_documento_raw = String(
          row.TIPO_DOC || row.TIPO_DOCUMENTO || row['TIPO DOC'] || row['TIPO DE DOCUMENTO'] || ''
        ).trim().toUpperCase();

        const tipo_documento = ['DNI', 'CE', 'PASAPORTE', 'OTRO'].includes(tipo_documento_raw)
          ? tipo_documento_raw
          : (dni_ce.length === 8 && /^\d+$/.test(dni_ce) ? 'DNI' : 'OTRO');

        const nombres = String(
          row.NOMBRES || row.NOMBRE || row.nombres || row.nombre || ''
        ).trim();

        const apellidos = String(
          row.APELLIDOS || row.APELLIDO || row.apellidos || row.apellido || ''
        ).trim();

        const email = String(
          row.EMAIL || row.CORREO || row.email || row.correo || row['CORREO ELECTRÓNICO'] || ''
        ).trim().toLowerCase();

        const telefono = String(
          row.TELEFONO || row.CELULAR || row.telefono || row.celular || ''
        ).trim();

        const paquete_adquirido = String(
          row.PAQUETE || row.PAQUETE_ADQUIRIDO || row.paquete || 'COMPLETO'
        ).trim().toUpperCase();

        const diplomado_1 = String(
          row.DIPLOMADO_INICIAL || row.DIPLOMADO || row.diplomado || row.diplomado_1 || 'DERECHO MINERO'
        ).trim().toUpperCase();

        const tipo_pago = String(
          row.TIPO_PAGO || row.FORMA_PAGO || row.tipo_pago || 'CUOTAS'
        ).trim().toUpperCase();

        const cuotas_totales = Number(row.TOTAL_CUOTAS || row.CUOTAS || row.cuotas || (paquete_adquirido === 'ILIMITADO' ? 5 : 3));
        const monto_total = Number(row.MONTO_TOTAL || (paquete_adquirido === 'ILIMITADO' ? 1500 : (paquete_adquirido === 'FULL' ? 900 : 540)));
        const monto_cuota = Number(row.MONTO_CUOTA || (tipo_pago === 'CONTADO' ? monto_total : (paquete_adquirido === 'ILIMITADO' ? 300 : 180)));
        const fecha_nacimiento = String(row.FECHA_NACIMIENTO || row.NACIMIENTO || row.fecha_nacimiento || '').trim();

        let estadoFila: 'listo' | 'duplicado' | 'error' = 'listo';
        let motivo = 'Listo para registrar';

        if (!dni_ce || !nombres || !apellidos || !email) {
          estadoFila = 'error';
          motivo = 'Faltan datos obligatorios (DNI, nombres, apellidos o correo)';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          estadoFila = 'error';
          motivo = 'Formato de correo electrónico inválido';
        } else if (setDnisExistentes.has(dni_ce.toLowerCase()) || setEmailsExistentes.has(email)) {
          estadoFila = 'duplicado';
          motivo = 'Ya registrado previamente en el sistema (se omitirá)';
        } else if (dnisEnLote.has(dni_ce.toLowerCase()) || emailsEnLote.has(email)) {
          estadoFila = 'duplicado';
          motivo = 'Duplicado dentro del mismo archivo (se omitirá)';
        } else {
          dnisEnLote.add(dni_ce.toLowerCase());
          emailsEnLote.add(email);
        }

        return {
          filaNum: idx + 2,
          dni_ce,
          numero_documento: dni_ce,
          tipo_documento,
          nombres,
          apellidos,
          email,
          telefono,
          paquete_adquirido,
          diplomado_1,
          tipo_pago,
          cuotas_totales,
          monto_total,
          monto_cuota,
          fecha_nacimiento,
          estadoFila,
          motivo
        };
      });

      setFilasPrevia(procesadas);
    } catch (err: any) {
      console.error('Error al leer Excel:', err);
      alert(`No se pudo procesar el archivo Excel: ${err.message}`);
      setFilasPrevia([]);
    } finally {
      setAnalizandoArchivo(false);
    }
  };

  const ejecutarRegistroMasivo = async () => {
    const listos = filasPrevia.filter(f => f.estadoFila === 'listo');
    if (listos.length === 0) {
      alert('No hay estudiantes listos para registrar. Corrige los datos o carga otro archivo.');
      return;
    }

    if (!confirm(`¿Confirmas el registro masivo de ${listos.length} estudiante(s)? Se crearán sus cuentas con contraseña = su número de DNI.`)) {
      return;
    }

    setProcesandoMasivo(true);
    setResultadoMasivo(null);

    try {
      const res = await fetch('/api/admin/estudiantes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudiantes: listos.map(item => ({
            dni_ce: item.dni_ce,
            numero_documento: item.numero_documento || item.dni_ce,
            tipo_documento: (item as any).tipo_documento || 'DNI',
            nombres: item.nombres,
            apellidos: item.apellidos,
            email: item.email,
            telefono: item.telefono,
            paquete_adquirido: item.paquete_adquirido,
            diplomado_1: item.diplomado_1,
            tipo_pago: item.tipo_pago,
            cuotas_totales: item.cuotas_totales,
            monto_total: item.monto_total,
            monto_cuota: item.monto_cuota,
            fecha_nacimiento: item.fecha_nacimiento || null
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultadoMasivo(data);
        await cargarEstudiantes();
      } else {
        alert(data.error || 'Ocurrió un error al procesar el lote.');
      }
    } catch (err: any) {
      console.error('Error en carga masiva:', err);
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const limpiarCargaMasiva = () => {
    setArchivoExcel(null);
    setFilasPrevia([]);
    setResultadoMasivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [nuevoTipoDoc, setNuevoTipoDoc] = useState<'DNI' | 'CE' | 'PASAPORTE' | 'OTRO'>('DNI');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoNombres, setNuevoNombres] = useState('');
  const [nuevoApellidos, setNuevoApellidos] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoCodigoPais, setNuevoCodigoPais] = useState('+51');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoFechaNacimiento, setNuevoFechaNacimiento] = useState('');
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<Record<string, PaqueteDefinicion>>(PAQUETES_DEFAULT);
  const [nuevoPaquete, setNuevoPaquete] = useState<string>('COMPLETO');
  const [nuevoTipoPago, setNuevoTipoPago] = useState<'CONTADO' | 'CUOTAS'>('CUOTAS');
  const [nuevoCuotasTotales, setNuevoCuotasTotales] = useState(3);
  const [nuevoMontoTotal, setNuevoMontoTotal] = useState(540);
  const [nuevoMontoCuota, setNuevoMontoCuota] = useState(180);
  const [nuevoDiplomado1, setNuevoDiplomado1] = useState(DIPLOMADOS_EDUMIN[0]);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [mensajeNuevo, setMensajeNuevo] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  useEffect(() => {
    // 1. Hidratación instantánea desde caché si existe
    const cachedEst = getClientCachedData('/api/admin/estudiantes');
    const cachedCat = getClientCachedData('/api/admin/catalogo');
    const cachedPaq = getClientCachedData('/api/admin/configuracion-paquetes');

    if (cachedEst?.estudiantes && Array.isArray(cachedEst.estudiantes)) {
      setEstudiantes(cachedEst.estudiantes);
      if (cachedEst.siguiente_recibo) setSiguienteRecibo(cachedEst.siguiente_recibo);
      setCargando(false);
    }
    if (cachedCat) {
      const todos = Array.isArray(cachedCat.todos)
        ? cachedCat.todos
        : [
            ...(cachedCat.diplomados || []),
            ...(cachedCat.cursosEspecializacion || cachedCat.cursos || []),
            ...(cachedCat.talleres || [])
          ];
      setCatalogoFull(todos);
    }
    if (cachedPaq?.paquetes && typeof cachedPaq.paquetes === 'object') {
      setPaquetesDisponibles(cachedPaq.paquetes);
    }

    // 2. Revalidación en segundo plano (stale-while-revalidate)
    cargarEstudiantes();
    cargarCatalogo();
    cargarConfigPaquetes();
  }, []);

  const cargarConfigPaquetes = async (forceRefresh = false) => {
    try {
      const data = await fetchWithClientCache('/api/admin/configuracion-paquetes', { forceRefresh });
      if (data?.paquetes && typeof data.paquetes === 'object') {
        setPaquetesDisponibles(data.paquetes);
      }
    } catch (e) {
      console.error('Error cargando paquetes configurados:', e);
    }
  };

  // Actualizar montos por defecto según paquete y tipo de pago
  const handleCambioPaquete = (pkgKey: string) => {
    setNuevoPaquete(pkgKey);
    const def = paquetesDisponibles[pkgKey] || PAQUETES_DEFAULT[pkgKey] || {
      precioContado: 540,
      precioCuotas: 540,
      cuotasSugeridas: 3
    };

    const precioBase = nuevoTipoPago === 'CONTADO' ? def.precioContado : def.precioCuotas;
    setNuevoMontoTotal(precioBase);

    if (nuevoTipoPago === 'CONTADO') {
      setNuevoCuotasTotales(1);
      setNuevoMontoCuota(precioBase);
    } else {
      const cuotas = def.cuotasSugeridas || 3;
      setNuevoCuotasTotales(cuotas);
      setNuevoMontoCuota(cuotas > 0 ? Math.round(precioBase / cuotas) : precioBase);
    }
  };

  const handleCambioTipoPago = (tipo: 'CONTADO' | 'CUOTAS') => {
    setNuevoTipoPago(tipo);
    const def = paquetesDisponibles[nuevoPaquete] || PAQUETES_DEFAULT[nuevoPaquete] || {
      precioContado: 540,
      precioCuotas: 540,
      cuotasSugeridas: 3
    };

    if (tipo === 'CONTADO') {
      setNuevoMontoTotal(def.precioContado);
      setNuevoCuotasTotales(1);
      setNuevoMontoCuota(def.precioContado);
    } else {
      const precio = def.precioCuotas;
      const cuotas = def.cuotasSugeridas || 3;
      setNuevoMontoTotal(precio);
      setNuevoCuotasTotales(cuotas);
      setNuevoMontoCuota(cuotas > 0 ? Math.round(precio / cuotas) : precio);
    }
  };

  const cargarCatalogo = async (forceRefresh = false) => {
    try {
      const data = await fetchWithClientCache('/api/admin/catalogo', { forceRefresh });
      if (data) {
        const todos = Array.isArray(data.todos)
          ? data.todos
          : [
              ...(data.diplomados || []),
              ...(data.cursosEspecializacion || data.cursos || []),
              ...(data.talleres || [])
            ];
        setCatalogoFull(todos);
      }
    } catch (e) {
      console.error('Error al cargar catálogo en estudiantes:', e);
    }
  };

  const cargarEstudiantes = async (forceRefresh = false) => {
    if (!estudiantes.length) setCargando(true);
    try {
      const data = await fetchWithClientCache('/api/admin/estudiantes', { forceRefresh });
      if (data && Array.isArray(data.estudiantes)) {
        setEstudiantes(data.estudiantes);
        if (data.siguiente_recibo) setSiguienteRecibo(data.siguiente_recibo);
        setAlumnoSeleccionado((prev) => {
          if (!prev) return null;
          return data.estudiantes.find((e: EstudianteCompleto) => e.id === prev.id || e.dni_ce === prev.dni_ce) || null;
        });
      }
    } catch (e) {
      console.error('Error cargando estudiantes:', e);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearEstudianteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDni.trim() || !nuevoNombres.trim() || !nuevoApellidos.trim() || !nuevoEmail.trim()) {
      setMensajeNuevo({ texto: 'Por favor complete todos los campos obligatorios (*).', tipo: 'error' });
      return;
    }

    setGuardandoNuevo(true);
    setMensajeNuevo(null);

    try {
      const defPaquete = paquetesDisponibles[nuevoPaquete] || PAQUETES_DEFAULT[nuevoPaquete];

      const res = await fetch('/api/admin/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_documento: nuevoTipoDoc,
          numero_documento: nuevoDni.trim(),
          dni_ce: nuevoDni.trim(),
          nombres: nuevoNombres.trim(),
          apellidos: nuevoApellidos.trim(),
          email: nuevoEmail.trim(),
          telefono: nuevoTelefono.trim() ? formatearCelularGuardar(nuevoCodigoPais, nuevoTelefono) : '',
          fecha_nacimiento: nuevoFechaNacimiento ? nuevoFechaNacimiento.trim() : null,
          paquete_adquirido: nuevoPaquete,
          tipo_pago: nuevoTipoPago,
          cuotas_totales: nuevoCuotasTotales,
          monto_total: nuevoMontoTotal,
          monto_cuota: nuevoMontoCuota,
          diplomado_1: nuevoDiplomado1,
          cupos_diplomados_personalizados: defPaquete?.creditosDiplomados,
          cupos_cursos_personalizados: defPaquete?.creditosCursos
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMensajeNuevo({
          texto: `¡Estudiante ${nuevoNombres} ${nuevoApellidos} creado exitosamente! Credenciales por defecto: [${nuevoTipoDoc}] ${nuevoDni.trim()}`,
          tipo: 'exito'
        });

        // Limpiar formulario
        setNuevoTipoDoc('DNI');
        setNuevoDni('');
        setNuevoNombres('');
        setNuevoApellidos('');
        setNuevoEmail('');
        setNuevoTelefono('');
        setNuevoFechaNacimiento('');

        await cargarEstudiantes();

        // Regresar a la pestaña directorio tras 2 segundos
        setTimeout(() => {
          setActiveTab('directorio');
          setMensajeNuevo(null);
        }, 2200);
      } else {
        setMensajeNuevo({ texto: data.error || 'Error al registrar estudiante.', tipo: 'error' });
      }
    } catch (err: any) {
      setMensajeNuevo({ texto: `Error de conexión: ${err.message}`, tipo: 'error' });
    } finally {
      setGuardandoNuevo(false);
    }
  };

  // Estados de Registro de Pago
  const [montoPago, setMontoPago] = useState<string>('150.00');
  const [comprobante, setComprobante] = useState<string>('OP-984321');
  const [metodo, setMetodo] = useState<string>('Yape / Plin');
  const [descuento, setDescuento] = useState<string>('0.00');
  const [pagoIdParaValidar, setPagoIdParaValidar] = useState<string | null>(null);
  const [selectedCreditoIdx, setSelectedCreditoIdx] = useState<number>(0);
  const [cargandoPago, setCargandoPago] = useState<boolean>(false);
  const [siguienteRecibo, setSiguienteRecibo] = useState<string>('REC-2026-00001');
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error'; webhookStatus?: string } | null>(null);

  // Estados de Anulación de Pago
  const [pagoParaAnular, setPagoParaAnular] = useState<any | null>(null);
  const [cargandoAnulacion, setCargandoAnulacion] = useState<boolean>(false);

  // Estados de Modales Adicionales
  const [reciboImprimir, setReciboImprimir] = useState<any | null>(null);
  const [mostrarEditarCronogramaModal, setMostrarEditarCronogramaModal] = useState<boolean>(false);
  const [editMontoTotal, setEditMontoTotal] = useState<number>(1500);
  const [editNroPagare, setEditNroPagare] = useState<string>('');
  const [editCuotas6, setEditCuotas6] = useState<{ val: string }[]>(Array(6).fill({ val: 'no corresponde' }));
  const [editFechas6, setEditFechas6] = useState<{ val: string }[]>(Array(6).fill({ val: '' }));
  const [enviandoAlertaWhatsApp, setEnviandoAlertaWhatsApp] = useState<boolean>(false);

  const registrarPago = async (
    cuotaIdxParam?: number, 
    cargoExtraParam?: { concepto: string; monto: number },
    datosExtraParam?: { nro_recibo?: string; nro_operacion?: string }
  ) => {
    if (!alumnoSeleccionado) return;
    setCargandoPago(true);
    setMensaje(null);
    try {
      const nroReciboFinal = datosExtraParam?.nro_recibo || comprobante || siguienteRecibo || 'REC-2026-00001';
      const nroOperacionFinal = datosExtraParam?.nro_operacion?.trim() ? datosExtraParam.nro_operacion.trim() : (metodo === 'Efectivo en Caja' ? 'N/A' : null);

      const payload: any = {
        dni_ce: alumnoSeleccionado.dni_ce,
        monto: cargoExtraParam ? cargoExtraParam.monto : Number(montoPago),
        metodo: cargoExtraParam ? `Cargo Extra: ${cargoExtraParam.concepto}` : metodo,
        comprobante: nroReciboFinal,
        nro_recibo: nroReciboFinal,
        nro_operacion: cargoExtraParam ? (datosExtraParam?.nro_operacion || 'N/A') : nroOperacionFinal,
        pago_id: pagoIdParaValidar,
        descuento: Number(descuento)
      };

      if (cargoExtraParam) {
        payload.is_cargo_extra = true;
        payload.concepto_cargo = cargoExtraParam.concepto;
      } else {
        const creditoActual = alumnoSeleccionado.creditos?.[selectedCreditoIdx] || alumnoSeleccionado.creditos?.[0];
        payload.num_credito = creditoActual?.num_credito || 1;
        if (cuotaIdxParam !== undefined) {
          payload.cuota_index = cuotaIdxParam;
        }
      }

      const res = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ 
          texto: data.mensaje || '¡Pago registrado exitosamente en el cronograma!', 
          tipo: 'exito',
          webhookStatus: data.webhookStatus
        });
        await cargarEstudiantes();
      } else {
        setMensaje({ texto: data.error || 'Error al registrar el pago.', tipo: 'error' });
      }
    } catch (e: any) {
      setMensaje({ texto: 'Error de conexión al procesar el pago.', tipo: 'error' });
    } finally {
      setCargandoPago(false);
    }
  };

  const handleAnularPagoSubmit = async () => {
    if (!alumnoSeleccionado || !pagoParaAnular) return;
    setCargandoAnulacion(true);
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni_ce: alumnoSeleccionado.dni_ce,
          pago_id: pagoParaAnular.id,
          cuota_index: pagoParaAnular.cuota_index,
          num_credito: pagoParaAnular.num_credito || 1,
          is_cargo_extra: Boolean(pagoParaAnular.is_cargo_extra)
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPagoParaAnular(null);
        await cargarEstudiantes();
        alert('Pago o cuota anulada exitosamente en el cronograma.');
      } else {
        alert(`Error al anular el pago: ${data.error || 'Error imprevisto'}`);
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`);
    } finally {
      setCargandoAnulacion(false);
    }
  };

  const handleGuardarCronogramaSubmit = async () => {
    if (!alumnoSeleccionado) return;
    try {
      const creditoActual = alumnoSeleccionado.creditos?.[selectedCreditoIdx] || alumnoSeleccionado.creditos?.[0];
      const res = await fetch('/api/admin/pagos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editar_cronograma',
          dni_ce: alumnoSeleccionado.dni_ce,
          pago_id: creditoActual?.id,
          num_credito: creditoActual?.num_credito || 1,
          nro_pagare: editNroPagare,
          monto_total: editMontoTotal,
          cuotas: editCuotas6.map(c => c.val),
          fechas_vencimiento: editFechas6.map(f => f.val)
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('¡Configuración de cuotas y cronograma actualizada exitosamente en Supabase!');
        setMostrarEditarCronogramaModal(false);
        await cargarEstudiantes();
      } else {
        alert(`Error al guardar configuración de cronograma: ${data.error || 'Error imprevisto'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    }
  };

  const enviarAlertaWhatsAppRetencion = async () => {
    if (!alumnoSeleccionado) return;
    setEnviandoAlertaWhatsApp(true);
    try {
      await fetch('/api/admin/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'ALERTA_RETENCION_DESERCION_CERO',
          detalles: {
            estudiante: `${alumnoSeleccionado.nombres} ${alumnoSeleccionado.apellidos}`,
            dni_ce: alumnoSeleccionado.dni_ce,
            telefono: alumnoSeleccionado.telefono,
            dias_inactivo: alumnoSeleccionado.dias_inactivo,
            deuda: alumnoSeleccionado.deuda_total_pendiente,
            riesgo: alumnoSeleccionado.nivel_riesgo_churn
          }
        })
      });
      alert(`¡Alerta de Retención enviada a n8n para notificar vía WhatsApp a ${alumnoSeleccionado.nombres}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviandoAlertaWhatsApp(false);
    }
  };

  const limpiarTexto = (t: string) => (t || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const estudiantesFiltrados = estudiantes.filter(est => {
    const q = limpiarTexto(busqueda);
    const coincideBusqueda = !busqueda || 
      limpiarTexto(est.nombres).includes(q) || 
      limpiarTexto(est.apellidos).includes(q) || 
      limpiarTexto(est.dni_ce).includes(q) ||
      limpiarTexto(est.email).includes(q);

    const coincideEstado = filtroEstado === 'todos' || est.estado === filtroEstado;
    const coincideRiesgo = filtroRiesgo === 'todos' || est.nivel_riesgo_churn === filtroRiesgo;

    return coincideBusqueda && coincideEstado && coincideRiesgo;
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Principal Unificado */}
      <AdminSidebar />

      {/* Contenido Principal con Header Superior */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Directorio y secretaría de estudiantes
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('nuevo')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                + Nuevo estudiante
              </button>

              <button
                onClick={() => cargarEstudiantes(true)}
                disabled={cargando}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                Actualizar lista ({estudiantes.length})
              </button>
            </div>
          </div>

          {/* Navegación por pestañas principales */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
            {/* Pestaña 1: Directorio de estudiantes */}
            <button
              onClick={() => setActiveTab('directorio')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'directorio' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Directorio de estudiantes ({estudiantes.length})
            </button>

            {/* Pestaña 2: Nuevo estudiante */}
            <button
              onClick={() => setActiveTab('nuevo')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'nuevo' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" /> 
              Nuevo estudiante
            </button>

            {/* Pestaña 3: Carga masiva con Excel */}
            <button
              onClick={() => setActiveTab('masivo')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'masivo' 
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 
              Carga masiva (Excel)
            </button>
          </div>

          {/* CONTENIDO PESTAÑA 1: DIRECTORIO DE ESTUDIANTES */}
          {activeTab === 'directorio' && (
            <div className="space-y-6">
              {/* Filtros de búsqueda */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="size-4" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Buscar por DNI, nombres, apellidos o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="todos">Todos los estados de deuda</option>
                    <option value="Al Día">Al día</option>
                    <option value="Deuda Activa">Deuda activa</option>
                    <option value="Constancia de no adeudo">Constancia de no adeudo</option>
                    <option value="Bloqueado por Sistema">Bloqueado por sistema</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filtroRiesgo}
                    onChange={(e) => setFiltroRiesgo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="todos">Todos los niveles de riesgo</option>
                    <option value="BAJO">Riesgo bajo</option>
                    <option value="MEDIO">Riesgo medio</option>
                    <option value="ALTO">Riesgo alto</option>
                    <option value="CRÍTICO">Riesgo crítico</option>
                  </select>
                </div>
              </div>

              {/* Tabla de estudiantes */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Documento</th>
                        <th className="py-3 px-4">Estudiante</th>
                        <th className="py-3 px-4">Programa principal</th>
                        <th className="py-3 px-4">Paquete y créditos</th>
                        <th className="py-3 px-4 text-center">Avance</th>
                        <th className="py-3 px-4 text-center">Estado de deuda</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                      {cargando ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                            Cargando estudiantes desde Supabase...
                          </td>
                        </tr>
                      ) : estudiantesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No se encontraron estudiantes registrados con los filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        estudiantesFiltrados.map((est) => (
                          <tr key={est.id || est.dni_ce} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                                  est.tipo_documento === 'PASAPORTE'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : est.tipo_documento === 'CE'
                                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    : est.tipo_documento === 'OTRO'
                                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}>
                                  {est.tipo_documento || 'DNI'}
                                </span>
                                <span>{est.numero_documento || est.dni_ce}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 text-white text-[11px] font-black flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 select-none">
                                  {est.foto_perfil ? (
                                    <img src={est.foto_perfil} alt={est.nombres} className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    <span>{(est.nombres?.[0] || 'A').toUpperCase()}{(est.apellidos?.[0] || '').toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate">
                                    {est.nombres} {est.apellidos}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-normal truncate">
                                    {est.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                              {est.diplomado_actual || 'DERECHO MINERO'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {est.paquete_adquirido}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Cuotas: {est.cuotas_pagadas || 1}/{est.cuotas_totales || 3}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                                <span>{est.avance_porcentaje || 0}%</span>
                              </div>
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, est.avance_porcentaje || 0)}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                est.estado === 'Constancia de no adeudo'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : est.estado === 'Deuda Activa'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : est.estado === 'Bloqueado por Sistema'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}>
                                {est.estado}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setAlumnoSeleccionado(est)}
                                  className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                                  title="Ver y editar ficha completa del estudiante"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => setAlumnoSeleccionado(est)}
                                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                  title="Ver Ficha 360°"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ficha</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO PESTAÑA 2: NUEVO ESTUDIANTE (FORMULARIO MANUAL) */}
          {activeTab === 'nuevo' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-8">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold mb-2">
                  <UserPlus className="w-3.5 h-3.5" /> Formulario de alta y matrícula directa
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        ¿Tienes varios estudiantes por matricular?
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Usa la carga masiva con Excel (.xlsx) para inscribir decenas de estudiantes en segundos.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('masivo')}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                  >
                    <span>Ir a Carga Masiva Excel</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Registrar nuevo estudiante (Manual)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Crea la cuenta en Supabase Auth y el perfil en la base de datos. La contraseña inicial será automáticamente su número de DNI o carnet.
                </p>
              </div>

              {mensajeNuevo && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
                  mensajeNuevo.tipo === 'exito' 
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}>
                  {mensajeNuevo.tipo === 'exito' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{mensajeNuevo.texto}</span>
                </div>
              )}

              <form onSubmit={handleCrearEstudianteSubmit} className="space-y-6">
                
                {/* Sección 1: Datos personales */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" /> 1. Datos personales del estudiante
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de documento *
                      </label>
                      <select
                        value={nuevoTipoDoc}
                        onChange={(e) => setNuevoTipoDoc(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">Carné de extranjería</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número de documento *
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="text" 
                          required
                          placeholder="Número de documento"
                          value={nuevoDni}
                          onChange={(e) => setNuevoDni(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="email" 
                          required
                          placeholder="alumno@correo.com"
                          value={nuevoEmail}
                          onChange={(e) => setNuevoEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombres *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej: Juan Carlos"
                        value={nuevoNombres}
                        onChange={(e) => setNuevoNombres(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Apellidos *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej: Quispe Ramos"
                        value={nuevoApellidos}
                        onChange={(e) => setNuevoApellidos(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Teléfono / WhatsApp (opcional)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={nuevoCodigoPais}
                          onChange={(e) => setNuevoCodigoPais(e.target.value)}
                          className="w-32 px-2 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shrink-0"
                        >
                          {LISTA_PAISES.map((p) => (
                            <option key={`${p.codigo}-${p.dialCode}`} value={p.dialCode}>
                              {p.codigo} ({p.dialCode})
                            </option>
                          ))}
                        </select>
                        <div className="relative flex-1 min-w-0">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                          <input 
                            type="tel" 
                            placeholder="987654321"
                            value={nuevoTelefono}
                            onChange={(e) => setNuevoTelefono(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha de nacimiento (opcional)
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="date" 
                          value={nuevoFechaNacimiento}
                          onChange={(e) => setNuevoFechaNacimiento(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Paquete y créditos EDUMIN */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> 2. Paquete comercial y créditos EDUMIN
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {Object.values(paquetesDisponibles).map((pkg) => {
                      const esSeleccionado = nuevoPaquete === pkg.id;
                      const totalCreditos = (pkg.creditosDiplomados || 0) + (pkg.creditosCursos || 0);

                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleCambioPaquete(pkg.id)}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer relative ${
                            esSeleccionado
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase">{pkg.nombre}</span>
                            {pkg.esPersonalizado && (
                              <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                Personalizado
                              </span>
                            )}
                          </div>
                          
                          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            S/ {(nuevoTipoPago === 'CONTADO' ? pkg.precioContado : pkg.precioCuotas).toFixed(2)}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                            <div>• {pkg.creditosDiplomados} {pkg.creditosDiplomados === 1 ? 'crédito de diplomado' : 'créditos de diplomados'}</div>
                            <div>• {pkg.creditosCursos} créditos de cursos</div>
                            <div className="font-bold text-indigo-600 dark:text-indigo-300 pt-1">
                              Total: {totalCreditos} créditos EDUMIN
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Diplomado inicial de ingreso (elegido en ventas) *
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={nuevoDiplomado1}
                        onChange={(e) => setNuevoDiplomado1(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        {(() => {
                          const dipsCatalogo = (catalogoFull || [])
                            .filter((d: any) => d && (d.tipo === 'diplomado' || String(d.codigo || d.id || '').toUpperCase().startsWith('DIP-')))
                            .map((d: any) => String(d.titulo || d.nombre || '').trim().toUpperCase())
                            .filter(Boolean);
                          const opciones = dipsCatalogo.length > 0 ? dipsCatalogo : DIPLOMADOS_EDUMIN;
                          return opciones.map((dip, idx) => (
                            <option key={idx} value={dip}>{dip}</option>
                          ));
                        })()}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Este diplomado consumirá el primer crédito de diplomado asignado. Los créditos de cursos libres quedarán disponibles para que el alumno se autogestione desde su módulo de canje.
                    </p>
                  </div>
                </div>

                {/* Sección 3: Modalidad financiera y cuotas */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" /> 3. Modalidad financiera y cronograma
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Forma de pago
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCambioTipoPago('CUOTAS')}
                          className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            nuevoTipoPago === 'CUOTAS'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          En cuotas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCambioTipoPago('CONTADO')}
                          className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            nuevoTipoPago === 'CONTADO'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          Al contado
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número de cuotas
                      </label>
                      <select
                        disabled={nuevoTipoPago === 'CONTADO'}
                        value={nuevoCuotasTotales}
                        onChange={(e) => setNuevoCuotasTotales(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      >
                        {nuevoTipoPago === 'CONTADO' ? (
                          <option value={1}>1 cuota única (al contado)</option>
                        ) : (
                          <>
                            <option value={2}>2 cuotas</option>
                            <option value={3}>3 cuotas (estándar)</option>
                            <option value={4}>4 cuotas</option>
                            <option value={5}>5 cuotas (ilimitado)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Monto total (S/)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={nuevoMontoTotal}
                        onChange={(e) => setNuevoMontoTotal(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Monto de cuota inicial / pagada al ingresar (S/)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={nuevoMontoCuota}
                        onChange={(e) => setNuevoMontoCuota(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      Saldo pendiente al ingresar: <strong className="text-slate-900 dark:text-white">S/ {Math.max(0, nuevoMontoTotal - nuevoMontoCuota).toFixed(2)}</strong>
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {nuevoTipoPago === 'CONTADO' ? 'Constancia de no adeudo inmediata' : 'Cuota 01 pagada'}
                    </span>
                  </div>
                </div>

                {/* Botón de Envío */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('directorio')}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={guardandoNuevo}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {guardandoNuevo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Creando cuenta...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Matricular y crear estudiante
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* CONTENIDO PESTAÑA 3: CARGA MASIVA CON EXCEL */}
          {activeTab === 'masivo' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* Encabezado de Carga Masiva */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold mb-2">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Importación Masiva Oficial
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Carga masiva de estudiantes en lote
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      Descarga la plantilla oficial en Excel (.xlsx) o CSV, completa los datos de tus estudiantes y súbela aquí. El sistema creará sus cuentas en Supabase Auth, sus perfiles, sus cupos de créditos y su primer recibo oficial de forma automática.
                    </p>
                  </div>

                  {/* Botones de Descarga de Plantillas */}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
                    <button
                      onClick={descargarPlantillaExcel}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      title="Descargar Plantilla en formato Excel .XLSX"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar plantilla Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={descargarPlantillaCsv}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      title="Descargar Plantilla en formato texto CSV"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Plantilla CSV</span>
                    </button>
                  </div>
                </div>

                {/* Zona de Arrastrar y Soltar Archivo */}
                <div className="pt-6">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) procesarArchivoExcel(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]'
                        : archivoExcel
                        ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) procesarArchivoExcel(file);
                      }}
                    />

                    <div className="size-14 mx-auto rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-3">
                      <UploadCloud className="size-7" />
                    </div>

                    {archivoExcel ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Archivo seleccionado: <span className="text-emerald-600 dark:text-emerald-400">{archivoExcel.name}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(archivoExcel.size / 1024).toFixed(1)} KB • Haz clic o arrastra otro archivo para reemplazarlo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Arrastra tu archivo Excel (.xlsx / .xls) o CSV aquí
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          o haz clic para examinar desde tu equipo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resultado del Registro Masivo tras procesar */}
              {resultadoMasivo && (
                <div className={`p-6 rounded-3xl border shadow-sm ${
                  resultadoMasivo.errores === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-6 text-emerald-600 shrink-0" />
                        <h3 className="text-base font-bold">
                          {resultadoMasivo.mensaje || 'Carga masiva procesada exitosamente'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Todos los estudiantes creados ya cuentan con acceso habilitado y contraseña inicial (su número de DNI).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setActiveTab('directorio');
                          limpiarCargaMasiva();
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Users className="size-3.5" />
                        <span>Ver en Directorio</span>
                      </button>
                      <button
                        onClick={limpiarCargaMasiva}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Cargar otro lote
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista Previa de Filas Analizadas */}
              {filasPrevia.length > 0 && !resultadoMasivo && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Resumen de Estado de Validación */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="size-4 text-emerald-600" /> Previsualización del lote ({filasPrevia.length} filas detectadas)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Verifica los datos antes de ejecutar la matrícula automática en Supabase.
                      </p>
                    </div>

                    {/* Contadores */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        🟢 {filasPrevia.filter(f => f.estadoFila === 'listo').length} listos
                      </span>
                      {filasPrevia.filter(f => f.estadoFila === 'duplicado').length > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          🟡 {filasPrevia.filter(f => f.estadoFila === 'duplicado').length} duplicados (se omitirán)
                        </span>
                      )}
                      {filasPrevia.filter(f => f.estadoFila === 'error').length > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          🔴 {filasPrevia.filter(f => f.estadoFila === 'error').length} con errores
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabla con Scroll Horizontal */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Fila</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4">DNI / CE</th>
                          <th className="py-3 px-4">Estudiante</th>
                          <th className="py-3 px-4">Correo</th>
                          <th className="py-3 px-4">Paquete</th>
                          <th className="py-3 px-4">Diplomado Inicial</th>
                          <th className="py-3 px-4">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filasPrevia.map((item, idx) => {
                          const esListo = item.estadoFila === 'listo';
                          const esDuplicado = item.estadoFila === 'duplicado';
                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                esListo
                                  ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  : esDuplicado
                                  ? 'bg-amber-50/30 dark:bg-amber-950/10'
                                  : 'bg-rose-50/40 dark:bg-rose-950/20'
                              }`}
                            >
                              <td className="py-3 px-4 font-mono text-slate-400">
                                #{item.filaNum}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {esListo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <Check className="size-3" /> Listo
                                  </span>
                                ) : esDuplicado ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={item.motivo}>
                                    <AlertTriangle className="size-3" /> Ya existe
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800" title={item.motivo}>
                                    <XCircle className="size-3" /> Error
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                {item.dni_ce || <span className="text-rose-500 italic">Vacío</span>}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                {item.nombres || item.apellidos ? (
                                  `${item.nombres} ${item.apellidos}`.trim()
                                ) : (
                                  <span className="text-rose-500 italic">Falta nombre</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                {item.email || <span className="text-rose-500 italic">Vacío</span>}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                                  {item.paquete_adquirido}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={item.diplomado_1}>
                                {item.diplomado_1}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {item.tipo_pago === 'CONTADO' ? 'Contado' : `${item.cuotas_totales} cuotas`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Acciones de Procesamiento */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      onClick={limpiarCargaMasiva}
                      disabled={procesandoMasivo}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancelar y descartar archivo
                    </button>

                    <button
                      type="button"
                      onClick={ejecutarRegistroMasivo}
                      disabled={procesandoMasivo || filasPrevia.filter(f => f.estadoFila === 'listo').length === 0}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer w-full sm:w-auto"
                    >
                      {procesandoMasivo ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Inscribiendo estudiantes en Supabase...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-4" />
                          <span>
                            Iniciar registro de {filasPrevia.filter(f => f.estadoFila === 'listo').length} estudiante(s)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>
        </main>
      </div>

      {/* Modal Ficha 360° del Alumno */}
      {alumnoSeleccionado && (
        <Ficha360Modal
          alumnoSeleccionado={alumnoSeleccionado}
          catalogoDiplomados={catalogoFull}
          onClose={() => setAlumnoSeleccionado(null)}
          onAbrirCronograma={(cred: any) => {
            if (cred) {
              const totalMonto = Number(cred.monto || cred.monto_total || alumnoSeleccionado.monto_total_programa || 900);
              setEditMontoTotal(totalMonto);
              setEditNroPagare(cred.nro_pagare || ('2026-I-000' + (alumnoSeleccionado.dni_ce || '').substring(0, 4)));

              // Priorizar plan_cuotas si ya fue guardado previamente, de lo contrario cuotas / cuotas_desglose
              const rawPlan = Array.isArray(cred.plan_cuotas) && cred.plan_cuotas.length > 0 ? cred.plan_cuotas : null;
              const rawCuotas = Array.isArray(cred.cuotas) && cred.cuotas.length > 0 
                ? cred.cuotas 
                : (Array.isArray(cred.cuotas_desglose) && cred.cuotas_desglose.length > 0 ? cred.cuotas_desglose : null);

              const fuenteCuotas = rawPlan || rawCuotas;

              if (fuenteCuotas) {
                const indicesCorresponden: number[] = [];
                fuenteCuotas.forEach((c: any, i: number) => {
                  if (c !== 'no corresponde' && i < 6) indicesCorresponden.push(i);
                });

                // Si todos vinieron como "no corresponde", inferir cuotas reales o sugerir 2 cuotas
                if (indicesCorresponden.length === 0) {
                  indicesCorresponden.push(0, 1);
                }

                const numCuotas = Math.max(1, indicesCorresponden.length);
                const cuotaPromedio = Math.round(totalMonto / numCuotas);

                const arr = Array(6).fill(null).map((_, i) => {
                  if (!indicesCorresponden.includes(i)) {
                    return { val: 'no corresponde' };
                  }
                  const rawVal = fuenteCuotas ? fuenteCuotas[i] : null;
                  const numVal = Number(rawVal) || 0;
                  // Si no hay plan previo y la cuota está en 0 (pendiente de pago), sugerir el desglose
                  if ((!rawVal || rawVal === 'no corresponde' || numVal === 0) && !rawPlan) {
                    if (i === 0 && Number(cred.total_pagado || 0) > 0) {
                      return { val: String(cred.total_pagado) };
                    }
                    if (i === 1 && Number(cred.total_pagado || 0) > 0 && totalMonto > Number(cred.total_pagado || 0)) {
                      return { val: String(totalMonto - Number(cred.total_pagado)) };
                    }
                    return { val: String(cuotaPromedio) };
                  }
                  return { val: String(rawVal) };
                });

                // Si la suma no cuadra con totalMonto (ej. por redondeos o cuota pendiente ajustada), ajustar la última cuota activa
                let sumaActual = arr.reduce((acc, it) => it.val !== 'no corresponde' ? acc + (Number(it.val) || 0) : acc, 0);
                const diferencia = totalMonto - sumaActual;
                if (diferencia !== 0 && indicesCorresponden.length > 0) {
                  const lastIdx = indicesCorresponden[indicesCorresponden.length - 1];
                  const lastVal = Number(arr[lastIdx].val) || 0;
                  arr[lastIdx] = { val: String(Math.max(0, lastVal + diferencia)) };
                }

                setEditCuotas6(arr);

                // Poblar fechas de vencimiento guardadas o autocalcularlas mensualmente
                const rawFechas = cred?.fechas_vencimiento || [];
                const baseDate = cred?.created_at || new Date().toISOString();
                const fechasArr = Array(6).fill(null).map((_, i) => {
                  if (rawFechas[i]) return { val: rawFechas[i] };
                  const d = new Date(baseDate);
                  d.setMonth(d.getMonth() + i);
                  const a = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const dia = String(d.getDate()).padStart(2, '0');
                  return { val: `${a}-${m}-${dia}` };
                });
                setEditFechas6(fechasArr);
              } else {
                setEditCuotas6([
                  { val: String(totalMonto) },
                  { val: 'no corresponde' },
                  { val: 'no corresponde' },
                  { val: 'no corresponde' },
                  { val: 'no corresponde' },
                  { val: 'no corresponde' }
                ]);
                const baseDate = cred?.created_at || new Date().toISOString();
                const d = new Date(baseDate);
                const a = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dia = String(d.getDate()).padStart(2, '0');
                setEditFechas6([{ val: `${a}-${m}-${dia}` }, { val: '' }, { val: '' }, { val: '' }, { val: '' }, { val: '' }]);
              }
            }
            setMostrarEditarCronogramaModal(true);
          }}
          onSetPagoParaAnular={(pag) => setPagoParaAnular(pag)}
          onRegistrarPago={registrarPago}
          montoPago={montoPago}
          setMontoPago={setMontoPago}
          comprobante={comprobante}
          setComprobante={setComprobante}
          metodo={metodo}
          setMetodo={setMetodo}
          cargandoPago={cargandoPago}
          mensaje={mensaje}
          selectedCreditoIdx={selectedCreditoIdx}
          setSelectedCreditoIdx={setSelectedCreditoIdx}
          onSetPagoIdParaValidar={setPagoIdParaValidar}
          onSetReciboImprimir={(pag) => setReciboImprimir(pag)}
          onEnviarAlertaWhatsApp={enviarAlertaWhatsAppRetencion}
          enviandoAlertaWhatsApp={enviandoAlertaWhatsApp}
          onRefetchEstudiantes={cargarEstudiantes}
          siguienteRecibo={siguienteRecibo}
        />
      )}

      {/* Modal: Recibo Interno Imprimible */}
      <ReciboModal
        reciboImprimir={reciboImprimir}
        alumnoSeleccionado={alumnoSeleccionado}
        onClose={() => setReciboImprimir(null)}
      />

      {/* Modal: Anulación de Pago */}
      <AnularPagoModal
        pagoParaAnular={pagoParaAnular}
        alumnoSeleccionado={alumnoSeleccionado}
        onClose={() => setPagoParaAnular(null)}
        onSubmit={handleAnularPagoSubmit}
        cargandoAnulacion={cargandoAnulacion}
      />

      {/* Modal: Editar Cuotas y Cronograma de Pagos */}
      <EditarCronogramaModal
        isOpen={mostrarEditarCronogramaModal}
        alumnoSeleccionado={alumnoSeleccionado}
        selectedCreditoIdx={selectedCreditoIdx}
        editMontoTotal={editMontoTotal}
        setEditMontoTotal={setEditMontoTotal}
        editNroPagare={editNroPagare}
        setEditNroPagare={setEditNroPagare}
        editCuotas6={editCuotas6}
        setEditCuotas6={setEditCuotas6}
        editFechas6={editFechas6}
        setEditFechas6={setEditFechas6}
        onClose={() => setMostrarEditarCronogramaModal(false)}
        onSave={handleGuardarCronogramaSubmit}
      />

    </div>
  );
}
