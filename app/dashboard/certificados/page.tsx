'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Globe, 
  BookOpen, 
  Sparkles, 
  GraduationCap, 
  Lock, 
  X,
  Eye,
  Share2,
  Copy,
  Check,
  ShoppingCart,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  QrCode
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';
import configuracionExamenesJson from '@/lib/data/configuracion_examenes.json';
import AvanzaCertificateRenderer from '@/components/certificates/AvanzaCertificateRenderer';
import { generarUrlQRValidacion } from '@/lib/utils/certificateUtils';
import { descargarCertificadoA4Pdf } from '@/lib/utils/certificatePdf';

export default function CertificadosPage() {
  const { esOscuro } = useTheme();

  // Perfil real del estudiante desde Supabase
  const [perfilEstudiante, setPerfilEstudiante] = useState<any>(null);
  const [modelosCertificados, setModelosCertificados] = useState<any[]>([]);
  const [certificadosEmitidosDb, setCertificadosEmitidosDb] = useState<any[]>([]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const [meRes, modelosRes] = await Promise.all([
          fetch('/api/dashboard/me'),
          fetch('/api/admin/certificaciones/modelos').catch(() => null)
        ]);

        if (modelosRes && modelosRes.ok) {
          const modData = await modelosRes.json();
          if (Array.isArray(modData.modelos)) {
            setModelosCertificados(modData.modelos);
          }
        }

        if (meRes.ok) {
          const data = await meRes.json();
          if (data.profile) {
            setPerfilEstudiante(data.profile);
            if (data.profile.diplomado_1) {
              setDiplomadoSeleccionado(data.profile.diplomado_1);
            }

            const dni = data.profile.dni_ce || data.profile.dni;
            if (dni) {
              fetch(`/api/admin/certificaciones?dni=${encodeURIComponent(dni)}`)
                .then(r => r.json())
                .then(d => {
                  if (Array.isArray(d.certificaciones)) {
                    setCertificadosEmitidosDb(d.certificaciones);
                  }
                })
                .catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error('Error fetching student profile for certificates:', e);
      }
    };
    fetchMe();
  }, []);

  // Navegación por pestañas (Tabs Navigation)
  type TabTipo = 'TODOS' | 'DIPLOMAS' | 'MODULARES' | 'CONVENIOS' | 'CURSOS_TALLERES';
  const [tabActiva, setTabActiva] = useState<TabTipo>('TODOS');

  // Control de despliegue de acordeón por diplomado en Certificados Modulares
  const [modularesAbiertos, setModularesAbiertos] = useState<Record<string, boolean>>({});

  const toggleModularesDiplomado = (diplomadoNombre: string) => {
    setModularesAbiertos(prev => ({
      ...prev,
      [diplomadoNombre]: prev[diplomadoNombre] === false ? true : false
    }));
  };

  // Estados de modal de convenios (CIP / MIAMI)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoCertificacion, setTipoCertificacion] = useState<'CIP' | 'MIAMI'>('CIP');
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  // Estados de Vista Previa de Certificado
  const [modalVistaPrevia, setModalVistaPrevia] = useState<{
    abierto: boolean;
    id?: string;
    titulo: string;
    subtitulo: string;
    categoria?: string;
    fecha: string;
    codigo: string;
    horas?: string;
    modelo_id?: string;
    nota?: number;
    tipo: 'Diplomado' | 'Modular' | 'Curso' | 'Taller';
  } | null>(null);

  const [copiadoLink, setCopiadoLink] = useState(false);

  // Resolución dinámica del modelo o superplantilla oficial para la vista previa
  const modeloActivo = useMemo(() => {
    if (!modalVistaPrevia) return null;

    const tipoEsperado = modalVistaPrevia.tipo === 'Diplomado' 
      ? 'DIPLOMA' 
      : modalVistaPrevia.tipo === 'Modular' 
        ? 'MODULAR' 
        : (modalVistaPrevia.tipo === 'Taller' ? 'TALLER' : 'CURSO');

    // 1. Buscar coincidencia en BD de certificados emitidos
    let certDb: any = null;
    if (certificadosEmitidosDb.length > 0) {
      certDb = certificadosEmitidosDb.find((c: any) => {
        if (modalVistaPrevia.codigo && c.codigo_verificacion === modalVistaPrevia.codigo) return true;
        if (modalVistaPrevia.tipo === 'Modular') {
          return c.tipo === 'MODULAR' && (
            c.modulo_titulo?.toLowerCase().includes(modalVistaPrevia.titulo.toLowerCase()) ||
            modalVistaPrevia.titulo.toLowerCase().includes(c.modulo_titulo?.toLowerCase() || '')
          );
        }
        if (c.tipo === tipoEsperado || (tipoEsperado === 'CURSO' && c.tipo === 'TALLER') || (tipoEsperado === 'TALLER' && c.tipo === 'CURSO')) {
          return c.programa_titulo?.toLowerCase() === modalVistaPrevia.titulo.toLowerCase();
        }
        return false;
      });
    }

    // 2. Buscar superplantilla configurada por el Administrador en Supabase
    const modeloIdBuscado = modalVistaPrevia.modelo_id || certDb?.plantilla_snapshot?.modelo_id || certDb?.modelo_id;
    let modeloSuperplantilla = (modelosCertificados || []).find((m: any) => m.id === modeloIdBuscado);

    if (!modeloSuperplantilla && modelosCertificados && modelosCertificados.length > 0) {
      // Buscar superplantilla global del tipo
      modeloSuperplantilla = modelosCertificados.find((m: any) => 
        String(m.tipo).toUpperCase() === tipoEsperado && 
        (m.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' || m.esPredeterminado)
      );

      // Si es Taller y no hay específico, usar CURSO global
      if (!modeloSuperplantilla && tipoEsperado === 'TALLER') {
        modeloSuperplantilla = modelosCertificados.find((m: any) => 
          String(m.tipo).toUpperCase() === 'CURSO' && 
          (m.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' || m.esPredeterminado)
        );
      }

      if (!modeloSuperplantilla) {
        modeloSuperplantilla = modelosCertificados.find((m: any) => String(m.tipo).toUpperCase() === tipoEsperado);
      }
    }

    // 3. Fusionar priorizando el diseño/coordenadas oficiales de la Superplantilla
    const orientacionDefecto = (tipoEsperado === 'CURSO' || tipoEsperado === 'TALLER') ? 'vertical' : 'horizontal';
    const orientacionFinal = modeloSuperplantilla?.orientacion || certDb?.plantilla_snapshot?.orientacion || orientacionDefecto;
    const fondoFinal = modeloSuperplantilla?.imagenFondoUrl || certDb?.plantilla_snapshot?.imagenFondoUrl || 
      (orientacionFinal === 'vertical' 
        ? 'https://wluuomwkxywpfotbngwf.supabase.co/storage/v1/object/public/certificados/fondos/plantilla_1792606225470_g6hsm1j.webp'
        : (tipoEsperado === 'DIPLOMA' 
            ? '/assets/certificates/plantilla_avanza_diploma_bg.png' 
            : '/assets/certificates/plantilla_avanza_modular_bg.png'));

    const coordsFinal = modeloSuperplantilla?.disenoCoordenadas || certDb?.plantilla_snapshot?.disenoCoordenadas || null;

    return {
      ...(certDb?.plantilla_snapshot || {}),
      ...(modeloSuperplantilla || {}),
      orientacion: orientacionFinal,
      imagenFondoUrl: fondoFinal,
      disenoCoordenadas: coordsFinal,
      incluyeQr: (modeloSuperplantilla?.incluyeQr ?? certDb?.plantilla_snapshot?.incluyeQr) !== false,
      horas: modalVistaPrevia.horas || certDb?.horas_lectivas || modeloSuperplantilla?.horas || certDb?.plantilla_snapshot?.horas
    };
  }, [modalVistaPrevia, modelosCertificados, certificadosEmitidosDb]);

  // Nombre completo del estudiante desde Supabase
  const nombreEstudianteCompleto = perfilEstudiante
    ? `${perfilEstudiante.nombres || ''} ${perfilEstudiante.apellidos || ''}`.trim()
    : 'Estudiante EDUMIN';

  const paqueteUsuario = perfilEstudiante?.paquete_adquirido || 'COMPLETO';

  // 1. DIPLOMAS GENERALES DINÁMICOS DESDE SUPABASE
  const diplomadosProgreso = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    return rawDiplomados.map((d: any, idx: number) => {
      const modulos = d.modulos || [];
      // Solo consideramos módulos aprobados con nota mínima de 12/20
      const modulosAprobados = modulos.filter((m: any) => {
        const nota = m.nota !== undefined ? Number(m.nota) : (m.completado ? 18 : 0);
        return (Boolean(m.completado) || Boolean(m.codigo_cert)) && nota >= 12;
      });
      const modularesAprobados = modulosAprobados.length;
      const modularesTotales = Math.max(3, modulos.length || 3);
      const sumaNotas = modulosAprobados.reduce((sum: number, m: any) => sum + (Number(m.nota) || 18), 0);
      const promedio = modularesAprobados > 0 ? Number((sumaNotas / modularesAprobados).toFixed(1)) : 0;
      
      // REGLA ACADÉMICA ESTRICTA: El diploma general se otorga ÚNICAMENTE si aprueba los 3 módulos con nota >= 12
      const completado = modularesAprobados >= 3;

      // Buscar si ya tiene certificado oficial de diploma en DB
      const certDbDip = certificadosEmitidosDb.find(c => c.tipo === 'DIPLOMA' && c.programa_titulo?.toLowerCase() === d.titulo?.toLowerCase());

      return {
        id: d.id || d.slug || `dip-${idx + 1}`,
        titulo: d.titulo || 'Diplomado',
        modularesAprobados,
        modularesTotales,
        promedio: certDbDip?.nota_final !== undefined && certDbDip.nota_final !== null ? Number(certDbDip.nota_final) : (d.promedio || promedio),
        completado: completado || Boolean(certDbDip),
        horas: certDbDip?.horas_lectivas || d.horas || '325 horas académicas y 13 créditos académicos',
        modelo_id: certDbDip?.plantilla_snapshot?.modelo_id || (d as any).modelo_id || 'mod-avanza-dip',
        fecha: certDbDip?.fecha_emision ? String(certDbDip.fecha_emision) : (d.fecha || '15/03/2026'),
        codigo: certDbDip?.codigo_verificacion || d.codigo || `EDUMIN-DIP-${perfilEstudiante.dni_ce || '71234567'}-${(d.id || 'DIP').substring(0, 3).toUpperCase()}`
      };
    });
  }, [perfilEstudiante, certificadosEmitidosDb]);

  // 2. CERTIFICADOS MODULARES DINÁMICOS DESDE SUPABASE
  const certificadosModulares = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    const result: any[] = [];
    const codigosVistos = new Set<string>();
    let counter = 1;

    // A. Módulos del perfil del estudiante
    rawDiplomados.forEach((d: any) => {
      (d.modulos || []).forEach((m: any) => {
        const nota = m.nota !== undefined ? Number(m.nota) : (m.completado ? 18 : 0);
        const estaAprobado = Boolean(m.completado) || Boolean(m.codigo_cert) || (nota >= 12 && m.rendido);
        if (estaAprobado) {
          const modNombre = m.nombre ? `${m.codigo || 'Módulo'}: ${m.nombre}` : (m.codigo || `Módulo ${counter}`);
          const cod = m.codigo_cert || `EDUMIN-MOD-${perfilEstudiante.dni_ce || '71234567'}-${counter}`;

          // Vincular con certificación emitida en base de datos si existe
          const certDb = certificadosEmitidosDb.find(c => 
            c.codigo_verificacion === cod || 
            (c.tipo === 'MODULAR' && (
              c.modulo_titulo?.toLowerCase().includes((m.nombre || '').toLowerCase()) ||
              (m.nombre && (m.nombre || '').toLowerCase().includes(c.modulo_titulo?.toLowerCase() || ''))
            ))
          );

          const codFinal = certDb?.codigo_verificacion || cod;
          codigosVistos.add(codFinal);
          if (m.nombre) codigosVistos.add(m.nombre.toLowerCase());

          result.push({
            id: counter++,
            modulo: modNombre,
            moduloNombreSolo: m.nombre || m.codigo,
            diplomado: d.titulo,
            nota: certDb?.nota_final !== undefined && certDb.nota_final !== null ? Number(certDb.nota_final) : nota,
            horas: certDb?.horas_lectivas || m.horas || '108 horas académicas',
            modelo_id: certDb?.plantilla_snapshot?.modelo_id || (m as any).modelo_id || 'mod-avanza-mod',
            fecha: certDb?.fecha_emision ? String(certDb.fecha_emision) : (m.fecha || '15/01/2026'),
            codigo: codFinal
          });
        }
      });
    });

    // B. Añadir cualquier certificación modular oficial emitida en BD que no estuviera ya listada
    certificadosEmitidosDb.forEach((c: any) => {
      if (c.tipo === 'MODULAR' && !codigosVistos.has(c.codigo_verificacion)) {
        codigosVistos.add(c.codigo_verificacion);
        result.push({
          id: counter++,
          modulo: c.modulo_titulo?.startsWith('Módulo') ? c.modulo_titulo : `Módulo: ${c.modulo_titulo}`,
          moduloNombreSolo: c.modulo_titulo,
          diplomado: c.programa_titulo,
          nota: Number(c.nota_final) || 16,
          horas: c.horas_lectivas || '108 horas académicas',
          modelo_id: c.plantilla_snapshot?.modelo_id || 'mod-avanza-mod',
          fecha: c.fecha_emision ? String(c.fecha_emision) : '15/01/2026',
          codigo: c.codigo_verificacion
        });
      }
    });

    return result;
  }, [perfilEstudiante, certificadosEmitidosDb]);

  // Agrupación de modulares por diplomado
  const modularesPorDiplomado = useMemo(() => {
    return certificadosModulares.reduce((acc: Record<string, any[]>, cert: any) => {
      if (!acc[cert.diplomado]) {
        acc[cert.diplomado] = [];
      }
      acc[cert.diplomado].push(cert);
      return acc;
    }, {});
  }, [certificadosModulares]);

  // 3. CERTIFICADOS DE CURSOS Y TALLERES DINÁMICOS DESDE SUPABASE
  const certificadosCursos = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawCursos = parseCursosFromProfile(perfilEstudiante);
    const result: any[] = [];
    const codigosVistos = new Set<string>();

    rawCursos
      .filter((c: any) => {
        const esCompletado = Boolean(c.completado) || Number(c.avance) >= 100 || Boolean(c.codigo_cert);
        if (!esCompletado) return false;

        const codNormalizado = (c.codigo || c.id || '').toUpperCase();
        const confClaveCurso = `${codNormalizado}_Examen del curso`;
        const confClaveTaller = `${codNormalizado}_Examen del taller`;
        const configItem = (configuracionExamenesJson as Record<string, any>)[confClaveCurso] 
          || (configuracionExamenesJson as Record<string, any>)[confClaveTaller];
        const noAplicaExamen = configItem?.aplica_examen === false;

        if (noAplicaExamen || c.nota === undefined || c.nota === null || c.codigo_cert) {
          return true;
        }

        return Number(c.nota) >= 12;
      })
      .forEach((c: any, idx: number) => {
        const certDb = certificadosEmitidosDb.find(cd => 
          (c.codigo_cert && cd.codigo_verificacion === c.codigo_cert) ||
          ((cd.tipo === 'CURSO' || cd.tipo === 'TALLER') && cd.programa_titulo?.toLowerCase() === c.titulo?.toLowerCase())
        );

        const esTaller = (c.tipo === 'TALLER' || c.id?.toLowerCase().startsWith('tal-') || c.codigo?.toLowerCase().startsWith('tal-') || c.titulo?.toUpperCase().includes('TALLER') || certDb?.tipo === 'TALLER');
        const codFinal = certDb?.codigo_verificacion || c.codigo_cert || c.codigo || `EDUMIN-CUR-${perfilEstudiante.dni_ce || '71234567'}-${idx + 1}`;

        codigosVistos.add(codFinal);
        if (c.titulo) codigosVistos.add(c.titulo.toLowerCase());

        result.push({
          id: c.id || `cur-${idx + 1}`,
          titulo: c.titulo,
          tipo: (esTaller ? 'Taller' : 'Curso') as 'Curso' | 'Taller',
          horas: certDb?.horas_lectivas || c.horas || (esTaller ? '16 horas académicas' : '24 horas académicas'),
          modelo_id: certDb?.plantilla_snapshot?.modelo_id || (c as any).modelo_id || 'mod-226455',
          fecha: certDb?.fecha_emision ? String(certDb.fecha_emision) : (c.fecha || '18/02/2026'),
          nota: typeof certDb?.nota_final === 'number' && certDb.nota_final > 0 
            ? Number(certDb.nota_final) 
            : (typeof c.nota === 'number' && c.nota > 0 ? Number(c.nota) : undefined),
          codigo: codFinal
        });
      });

    // Añadir certificaciones de cursos o talleres emitidas en BD que no aparecían en el JSON
    certificadosEmitidosDb.forEach((cd: any, idx: number) => {
      if ((cd.tipo === 'CURSO' || cd.tipo === 'TALLER') && !codigosVistos.has(cd.codigo_verificacion) && !codigosVistos.has(cd.programa_titulo?.toLowerCase())) {
        codigosVistos.add(cd.codigo_verificacion);
        const esTaller = cd.tipo === 'TALLER' || cd.programa_titulo?.toUpperCase().includes('TALLER');
        result.push({
          id: cd.id || `db-cur-${idx + 1}`,
          titulo: cd.programa_titulo,
          tipo: (esTaller ? 'Taller' : 'Curso') as 'Curso' | 'Taller',
          horas: cd.horas_lectivas || (esTaller ? '16 horas académicas' : '24 horas académicas'),
          modelo_id: cd.plantilla_snapshot?.modelo_id || 'mod-226455',
          fecha: cd.fecha_emision ? String(cd.fecha_emision) : '18/02/2026',
          nota: typeof cd.nota_final === 'number' && cd.nota_final > 0 ? Number(cd.nota_final) : undefined,
          codigo: cd.codigo_verificacion
        });
      }
    });

    return result;
  }, [perfilEstudiante, certificadosEmitidosDb]);

  const [diplomadoSeleccionado, setDiplomadoSeleccionado] = useState('');

  useEffect(() => {
    if (diplomadosProgreso.length > 0 && (!diplomadoSeleccionado || !diplomadosProgreso.some(d => d.titulo === diplomadoSeleccionado))) {
      setDiplomadoSeleccionado(diplomadosProgreso[0].titulo);
    }
  }, [diplomadosProgreso, diplomadoSeleccionado]);

  // Habilitación de Certificados Especiales
  const tieneDiplomaGeneral = diplomadosProgreso.some(d => d.completado);

  const abrirModal = (tipo: 'CIP' | 'MIAMI') => {
    setTipoCertificacion(tipo);
    setTerminosAceptados(false);
    setSolicitudEnviada(false);
    setModalAbierto(true);
  };

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminosAceptados) return;
    setSolicitudEnviada(true);

    try {
      await fetch('/api/admin/certificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoCertificacion,
          programa: diplomadoSeleccionado,
          dni: perfilEstudiante?.dni_ce
        })
      });
    } catch (err) {
      console.error('Error registrando solicitud de certificado CIP/Miami:', err);
    }

    setTimeout(() => {
      setModalAbierto(false);
      setSolicitudEnviada(false);
    }, 3000);
  };

  const abrirVistaPrevia = (certData: {
    titulo: string;
    subtitulo: string;
    categoria?: string;
    fecha: string;
    codigo: string;
    horas?: string;
    modelo_id?: string;
    nota?: number;
    tipo: 'Diplomado' | 'Modular' | 'Curso' | 'Taller';
  }) => {
    setCopiadoLink(false);
    setModalVistaPrevia({ abierto: true, ...certData });
  };

  const copiarLinkValidacion = () => {
    if (!modalVistaPrevia) return;
    const urlValidacion = generarUrlQRValidacion(modalVistaPrevia.codigo);
    navigator.clipboard.writeText(urlValidacion);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  const compartirLinkedIn = () => {
    if (!modalVistaPrevia) return;
    const urlValidacion = generarUrlQRValidacion(modalVistaPrevia.codigo);
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(modalVistaPrevia.titulo)}&organizationName=${encodeURIComponent('EDUMIN - Escuela de Especialización Minera')}&issueYear=2026&issueMonth=3&certUrl=${encodeURIComponent(urlValidacion)}`;
    window.open(url, '_blank');
  };

  const totalModularesCount = Object.values(modularesPorDiplomado).flat().length;
  const totalCursosCount = certificadosCursos.length;

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Encabezado Unificado */}
        <StudentPageHeader
          icon={Award}
          title="Mis certificados"
          subtitle="Visualiza en vista previa, descarga o comparte en LinkedIn tus certificaciones oficiales acreditadas."
        >
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 grid place-items-center">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Certificados Totales</span>
              <span className={`text-lg font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                {certificadosModulares.length + certificadosCursos.length} Emitidos
              </span>
            </div>
          </div>
        </StudentPageHeader>

        {/* NAVEGACIÓN POR PESTAÑAS (TABS) */}
        <div className="space-y-4 pt-2">
          <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" aria-label="Categorías de Certificados">
              {[
                { 
                  id: 'TODOS', 
                  label: 'Todos', 
                  icon: LayoutGrid, 
                  badge: diplomadosProgreso.length + totalModularesCount + totalCursosCount 
                },
                { 
                  id: 'DIPLOMAS', 
                  label: 'Diplomas Generales', 
                  icon: GraduationCap, 
                  badge: diplomadosProgreso.length 
                },
                { 
                  id: 'MODULARES', 
                  label: 'Certificados modulares', 
                  icon: FileText, 
                  badge: totalModularesCount 
                },
                { 
                  id: 'CONVENIOS', 
                  label: 'Certificados adicionales', 
                  icon: Globe, 
                  badge: 2 
                },
                { 
                  id: 'CURSOS_TALLERES', 
                  label: 'Certificados de cursos', 
                  icon: BookOpen, 
                  badge: totalCursosCount 
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const esActiva = tabActiva === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id as TabTipo)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                      esActiva
                        ? (esOscuro 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/30' 
                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20')
                        : (esOscuro 
                            ? 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800' 
                            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm')
                    }`}
                  >
                    <Icon className={`size-4 ${esActiva ? 'text-white' : (esOscuro ? 'text-slate-400' : 'text-slate-500')}`} />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                      esActiva 
                        ? 'bg-white/20 text-white' 
                        : (esOscuro ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                    }`}>
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ==========================================
            SECCIÓN 1: DIPLOMAS GENERALES DE DIPLOMADOS
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'DIPLOMAS') && (
          <div className="space-y-6">
            <div className="py-4 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Diplomas Generales de Diplomados
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {diplomadosProgreso.filter(d => d.completado).length} Habilitado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {diplomadosProgreso.map((dip) => (
                dip.completado ? (
                  /* DIPLOMA HABILITADO 100% */
                  <div key={dip.id} className="border border-indigo-500/30 rounded-3xl p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5" /> Diploma Desbloqueado (100%)
                        </span>
                        <span className="text-xs font-semibold text-amber-400">3 de 3 Módulos</span>
                      </div>
                      <h3 className="font-extrabold text-white text-base leading-snug">
                        {dip.titulo}
                      </h3>
                      <p className="text-xs text-indigo-200 mt-2">
                        Promedio Final: <strong className="text-white text-sm">{dip.promedio} (Aprobado)</strong>
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2.5">
                      <button 
                        onClick={() => abrirVistaPrevia({
                          titulo: dip.titulo,
                          subtitulo: 'DIPLOMA GENERAL DE ESPECIALIZACIÓN',
                          categoria: 'Diplomado Oficial EDUMIN',
                          fecha: '15/03/2026',
                          codigo: dip.codigo,
                          nota: dip.promedio,
                          tipo: 'Diplomado'
                        })}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Vista Previa
                      </button>

                      <button className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                        <Download className="w-3.5 h-3.5 text-indigo-600" /> Descargar
                      </button>

                      <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2.5 rounded-xl text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
                        <FileText className="w-3.5 h-3.5" /> Notas
                      </button>
                    </div>
                  </div>
                ) : (
                  /* DIPLOMA EN PROGRESO (BLOQUEADO) */
                  <div key={dip.id} className={`border rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between ${esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Lock className="size-3.5" /> Bloqueado (En Progreso)
                        </span>
                        <span className={`text-xs font-semibold ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                          {dip.modularesAprobados} de {dip.modularesTotales} Módulos
                        </span>
                      </div>
                      <h3 className={`font-bold text-base leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                        {dip.titulo}
                      </h3>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className={esOscuro ? 'text-slate-400' : 'text-slate-600'}>Avance de Módulos</span>
                          <span className="text-amber-500 font-bold">{Math.round((dip.modularesAprobados / dip.modularesTotales) * 100)}%</span>
                        </div>
                        <div className={`w-full h-2.5 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${(dip.modularesAprobados / dip.modularesTotales) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-amber-400/90 mt-6 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="size-4 shrink-0" />
                      Requiere aprobar {dip.modularesTotales - dip.modularesAprobados} módulo(s) adicional(es) para emitir el Diploma General.
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            SECCIÓN 2: CERTIFICADOS MODULARES
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'MODULARES') && (
          <div className="space-y-6">
            <div className="py-4 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Certificados modulares
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {totalModularesCount} Certificados
              </span>
            </div>

            {/* Contenido Modular con Acordeón Desplegable por Diplomado */}
            {Object.keys(modularesPorDiplomado).length === 0 ? (
              <div className={`text-center py-10 px-6 rounded-2xl border ${
                esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <FileText className="size-10 mx-auto text-indigo-400 mb-3 opacity-60" />
                <p className={`text-sm font-bold ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>
                  Aún no cuentas con certificados modulares emitidos
                </p>
                <p className="text-xs mt-1 max-w-md mx-auto">
                  Completa y aprueba las evaluaciones de los módulos de tu diplomado para obtener tu primera certificación modular (PAE).
                </p>
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                {Object.entries(modularesPorDiplomado).map(([diplomadoNombre, modulares]) => {
                  const estaAbierto = modularesAbiertos[diplomadoNombre] !== false;
                  return (
                    <div 
                      key={diplomadoNombre} 
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      {/* Cabecera desplegable de Diplomado */}
                      <button
                        onClick={() => toggleModularesDiplomado(diplomadoNombre)}
                        className={`w-full p-4 sm:p-5 flex items-center justify-between transition text-left cursor-pointer ${
                          estaAbierto ? 'border-b border-slate-200 dark:border-slate-800/60' : ''
                        } ${esOscuro ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-4 shrink-0 text-indigo-500" />
                          <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {diplomadoNombre}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {modulares.length} Módulo(s) Aprobado(s)
                          </span>
                          <div className="text-slate-400">
                            {estaAbierto ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </div>
                        </div>
                      </button>

                      {/* Lista de certificados del diplomado (Acordeón) */}
                      {estaAbierto && (
                        <div className="p-4 sm:p-5 overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${esOscuro ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                <th className="py-2.5 px-3">Módulo Aprobado</th>
                                <th className="py-2.5 px-3 text-center">Nota</th>
                                <th className="py-2.5 px-3">Fecha Emisión</th>
                                <th className="py-2.5 px-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y text-xs sm:text-sm ${esOscuro ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                              {modulares.map((cert) => (
                                <tr key={cert.id} className={`transition-colors ${esOscuro ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                                  <td className={`py-3.5 px-3 font-semibold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>{cert.modulo}</td>
                                  <td className="py-3.5 px-3 text-center">
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded-lg text-xs">
                                      {cert.nota}
                                    </span>
                                  </td>
                                  <td className={`py-3.5 px-3 text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>{cert.fecha}</td>
                                  <td className="py-3.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => abrirVistaPrevia({
                                          titulo: cert.modulo,
                                          subtitulo: cert.diplomado,
                                          categoria: 'Certificado Modular (PAE)',
                                          fecha: cert.fecha,
                                          codigo: cert.codigo,
                                          nota: cert.nota,
                                          tipo: 'Modular'
                                        })}
                                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                                        title="Vista Previa"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                                        <Download className="w-3.5 h-3.5" /> Descargar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SECCIÓN 3: CERTIFICADOS ADICIONALES
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'CONVENIOS') && (
          <div className="space-y-6">
            <div className="py-4 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Certificados adicionales
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                2 Convenios
              </span>
            </div>

            {/* Grid de Convenios (Sin etiqueta "Convenio...") */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Tarjeta CIP */}
              <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border transition-all ${
                tieneDiplomaGeneral 
                  ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800' 
                  : 'bg-slate-900/60 border-slate-800/80 opacity-80'
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {tieneDiplomaGeneral ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Habilitado
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="size-3" /> Bloqueado
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">Colegio de Ingenieros del Perú (CIP)</h3>
                  <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                    Acreditación respaldada institucionalmente por el CIP para validar tus horas lectivas y especialización profesional.
                  </p>
                  {!tieneDiplomaGeneral && (
                    <p className="text-xs text-amber-400 mt-3 font-medium flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      <AlertTriangle className="size-4 shrink-0" />
                      Se habilita únicamente al obtener tu Diploma General de Diplomado (3 de 3 módulos aprobados).
                    </p>
                  )}
                </div>

                <button
                  onClick={() => abrirModal('CIP')}
                  disabled={!tieneDiplomaGeneral}
                  className={`mt-6 w-full font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm ${
                    tieneDiplomaGeneral 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> 
                  {tieneDiplomaGeneral ? 'Solicitar Certificación CIP' : 'Requisito: Obten tu Diploma General'}
                </button>
              </div>

              {/* Tarjeta MIAMI */}
              <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border transition-all ${
                tieneDiplomaGeneral 
                  ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800' 
                  : 'bg-slate-900/60 border-slate-800/80 opacity-80'
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {tieneDiplomaGeneral ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Habilitado
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="size-3" /> Bloqueado
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">San Ignacio University (Miami, FL)</h3>
                  <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                    Certificación académica internacional expedida desde EE.UU. con validez global en tu programa de alta especialización.
                  </p>

                  {!tieneDiplomaGeneral && (
                    <p className="text-xs text-amber-400 mt-3 font-medium flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      <AlertTriangle className="size-4 shrink-0" />
                      Se habilita únicamente al obtener tu Diploma General de Diplomado (3 de 3 módulos aprobados).
                    </p>
                  )}
                </div>

                {tieneDiplomaGeneral ? (
                  <button
                    onClick={() => abrirModal('MIAMI')}
                    className="mt-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <Globe className="w-4 h-4" /> Solicitar Certificación MIAMI
                  </button>
                ) : (
                  <button
                    disabled
                    className="mt-6 w-full bg-slate-800 text-slate-500 font-bold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-not-allowed"
                  >
                    <Globe className="w-4 h-4" /> Requisito: Obten tu Diploma General
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            SECCIÓN 4: CERTIFICADOS DE CURSOS (UNIFICADO)
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'CURSOS_TALLERES') && (
          <div className="space-y-6">
            <div className="py-4 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Certificados de cursos
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {totalCursosCount} Certificados
              </span>
            </div>

            {/* Grid unificado de Cursos y Talleres sin división ni docentes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {certificadosCursos.map((curso) => (
                <div 
                  key={curso.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                    esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div>
                    <h4 className={`text-xs font-bold uppercase leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                      {curso.titulo}
                    </h4>

                    {/* Duración, Fecha y Nota en el mismo formato limpio */}
                    <div className={`text-[11px] mt-3 space-y-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                      <p>Duración: {curso.horas}</p>
                      <p>Fecha: {curso.fecha}</p>
                      <p>Nota: {curso.nota !== undefined ? `${curso.nota} (Aprobado)` : 'Aprobado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => abrirVistaPrevia({
                        titulo: curso.titulo,
                        subtitulo: curso.titulo,
                        fecha: curso.fecha,
                        horas: curso.horas,
                        codigo: curso.codigo,
                        nota: curso.nota,
                        tipo: curso.tipo as any
                      })}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer"
                      title="Vista Previa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const orientacionFinal = modeloActivo?.orientacion || (curso.tipo === 'Curso' || curso.tipo === 'Taller' ? 'vertical' : 'horizontal');
                          await descargarCertificadoA4Pdf({
                            tipo: curso.tipo === 'Taller' ? 'TALLER' : 'CURSO',
                            estudiante: nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN',
                            programa: curso.titulo,
                            modulo: undefined,
                            horas: curso.horas || '24 horas académicas',
                            fecha: curso.fecha,
                            codigo: curso.codigo,
                            orientacion: orientacionFinal,
                            imagenFondoUrl: modeloActivo?.imagenFondoUrl,
                            diseno: modeloActivo?.disenoCoordenadas,
                            incluyeQr: modeloActivo?.incluyeQr !== false
                          }, `Certificado_${curso.codigo || 'EDUMIN'}_A4.pdf`);
                        } catch (e) {
                          console.error('Error al descargar certificado:', e);
                          alert('Error al descargar el certificado en PDF.');
                        }
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL DE VISTA PREVIA DEL CERTIFICADO (DOCUMENTO INTERACTIVO FIDELIDAD A PLANTILLA MAESTRA A4) */}
        {modalVistaPrevia?.abierto && (() => {
          const orientacionFinal = modeloActivo?.orientacion || (modalVistaPrevia.tipo === 'Curso' || modalVistaPrevia.tipo === 'Taller' ? 'vertical' : 'horizontal');
          const esVerticalModal = orientacionFinal === 'vertical';

          return (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setModalVistaPrevia(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`rounded-3xl w-full ${esVerticalModal ? 'max-w-xl' : 'max-w-4xl'} p-5 sm:p-7 shadow-2xl relative border space-y-4 my-auto max-h-[96vh] flex flex-col justify-between ${
                  esOscuro ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                {/* Cabecera compacta y limpia */}
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {modalVistaPrevia.tipo === 'Diplomado' ? 'Diploma Oficial' : modalVistaPrevia.tipo === 'Modular' ? 'Certificado Modular' : (modalVistaPrevia.tipo === 'Taller' ? 'Certificado de Taller' : 'Certificado de Curso')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      CÓD.: {modalVistaPrevia.codigo}
                    </span>
                  </div>

                  <button 
                    onClick={() => setModalVistaPrevia(null)} 
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                    title="Cerrar (clic afuera o botón)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* CANVAS DIPLOMA/CERTIFICADO OFICIAL RESPONSIVO HORIZONTAL / VERTICAL */}
                <div className="p-2 sm:p-4 bg-slate-950/90 rounded-2xl flex items-center justify-center overflow-hidden my-auto">
                  <div className={`w-full flex items-center justify-center ${esVerticalModal ? 'max-w-md' : 'max-w-3xl'}`}>
                    <AvanzaCertificateRenderer
                      tipo={modalVistaPrevia.tipo === 'Diplomado' ? 'DIPLOMA' : (modalVistaPrevia.tipo === 'Modular' ? 'MODULAR' : (modalVistaPrevia.tipo === 'Taller' ? 'TALLER' : 'CURSO'))}
                      orientacion={orientacionFinal}
                      estudiante={nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN'}
                      programa={modalVistaPrevia.tipo === 'Modular' ? (modalVistaPrevia.subtitulo || modalVistaPrevia.titulo) : modalVistaPrevia.titulo}
                      modulo={modalVistaPrevia.tipo === 'Modular' ? modalVistaPrevia.titulo : undefined}
                      horas={modalVistaPrevia.horas || (modalVistaPrevia.tipo === 'Diplomado' ? '325 horas académicas y 13 créditos académicos' : (modalVistaPrevia.tipo === 'Modular' ? '108 horas académicas' : '24 horas académicas'))}
                      fecha={modalVistaPrevia.fecha}
                      codigo={modalVistaPrevia.codigo}
                      imagenFondoUrl={modeloActivo?.imagenFondoUrl}
                      diseno={modeloActivo?.disenoCoordenadas}
                      incluyeQr={modeloActivo?.incluyeQr !== false}
                    />
                  </div>
                </div>

                {/* ACCIONES DEL MODAL DE VISTA PREVIA */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    onClick={copiarLinkValidacion}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                      copiadoLink 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : (esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                    }`}
                  >
                    {copiadoLink ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copiadoLink ? '¡Enlace copiado!' : 'Copiar enlace de validación'}
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={compartirLinkedIn}
                      className="flex-1 sm:flex-initial bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Share2 className="size-4" /> Añadir a LinkedIn
                    </button>

                    <button 
                      onClick={async () => {
                        try {
                          await descargarCertificadoA4Pdf({
                            tipo: modalVistaPrevia.tipo === 'Diplomado' ? 'DIPLOMA' : (modalVistaPrevia.tipo === 'Modular' ? 'MODULAR' : (modalVistaPrevia.tipo === 'Taller' ? 'TALLER' : 'CURSO')),
                            estudiante: nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN',
                            programa: modalVistaPrevia.tipo === 'Modular' ? (modalVistaPrevia.subtitulo || modalVistaPrevia.titulo) : modalVistaPrevia.titulo,
                            modulo: modalVistaPrevia.tipo === 'Modular' ? modalVistaPrevia.titulo : undefined,
                            horas: modalVistaPrevia.horas || (modalVistaPrevia.tipo === 'Diplomado' ? '325 horas académicas y 13 créditos académicos' : (modalVistaPrevia.tipo === 'Modular' ? '108 horas académicas' : '24 horas académicas')),
                            fecha: modalVistaPrevia.fecha,
                            codigo: modalVistaPrevia.codigo || 'HNYNXT2',
                            orientacion: orientacionFinal,
                            imagenFondoUrl: modeloActivo?.imagenFondoUrl,
                            diseno: modeloActivo?.disenoCoordenadas,
                            incluyeQr: modeloActivo?.incluyeQr !== false
                          }, `Certificado_${modalVistaPrevia.codigo || 'EDUMIN'}_A4.pdf`);
                        } catch (e) {
                          console.error('Error al descargar certificado:', e);
                          alert('Error al descargar el certificado en PDF.');
                        }
                      }}
                      className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Download className="size-4" /> Descargar PDF
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* MODAL DE VALIDACIÓN UNIFICADO (CIP / MIAMI) */}
        {modalAbierto && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalAbierto(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl w-full max-w-lg p-8 shadow-2xl relative border ${esOscuro ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'}`}
            >
              <button 
                onClick={() => setModalAbierto(false)} 
                aria-label="Cerrar modal"
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-200 font-bold p-1 rounded-lg cursor-pointer"
              >
                <X className="size-5" />
              </button>

              {solicitudEnviada ? (
                <div className="text-center py-8">
                  <div className="mx-auto size-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Solicitud de {tipoCertificacion} Enviada</h3>
                  <p className={`text-sm ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>Tus datos de verificación han sido ingresados al sistema para su trámite institucional.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 grid place-items-center shrink-0">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Reclamar {tipoCertificacion === 'CIP' ? 'Certificación CIP' : 'Certificación MIAMI'}</h3>
                      <p className="text-xs text-amber-500 font-semibold">Verifica tu información antes de enviar el formato.</p>
                    </div>
                  </div>

                  <form onSubmit={enviarSolicitud} className="space-y-4 mt-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>Nombres y Apellidos</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={nombreEstudianteCompleto} 
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm cursor-not-allowed ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>Teléfono</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={perfilEstudiante?.telefono || '987654321'} 
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm cursor-not-allowed ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>Correo Electrónico</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={perfilEstudiante?.email || 'estudiante@edumin.pe'} 
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm cursor-not-allowed ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>Diplomado Aplicado</label>
                      {paqueteUsuario === 'ILIMITADO' || diplomadosProgreso.length > 1 ? (
                        <select
                          value={diplomadoSeleccionado}
                          onChange={(e) => setDiplomadoSeleccionado(e.target.value)}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        >
                          {diplomadosProgreso.map((dip: any) => (
                            <option key={dip.id} value={dip.titulo}>{dip.titulo}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          readOnly 
                          value={diplomadosProgreso[0]?.titulo || 'GEOMETALURGIA'} 
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm cursor-not-allowed ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                        />
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          required
                          checked={terminosAceptados}
                          onChange={(e) => setTerminosAceptados(e.target.checked)}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}>
                          Confirmo que mis datos están escritos correctamente (incluyendo tildes) y asumo la responsabilidad sobre la emisión institucional.
                        </span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={!terminosAceptados}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2 text-sm cursor-pointer"
                    >
                      Enviar Solicitud a Secretaría
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

      </div>



    </main>
  );
}