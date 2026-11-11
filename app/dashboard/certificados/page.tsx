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
  GraduationCap, 
  Lock, 
  X,
  Eye,
  Share2,
  Copy,
  Check,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';
import { parseDiplomadosFromProfile, parseCursosFromProfile, esCursoTaller } from '@/lib/utils/profileParser';
import { evaluarReglasCertificados, parseFechaCertificadoMs } from '@/lib/utils/credits';
import configuracionExamenesJson from '@/lib/data/configuracion_examenes.json';
import AvanzaCertificateRenderer from '@/components/certificates/AvanzaCertificateRenderer';
import { generarUrlQRValidacion } from '@/lib/utils/certificateUtils';
import { descargarCertificadoA4Pdf } from '@/lib/utils/certificatePdf';

function obtenerConfigNotaExamen(codigoProg?: string, modulo?: string) {
  const codNorm = String(codigoProg || '').trim().toUpperCase();
  const modNorm = String(modulo || '').trim().toLowerCase().replace(/ó/g, 'o');
  const items = Object.values(configuracionExamenesJson as Record<string, any>);
  const match =
    (codNorm && modNorm
      ? items.find(
          (i: any) =>
            String(i.codigo_programa || '').toUpperCase() === codNorm &&
            String(i.modulo || '').trim().toLowerCase().replace(/ó/g, 'o') === modNorm
        )
      : null) ||
    (codNorm
      ? items.find((i: any) => String(i.codigo_programa || '').toUpperCase() === codNorm)
      : null);

  const esTaller = codNorm.startsWith('TAL-');
  return {
    aplicaExamen: match?.aplica_examen !== undefined ? Boolean(match.aplica_examen) : !esTaller,
    notaMinima: Number(match?.nota_minima ?? 12)
  };
}

function esModuloAprobadoParaCertificado(dip: any, mod: any, mIdx: number): { aprobado: boolean; nota: number } {
  const modClave = mod.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
  const { aplicaExamen, notaMinima } = obtenerConfigNotaExamen(dip.codigo || dip.slug, modClave);
  const tieneNotaNumerica = mod.nota !== undefined && mod.nota !== null && mod.nota !== '';
  const notaNum = tieneNotaNumerica ? Number(mod.nota) : 0;

  if (mod.codigo_cert) {
    return { aprobado: true, nota: notaNum > 0 ? notaNum : 18 };
  }
  if (!aplicaExamen) {
    const ok = Boolean(mod.completado);
    return { aprobado: ok, nota: notaNum > 0 ? notaNum : 18 };
  }
  if (tieneNotaNumerica) {
    return { aprobado: notaNum >= notaMinima, nota: notaNum };
  }
  return { aprobado: Boolean(mod.completado), nota: mod.completado ? 18 : 0 };
}

export default function CertificadosPage() {
  const { esOscuro } = useTheme();

  // Perfil real del estudiante y estado de créditos/cuotas desde Supabase
  const [perfilEstudiante, setPerfilEstudiante] = useState<any>(null);
  const [eduminCredits, setEduminCredits] = useState<any>(null);
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
          if (data.eduminCredits) {
            setEduminCredits(data.eduminCredits);
          }
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

  // Resolución dinámica de superplantilla/modelo para vista previa o descarga directa
  const resolverModeloParaCertificado = useMemo(() => {
    return (certParams: {
      tipo: 'Diplomado' | 'Modular' | 'Curso' | 'Taller';
      titulo: string;
      codigo?: string;
      horas?: string;
      modelo_id?: string;
    }) => {
      const tipoEsperado = certParams.tipo === 'Diplomado'
        ? 'DIPLOMA'
        : certParams.tipo === 'Modular'
          ? 'MODULAR'
          : (certParams.tipo === 'Taller' ? 'TALLER' : 'CURSO');

      // 1. Buscar coincidencia en BD de certificados emitidos
      let certDb: any = null;
      if (certificadosEmitidosDb.length > 0) {
        certDb = certificadosEmitidosDb.find((c: any) => {
          if (certParams.codigo && c.codigo_verificacion === certParams.codigo) return true;
          if (certParams.tipo === 'Modular') {
            return c.tipo === 'MODULAR' && (
              c.modulo_titulo?.toLowerCase().includes(certParams.titulo.toLowerCase()) ||
              certParams.titulo.toLowerCase().includes(c.modulo_titulo?.toLowerCase() || '')
            );
          }
          if (c.tipo === tipoEsperado || (tipoEsperado === 'CURSO' && c.tipo === 'TALLER') || (tipoEsperado === 'TALLER' && c.tipo === 'CURSO')) {
            return c.programa_titulo?.toLowerCase() === certParams.titulo.toLowerCase();
          }
          return false;
        });
      }

      // 2. Buscar superplantilla configurada por el Administrador en Supabase
      const modeloIdBuscado = certParams.modelo_id || certDb?.plantilla_snapshot?.modelo_id || certDb?.modelo_id;
      let modeloSuperplantilla = (modelosCertificados || []).find((m: any) => m.id === modeloIdBuscado);

      if (!modeloSuperplantilla && modelosCertificados && modelosCertificados.length > 0) {
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
        horas: certParams.horas || certDb?.horas_lectivas || modeloSuperplantilla?.horas || certDb?.plantilla_snapshot?.horas
      };
    };
  }, [modelosCertificados, certificadosEmitidosDb]);

  const modeloActivo = useMemo(() => {
    if (!modalVistaPrevia) return null;
    return resolverModeloParaCertificado(modalVistaPrevia);
  }, [modalVistaPrevia, resolverModeloParaCertificado]);

  // Nombre completo del estudiante desde Supabase
  const nombreEstudianteCompleto = perfilEstudiante
    ? `${perfilEstudiante.nombres || ''} ${perfilEstudiante.apellidos || ''}`.trim()
    : 'Estudiante EDUMIN';

  const paqueteUsuario = perfilEstudiante?.paquete_adquirido || 'COMPLETO';

  // Reglas financieras centralizadas para emisión de certificados (cuotas pagadas vs saldo pendiente)
  const reglasCertificados = useMemo(() => {
    return evaluarReglasCertificados({
      cuotasPagadas: eduminCredits?.cuotasPagadas ?? perfilEstudiante?.cuotas_pagadas ?? 0,
      cuotasTotales: eduminCredits?.cuotasTotales ?? perfilEstudiante?.cuotas_totales ?? 3,
      tipoPago: perfilEstudiante?.tipo_pago,
      esContado: eduminCredits?.esContado
    });
  }, [perfilEstudiante, eduminCredits]);

  // 1. DIPLOMAS GENERALES DINÁMICOS DESDE SUPABASE
  const diplomadosProgreso = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    return rawDiplomados.map((d: any, idx: number) => {
      const modulos = d.modulos || [];
      const evalModulos: { aprobado: boolean; nota: number }[] = modulos.map((m: any, mIdx: number) =>
        esModuloAprobadoParaCertificado(d, m, mIdx)
      );
      const modulosAprobadosEval = evalModulos.filter((e) => e.aprobado);
      const modularesAprobados = modulosAprobadosEval.length;
      const modularesTotales = Math.max(3, modulos.length || 3);
      const sumaNotas = modulosAprobadosEval.reduce((sum, e) => sum + e.nota, 0);
      const promedio = modularesAprobados > 0 ? Number((sumaNotas / modularesAprobados).toFixed(1)) : 0;

      // Buscar si ya tiene certificado oficial de diploma en DB
      const certDbDip = certificadosEmitidosDb.find(c => c.tipo === 'DIPLOMA' && c.programa_titulo?.toLowerCase() === d.titulo?.toLowerCase());

      // REGLA ACADÉMICA + FINANCIERA:
      // 1) Aprobar todos los módulos del diplomado
      // 2) Tener los certificados modulares habilitados sin restricciones de pago
      const aprobadoAcademico = modularesAprobados >= modularesTotales || Boolean(certDbDip);
      const bloqueadoPorCuota = aprobadoAcademico && !reglasCertificados.sinRestriccionPago;
      const completado = aprobadoAcademico && reglasCertificados.sinRestriccionPago;

      return {
        id: d.id || d.slug || `dip-${idx + 1}`,
        titulo: d.titulo || 'Diplomado',
        modularesAprobados,
        modularesTotales,
        promedio: certDbDip?.nota_final !== undefined && certDbDip.nota_final !== null ? Number(certDbDip.nota_final) : (d.promedio || promedio),
        aprobadoAcademico,
        bloqueadoPorCuota,
        completado,
        horas: certDbDip?.horas_lectivas || d.horas || '325 horas académicas y 13 créditos académicos',
        modelo_id: certDbDip?.plantilla_snapshot?.modelo_id || (d as any).modelo_id || 'mod-avanza-dip',
        fecha: certDbDip?.fecha_emision ? String(certDbDip.fecha_emision) : (d.fecha || '15/03/2026'),
        codigo: certDbDip?.codigo_verificacion || d.codigo || `EDUMIN-DIP-${perfilEstudiante.dni_ce || '71234567'}-${(d.id || 'DIP').substring(0, 3).toUpperCase()}`
      };
    });
  }, [perfilEstudiante, certificadosEmitidosDb, reglasCertificados.sinRestriccionPago]);

  // 2. CERTIFICADOS MODULARES DINÁMICOS DESDE SUPABASE
  // Regla global: 1ra cuota = 1er modular aprobado, 2da cuota = 2do modular aprobado, ..., sin deuda = todos.
  const certificadosModulares = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    const acumulados: any[] = [];
    const codigosVistos = new Set<string>();
    let counter = 1;

    // A. Módulos aprobados del perfil del estudiante
    rawDiplomados.forEach((d: any, dIdx: number) => {
      (d.modulos || []).forEach((m: any, mIdx: number) => {
        const evalMod = esModuloAprobadoParaCertificado(d, m, mIdx);
        if (evalMod.aprobado) {
          const codModStd = m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
          const modNombre = m.nombre ? `${codModStd}: ${m.nombre}` : codModStd;
          const cod = m.codigo_cert || `EDUMIN-MOD-${perfilEstudiante.dni_ce || '71234567'}-${counter}`;

          const certDb = certificadosEmitidosDb.find(c =>
            c.codigo_verificacion === cod ||
            (c.tipo === 'MODULAR' && (
              c.modulo_titulo?.toLowerCase().includes((m.nombre || '').toLowerCase()) ||
              (m.nombre && (m.nombre || '').toLowerCase().includes(c.modulo_titulo?.toLowerCase() || ''))
            ))
          );

          const codFinal = certDb?.codigo_verificacion || cod;
          codigosVistos.add(codFinal);
          if (m.nombre) codigosVistos.add(`${String(d.titulo || '').toLowerCase()}::${m.nombre.toLowerCase()}`);

          const fechaOrdenRaw =
            (m as any).fecha_examen ||
            certDb?.created_at ||
            certDb?.fecha_emision ||
            m.fecha ||
            null;

          acumulados.push({
            id: counter++,
            diplomadoIdx: dIdx,
            moduloIdx: mIdx,
            modulo: modNombre,
            moduloNombreSolo: m.nombre || m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
            diplomado: d.titulo,
            nota: certDb?.nota_final !== undefined && certDb.nota_final !== null ? Number(certDb.nota_final) : evalMod.nota,
            horas: certDb?.horas_lectivas || m.horas || '108 horas académicas',
            modelo_id: certDb?.plantilla_snapshot?.modelo_id || (m as any).modelo_id || 'mod-avanza-mod',
            fecha: certDb?.fecha_emision ? String(certDb.fecha_emision) : (m.fecha || '15/01/2026'),
            fechaOrdenMs: parseFechaCertificadoMs(fechaOrdenRaw),
            codigo: codFinal
          });
        }
      });
    });

    // B. Añadir cualquier certificación modular oficial emitida en BD que no estuviera ya listada
    certificadosEmitidosDb.forEach((c: any) => {
      const claveModDb = `${String(c.programa_titulo || '').toLowerCase()}::${String(c.modulo_titulo || '').toLowerCase()}`;
      if (c.tipo === 'MODULAR' && !codigosVistos.has(c.codigo_verificacion) && !codigosVistos.has(claveModDb)) {
        codigosVistos.add(c.codigo_verificacion);
        acumulados.push({
          id: counter++,
          diplomadoIdx: 99,
          moduloIdx: counter,
          modulo: /^M[ÓO]DULO\b/i.test(c.modulo_titulo || '') ? c.modulo_titulo : `MÓDULO: ${c.modulo_titulo}`,
          moduloNombreSolo: c.modulo_titulo,
          diplomado: c.programa_titulo,
          nota: Number(c.nota_final) || 16,
          horas: c.horas_lectivas || '108 horas académicas',
          modelo_id: c.plantilla_snapshot?.modelo_id || 'mod-avanza-mod',
          fecha: c.fecha_emision ? String(c.fecha_emision) : '15/01/2026',
          fechaOrdenMs: parseFechaCertificadoMs(c.created_at || c.fecha_emision),
          codigo: c.codigo_verificacion
        });
      }
    });

    // Orden cronológico real (el 1er módulo terminado obtiene prioridad en cuota 1, 2do en cuota 2, etc.)
    const ordenadosPorFinalizacion = [...acumulados].sort((a, b) => {
      const msA = a.fechaOrdenMs ?? 0;
      const msB = b.fechaOrdenMs ?? 0;
      if (msA !== msB) return msA - msB;
      if (a.diplomadoIdx !== b.diplomadoIdx) return a.diplomadoIdx - b.diplomadoIdx;
      return a.moduloIdx - b.moduloIdx;
    });

    return ordenadosPorFinalizacion.map((item, rank) => {
      const habilitadoPorCuota =
        reglasCertificados.sinRestriccionPago || rank < reglasCertificados.limiteModularesPorCuota;
      return {
        ...item,
        ordenDesbloqueo: rank + 1,
        cuotaRequerida: rank + 1,
        bloqueadoPorCuota: !habilitadoPorCuota
      };
    });
  }, [perfilEstudiante, certificadosEmitidosDb, reglasCertificados.sinRestriccionPago, reglasCertificados.limiteModularesPorCuota]);

  // Agrupación de modulares por diplomado manteniendo orden del temario dentro de cada tabla
  const modularesPorDiplomado = useMemo(() => {
    const grouped = certificadosModulares.reduce((acc: Record<string, any[]>, cert: any) => {
      if (!acc[cert.diplomado]) {
        acc[cert.diplomado] = [];
      }
      acc[cert.diplomado].push(cert);
      return acc;
    }, {});
    Object.values(grouped).forEach((lista) => {
      lista.sort((a, b) => (a.moduloIdx ?? 0) - (b.moduloIdx ?? 0));
    });
    return grouped;
  }, [certificadosModulares]);

  // 3. CERTIFICADOS DE CURSOS Y TALLERES DINÁMICOS DESDE SUPABASE
  // Talleres de regalo: se habilitan al completarlos en cualquier momento sin bloqueo por cuotas.
  const certificadosCursos = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawCursos = parseCursosFromProfile(perfilEstudiante);
    const result: any[] = [];
    const codigosVistos = new Set<string>();

    rawCursos
      .filter((c: any) => {
        const esCompletadoLecciones = Boolean(c.completado) || Number(c.avance) >= 100 || Boolean(c.codigo_cert);
        if (!esCompletadoLecciones) return false;

        if (c.codigo_cert) return true;

        const { aplicaExamen, notaMinima } = obtenerConfigNotaExamen(c.codigo || c.id);
        if (!aplicaExamen) return true;

        if (c.nota !== undefined && c.nota !== null && c.nota !== '') {
          return Number(c.nota) >= notaMinima;
        }
        return Boolean(c.completado);
      })
      .forEach((c: any, idx: number) => {
        const certDb = certificadosEmitidosDb.find(cd =>
          (c.codigo_cert && cd.codigo_verificacion === c.codigo_cert) ||
          ((cd.tipo === 'CURSO' || cd.tipo === 'TALLER') && cd.programa_titulo?.toLowerCase() === c.titulo?.toLowerCase())
        );

        const esTaller = esCursoTaller(c) || certDb?.tipo === 'TALLER';
        const codFinal = certDb?.codigo_verificacion || c.codigo_cert || c.codigo || `EDUMIN-CUR-${perfilEstudiante.dni_ce || '71234567'}-${idx + 1}`;

        codigosVistos.add(codFinal);
        if (c.titulo) codigosVistos.add(c.titulo.toLowerCase());

        result.push({
          id: c.id || `cur-${idx + 1}`,
          titulo: c.titulo,
          tipo: (esTaller ? 'Taller' : 'Curso') as 'Curso' | 'Taller',
          esRegalo: esTaller,
          horas: certDb?.horas_lectivas || c.horas || (esTaller ? '20 horas académicas' : '24 horas académicas'),
          modelo_id: certDb?.plantilla_snapshot?.modelo_id || (c as any).modelo_id || 'mod-226455',
          fecha: certDb?.fecha_emision ? String(certDb.fecha_emision) : (c.fecha || '18/02/2026'),
          nota: typeof certDb?.nota_final === 'number' && certDb.nota_final > 0
            ? Number(certDb.nota_final)
            : (typeof c.nota === 'number' && c.nota > 0 ? Number(c.nota) : undefined),
          codigo: codFinal,
          bloqueadoPorCuota: false
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
          esRegalo: esTaller,
          horas: cd.horas_lectivas || (esTaller ? '20 horas académicas' : '24 horas académicas'),
          modelo_id: cd.plantilla_snapshot?.modelo_id || 'mod-226455',
          fecha: cd.fecha_emision ? String(cd.fecha_emision) : '18/02/2026',
          nota: typeof cd.nota_final === 'number' && cd.nota_final > 0 ? Number(cd.nota_final) : undefined,
          codigo: cd.codigo_verificacion,
          bloqueadoPorCuota: false
        });
      }
    });

    return result;
  }, [perfilEstudiante, certificadosEmitidosDb]);

  const descargarCertificadoDirecto = async (certParams: {
    tipo: 'Diplomado' | 'Modular' | 'Curso' | 'Taller';
    titulo: string;
    subtitulo?: string;
    horas?: string;
    fecha: string;
    codigo: string;
    modelo_id?: string;
  }) => {
    try {
      const modelo = resolverModeloParaCertificado(certParams);
      const tipoPdf =
        certParams.tipo === 'Diplomado'
          ? 'DIPLOMA'
          : certParams.tipo === 'Modular'
            ? 'MODULAR'
            : certParams.tipo === 'Taller'
              ? 'TALLER'
              : 'CURSO';
      const defaultHoras =
        certParams.tipo === 'Diplomado'
          ? '325 horas académicas y 13 créditos académicos'
          : certParams.tipo === 'Modular'
            ? '108 horas académicas'
            : '24 horas académicas';

      await descargarCertificadoA4Pdf(
        {
          tipo: tipoPdf,
          estudiante: nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN',
          programa: certParams.tipo === 'Modular' ? (certParams.subtitulo || certParams.titulo) : certParams.titulo,
          modulo: certParams.tipo === 'Modular' ? certParams.titulo : undefined,
          horas: certParams.horas || modelo.horas || defaultHoras,
          fecha: certParams.fecha,
          codigo: certParams.codigo,
          orientacion: modelo.orientacion,
          imagenFondoUrl: modelo.imagenFondoUrl,
          diseno: modelo.disenoCoordenadas,
          incluyeQr: modelo.incluyeQr !== false
        },
        `Certificado_${certParams.codigo || 'EDUMIN'}_A4.pdf`
      );
    } catch (e) {
      console.error('Error al descargar certificado:', e);
      alert('Error al descargar el certificado en PDF.');
    }
  };

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
  const modularesHabilitadosCount = certificadosModulares.filter(c => !c.bloqueadoPorCuota).length;
  const modularesBloqueadosCount = totalModularesCount - modularesHabilitadosCount;
  const totalCursosCount = certificadosCursos.length;
  const diplomasDesbloqueadosCount = diplomadosProgreso.filter(d => d.completado).length;
  const totalHabilitados = diplomasDesbloqueadosCount + modularesHabilitadosCount + totalCursosCount;

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
            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 grid place-items-center shrink-0">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Certificados Habilitados</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-lg font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  {totalHabilitados} Disponible(s)
                </span>
                {modularesBloqueadosCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 border border-purple-500/25">
                    {modularesBloqueadosCount} bloqueado(s) por cuota
                  </span>
                )}
              </div>
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
              {diplomadosProgreso.map((dip) => {
                const whatsappCuotaDipUrl = `https://wa.me/51984512809?text=${encodeURIComponent(
                  `Hola EDUMIN, ya aprobé los módulos de ${dip.titulo} y deseo orientación para pagar mi siguiente cuota y habilitar mi Diploma General.`
                )}`;

                if (dip.completado) {
                  /* DIPLOMA HABILITADO 100% */
                  return (
                    <div key={dip.id} className="border border-indigo-500/30 rounded-3xl p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5" /> Diploma Desbloqueado (100%)
                          </span>
                          <span className="text-xs font-semibold text-amber-400">
                            {dip.modularesAprobados} de {dip.modularesTotales} Módulos
                          </span>
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
                            fecha: dip.fecha || '15/03/2026',
                            horas: dip.horas,
                            codigo: dip.codigo,
                            modelo_id: dip.modelo_id,
                            nota: dip.promedio,
                            tipo: 'Diplomado'
                          })}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Vista Previa
                        </button>

                        <button
                          onClick={() => descargarCertificadoDirecto({
                            tipo: 'Diplomado',
                            titulo: dip.titulo,
                            horas: dip.horas,
                            fecha: dip.fecha || '15/03/2026',
                            codigo: dip.codigo,
                            modelo_id: dip.modelo_id
                          })}
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" /> Descargar
                        </button>
                      </div>
                    </div>
                  );
                }

                if (dip.bloqueadoPorCuota) {
                  /* DIPLOMA APROBADO ACADÉMICAMENTE, BLOQUEADO POR CUOTA PENDIENTE */
                  return (
                    <div key={dip.id} className={`border rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between ${esOscuro ? 'bg-slate-900/90 border-purple-500/30' : 'bg-white border-purple-200 shadow-sm'}`}>
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-600 border border-purple-400/30 text-white shadow-xs">
                            <Lock className="size-3.5" /> Bloqueado por cuota
                          </span>
                          <span className="text-xs font-bold text-emerald-500">
                            {dip.modularesAprobados} de {dip.modularesTotales} Módulos
                          </span>
                        </div>
                        <h3 className={`font-bold text-base leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                          {dip.titulo}
                        </h3>
                        <p className={`text-xs mt-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                          Promedio Final: <strong className={esOscuro ? 'text-white' : 'text-slate-900'}>{dip.promedio} (Aprobado)</strong>
                        </p>

                        <div className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed ${esOscuro ? 'bg-purple-950/30 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
                          Aprobaste todos los módulos del diplomado. El Diploma General se habilitará automáticamente al completar tus cuotas sin restricciones de pago ({reglasCertificados.cuotasPagadas} de {reglasCertificados.cuotasTotales} cuotas registradas).
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <a
                          href={whatsappCuotaDipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-600/20 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Pagar cuota</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                }

                /* DIPLOMA EN PROGRESO (FALTAN MÓDULOS POR APROBAR) */
                return (
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
                      Requiere aprobar {Math.max(1, dip.modularesTotales - dip.modularesAprobados)} módulo(s) adicional(es) para emitir el Diploma General.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            SECCIÓN 2: CERTIFICADOS MODULARES
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'MODULARES') && (
          <div className="space-y-6">
            <div className="py-4 px-1 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
              <div>
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  Certificados modulares
                </h2>
                {!reglasCertificados.sinRestriccionPago && totalModularesCount > 0 && (
                  <p className={`text-xs mt-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cuotas registradas: <strong className={esOscuro ? 'text-slate-200' : 'text-slate-700'}>{reglasCertificados.cuotasPagadas} de {reglasCertificados.cuotasTotales}</strong> · Tienes habilitado hasta <strong className={esOscuro ? 'text-slate-200' : 'text-slate-700'}>{reglasCertificados.limiteModularesPorCuota}</strong> certificado(s) modular(es) según el orden de aprobación.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {modularesBloqueadosCount > 0 && (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-600/15 text-purple-500 border border-purple-500/30 inline-flex items-center gap-1.5">
                    <Lock className="size-3.5" /> {modularesBloqueadosCount} Bloqueado(s) por cuota
                  </span>
                )}
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {modularesHabilitadosCount} / {totalModularesCount} Habilitado(s)
                </span>
              </div>
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
                              {modulares.map((cert) => {
                                const whatsappCuotaModUrl = `https://wa.me/51984512809?text=${encodeURIComponent(
                                  `Hola EDUMIN, aprobé "${cert.modulo}" en ${cert.diplomado} y deseo orientación para pagar mi cuota ${cert.cuotaRequerida} y habilitar este certificado modular.`
                                )}`;

                                return (
                                  <tr
                                    key={cert.id}
                                    className={`transition-colors ${
                                      cert.bloqueadoPorCuota
                                        ? esOscuro
                                          ? 'bg-purple-950/15 hover:bg-purple-950/25'
                                          : 'bg-purple-50/50 hover:bg-purple-50/80'
                                        : esOscuro
                                          ? 'hover:bg-slate-800/40'
                                          : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <td className={`py-3.5 px-3 font-semibold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                      <div>{cert.modulo}</div>
                                      {cert.bloqueadoPorCuota && (
                                        <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-500 dark:text-purple-400">
                                          <Lock className="size-3 shrink-0" />
                                          Bloqueado por cuota · Se habilita con tu cuota {cert.cuotaRequerida} de {reglasCertificados.cuotasTotales}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded-lg text-xs">
                                        {cert.nota}
                                      </span>
                                    </td>
                                    <td className={`py-3.5 px-3 text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>{cert.fecha}</td>
                                    <td className="py-3.5 px-3 text-right">
                                      {cert.bloqueadoPorCuota ? (
                                        <div className="flex items-center justify-end">
                                          <a
                                            href={whatsappCuotaModUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-600/20 cursor-pointer"
                                          >
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Pagar cuota</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={() => abrirVistaPrevia({
                                              titulo: cert.modulo,
                                              subtitulo: cert.diplomado,
                                              categoria: 'Certificado Modular (PAE)',
                                              fecha: cert.fecha,
                                              horas: cert.horas,
                                              codigo: cert.codigo,
                                              modelo_id: cert.modelo_id,
                                              nota: cert.nota,
                                              tipo: 'Modular'
                                            })}
                                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                                            title="Vista Previa"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => descargarCertificadoDirecto({
                                              tipo: 'Modular',
                                              titulo: cert.modulo,
                                              subtitulo: cert.diplomado,
                                              horas: cert.horas,
                                              fecha: cert.fecha,
                                              codigo: cert.codigo,
                                              modelo_id: cert.modelo_id
                                            })}
                                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                          >
                                            <Download className="w-3.5 h-3.5" /> Descargar
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
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
            {certificadosCursos.length === 0 ? (
              <div className={`text-center py-10 px-6 rounded-2xl border ${
                esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <BookOpen className="size-10 mx-auto text-emerald-400 mb-3 opacity-60" />
                <p className={`text-sm font-bold ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>
                  Aún no tienes certificados de cursos o talleres habilitados
                </p>
                <p className="text-xs mt-1 max-w-md mx-auto">
                  Completa tus cursos o talleres de regalo para habilitar automáticamente su certificado oficial.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {certificadosCursos.map((curso) => (
                  <div
                    key={curso.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                      esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            curso.esRegalo
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                          }`}
                        >
                          {curso.esRegalo ? 'Taller incluido' : 'Curso'}
                        </span>
                      </div>
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
                          modelo_id: curso.modelo_id,
                          nota: curso.nota,
                          tipo: curso.tipo as any
                        })}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer"
                        title="Vista Previa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => descargarCertificadoDirecto({
                          tipo: curso.tipo,
                          titulo: curso.titulo,
                          horas: curso.horas,
                          fecha: curso.fecha,
                          codigo: curso.codigo,
                          modelo_id: curso.modelo_id
                        })}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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