'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { parseDiplomadosFromProfile, parseCursosFromProfile, esCursoTaller } from '@/lib/utils/profileParser';
import { evaluarReglasCertificados, parseFechaCertificadoMs } from '@/lib/utils/credits';
import configuracionExamenesJson from '@/lib/data/configuracion_examenes.json';
import AvanzaCertificateRenderer from '@/components/certificates/AvanzaCertificateRenderer';
import { generarUrlQRValidacion, formatearNotaCertificado } from '@/lib/utils/certificateUtils';
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

function formatearFechaDDMMYYYY(fecha?: string | null): string {
  const raw = String(fecha || '').trim();
  if (!raw) return '';
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const slashYmdMatch = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashYmdMatch) {
    return `${slashYmdMatch[3]}/${slashYmdMatch[2]}/${slashYmdMatch[1]}`;
  }
  const dmyDashMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyDashMatch) {
    return `${dmyDashMatch[1]}/${dmyDashMatch[2]}/${dmyDashMatch[3]}`;
  }
  return raw;
}

function obtenerMetadatosTarjeta({
  modelo,
  horas,
  creditos,
  fecha,
  codigo,
  esDiploma = false,
  bloqueadoPorCuota = false,
}: {
  modelo: any;
  horas?: string | number | null;
  creditos?: string | number | null;
  fecha?: string | null;
  codigo?: string | null;
  esDiploma?: boolean;
  bloqueadoPorCuota?: boolean;
}): Array<{ label: string; value: string; mono?: boolean }> {
  const diseno = modelo?.disenoCoordenadas || {};
  const filas: Array<{ label: string; value: string; mono?: boolean }> = [];

  // 1. Duración (respeta el sufijo de la plantilla si existe, o usa 'horas académicas' por defecto)
  if (diseno?.horas?.visible !== false) {
    const rawHoras = String(horas ?? modelo?.horas ?? diseno?.horas?.horasValor ?? '').trim();
    const matchNumH = rawHoras.match(/\d+/);
    const sufijoH = String(diseno?.horas?.sufijo ?? diseno?.horas?.sufijoHoras ?? '').trim() || 'horas académicas';
    if (matchNumH) {
      filas.push({ label: 'Duración', value: `${matchNumH[0]} ${sufijoH}` });
    } else if (rawHoras) {
      filas.push({ label: 'Duración', value: rawHoras });
    }
  }

  // 2. Créditos (solo si el modelo tiene visible la variable de créditos)
  if (diseno?.creditos?.visible === true) {
    const rawCred = String(creditos ?? modelo?.creditos ?? diseno?.creditos?.creditosValor ?? '').trim();
    const matchNumC = rawCred.match(/\d+/);
    const numCred = matchNumC ? matchNumC[0] : (esDiploma ? '13' : '4');
    const sufijoC = String(diseno?.creditos?.sufijo ?? diseno?.creditos?.sufijoCreditos ?? '').trim() || 'créditos académicos';
    filas.push({ label: 'Créditos', value: `${numCred} ${sufijoC}` });
  }

  // 3. Fecha de emisión en formato DD/MM/YYYY
  if (diseno?.fecha?.visible !== false && fecha) {
    const fechaFmt = formatearFechaDDMMYYYY(fecha);
    if (fechaFmt) {
      filas.push({ label: 'Emisión', value: fechaFmt, mono: true });
    }
  }

  // 4. Código de verificación (oculto si el certificado está bloqueado por cuota)
  if (diseno?.codigo?.visible !== false && codigo) {
    filas.push({
      label: 'Código',
      value: bloqueadoPorCuota ? '•••••••' : String(codigo).trim(),
      mono: true,
    });
  }

  return filas;
}

/**
 * Cabecera visual de tarjeta con el certificado real usando AvanzaCertificateRenderer.
 * Se integra directamente en la parte superior de la tarjeta (sin bordes anidados),
 * mostrando la hoja A4 completa en su alto total tanto en horizontal como en vertical,
 * junto con su QR oficial real.
 */
function CertificadoMiniatura({
  tipo,
  orientacion = 'horizontal',
  estudiante,
  programa,
  modulo,
  horas,
  fecha,
  codigo,
  imagenFondoUrl,
  diseno,
  incluyeQr = true,
  bloqueadoPorCuota = false,
  onPreview,
  esOscuro = true,
}: {
  tipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'TALLER';
  orientacion?: 'horizontal' | 'vertical';
  estudiante: string;
  programa: string;
  modulo?: string | null;
  horas?: string;
  fecha?: string;
  codigo: string;
  imagenFondoUrl?: string | null;
  diseno?: React.ComponentProps<typeof AvanzaCertificateRenderer>['diseno'];
  incluyeQr?: boolean;
  bloqueadoPorCuota?: boolean;
  onPreview?: () => void;
  esOscuro?: boolean;
}) {
  const esVertical = orientacion === 'vertical';
  const tituloAccesible = modulo || programa;

  const contenido = (
    <div
      className={`relative w-full h-48 sm:h-52 border-b flex items-center justify-center p-3 overflow-hidden transition-colors ${
        bloqueadoPorCuota
          ? esOscuro
            ? 'bg-purple-950/20 border-purple-500/20'
            : 'bg-purple-50/70 border-purple-200/80'
          : esOscuro
            ? 'bg-slate-950/75 border-slate-800/90'
            : 'bg-slate-100/85 border-slate-200/80'
      }`}
    >
      {/* Hoja A4 completa centrada sobre el fondo superior de la tarjeta */}
      <div
        className={`pointer-events-none select-none h-full flex items-center justify-center ${
          esVertical ? 'aspect-[210/297]' : 'aspect-[297/210] max-w-full'
        } ${
          bloqueadoPorCuota
            ? 'blur-[2.5px] opacity-70 scale-[0.98]'
            : ''
        }`}
      >
        <AvanzaCertificateRenderer
          tipo={tipo}
          orientacion={orientacion}
          estudiante={estudiante}
          programa={programa}
          modulo={modulo}
          horas={horas}
          fecha={fecha}
          codigo={bloqueadoPorCuota ? 'EDUMIN-BLOQUEADO' : codigo}
          imagenFondoUrl={imagenFondoUrl}
          diseno={diseno}
          incluyeQr={bloqueadoPorCuota ? false : incluyeQr}
          className="!shadow-md !border-slate-200/70 !rounded-md"
        />
      </div>

      {/* Overlay si falta cuota */}
      {bloqueadoPorCuota && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-600/95 text-white shadow-lg border border-purple-300/30 backdrop-blur-xs">
            <Lock className="size-3 shrink-0" />
            Desbloquea con tu cuota
          </span>
        </div>
      )}
    </div>
  );

  if (onPreview && !bloqueadoPorCuota) {
    return (
      <button
        type="button"
        onClick={onPreview}
        className="w-full text-left cursor-pointer focus:outline-none block"
        title={`Vista previa de ${tituloAccesible}`}
      >
        {contenido}
      </button>
    );
  }

  return contenido;
}

export default function CertificadosPage() {
  const { esOscuro } = useTheme();

  // Perfil real del estudiante y estado de créditos/cuotas desde Supabase
  const [loading, setLoading] = useState<boolean>(true);
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
              try {
                const certRes = await fetch(`/api/admin/certificaciones?dni=${encodeURIComponent(dni)}`);
                if (certRes.ok) {
                  const certData = await certRes.json();
                  if (Array.isArray(certData.certificaciones)) {
                    setCertificadosEmitidosDb(certData.certificaciones);
                  }
                }
              } catch {
                // Continuar con datos del perfil
              }
            }
          }
        }
      } catch (e) {
        console.error('Error fetching student profile for certificates:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  // Navegación por pestañas (Tabs Navigation)
  type TabTipo = 'TODOS' | 'DIPLOMAS' | 'MODULARES' | 'CONVENIOS' | 'CURSOS_TALLERES';
  const [tabActiva, setTabActiva] = useState<TabTipo>('CURSOS_TALLERES');
  const tabInicialAplicadaRef = useRef(false);

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

      // 2. Buscar superplantilla/modelo de respaldo en caso el snapshot emitido no contenga un campo
      const snap = certDb?.plantilla_snapshot || null;
      const modeloIdBuscado = snap?.modelo_id || certDb?.modelo_id || certParams.modelo_id;
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

      // 3. Preservar SIEMPRE el snapshot congelado con el que se emitió el certificado;
      //    solo usar la superplantilla actual como respaldo si no existe snapshot previo.
      const orientacionDefecto = (tipoEsperado === 'CURSO' || tipoEsperado === 'TALLER') ? 'vertical' : 'horizontal';
      const orientacionFinal = snap?.orientacion || modeloSuperplantilla?.orientacion || orientacionDefecto;
      const fondoFinal = snap?.imagenFondoUrl !== undefined
        ? snap.imagenFondoUrl
        : (modeloSuperplantilla?.imagenFondoUrl ||
            (orientacionFinal === 'vertical'
              ? 'https://wluuomwkxywpfotbngwf.supabase.co/storage/v1/object/public/certificados/fondos/plantilla_1792606225470_g6hsm1j.webp'
              : (tipoEsperado === 'DIPLOMA'
                  ? '/assets/certificates/plantilla_avanza_diploma_bg.png'
                  : '/assets/certificates/plantilla_avanza_modular_bg.png')));

      const coordsFinal = snap?.disenoCoordenadas || modeloSuperplantilla?.disenoCoordenadas || null;
      const incluyeQrFinal = snap?.incluyeQr !== undefined
        ? snap.incluyeQr !== false
        : (modeloSuperplantilla?.incluyeQr !== false);

      return {
        ...(modeloSuperplantilla || {}),
        ...(snap || {}),
        orientacion: orientacionFinal,
        imagenFondoUrl: fondoFinal,
        disenoCoordenadas: coordsFinal,
        incluyeQr: incluyeQrFinal,
        horas: certParams.horas || certDb?.horas_lectivas || snap?.horas || modeloSuperplantilla?.horas
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

  // 1. DIPLOMAS GENERALES DINÁMICOS DESDE SUPABASE (prioridad: habilitados > bloqueados por cuota > en progreso)
  const diplomadosProgreso = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    const mapeados = rawDiplomados.map((d: any, idx: number) => {
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

    const prioridadPeso = (d: any) => (d.completado ? 0 : d.bloqueadoPorCuota ? 1 : 2);
    return [...mapeados].sort((a, b) => prioridadPeso(a) - prioridadPeso(b));
  }, [perfilEstudiante, certificadosEmitidosDb, reglasCertificados.sinRestriccionPago]);

  // 2. CERTIFICADOS MODULARES DINÁMICOS DESDE SUPABASE
  // Regla global: 1ra cuota = 1er modular aprobado, 2da cuota = 2do modular aprobado, ..., sin deuda = todos.
  const certificadosModulares = useMemo(() => {
    if (!perfilEstudiante) return [];

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    const acumulados: any[] = [];
    const codigosVistos = new Set<string>();
    let counter = 1;

    const normalizarProgKey = (titulo?: string) =>
      String(titulo || '')
        .toLowerCase()
        .replace(/^diplomado\s+(?:de\s+alta\s+especializaci[oó]n\s+)?en\s+/i, '')
        .trim();

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
          if (m.nombre) codigosVistos.add(`${normalizarProgKey(d.titulo)}::${m.nombre.toLowerCase().trim()}`);

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
      const claveModDb = `${normalizarProgKey(c.programa_titulo)}::${String(c.modulo_titulo || '').toLowerCase().trim()}`;
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

  // Agrupación de modulares por diplomado: habilitados primero, luego bloqueados por cuota y orden del temario
  const modularesPorDiplomado = useMemo(() => {
    const grouped = certificadosModulares.reduce((acc: Record<string, any[]>, cert: any) => {
      if (!acc[cert.diplomado]) {
        acc[cert.diplomado] = [];
      }
      acc[cert.diplomado].push(cert);
      return acc;
    }, {});
    Object.values(grouped).forEach((lista) => {
      lista.sort((a, b) => {
        const pA = a.bloqueadoPorCuota ? 1 : 0;
        const pB = b.bloqueadoPorCuota ? 1 : 0;
        if (pA !== pB) return pA - pB;
        return (a.moduloIdx ?? 0) - (b.moduloIdx ?? 0);
      });
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

    // Extraer año y mes reales de modalVistaPrevia.fecha (soporta DD/MM/YYYY y YYYY-MM-DD)
    const fechaFmt = formatearFechaDDMMYYYY(modalVistaPrevia.fecha);
    const matchFecha = fechaFmt.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const ahora = new Date();
    const issueMonth = matchFecha ? Number(matchFecha[2]) : (ahora.getMonth() + 1);
    const issueYear = matchFecha ? Number(matchFecha[3]) : ahora.getFullYear();

    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: modalVistaPrevia.titulo,
      organizationName: 'EDUMIN - Escuela de Especialización Minera',
      issueYear: String(issueYear),
      issueMonth: String(issueMonth),
      certId: modalVistaPrevia.codigo || '',
      certUrl: urlValidacion,
    });

    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const totalModularesCount = Object.values(modularesPorDiplomado).flat().length;
  const modularesHabilitadosCount = certificadosModulares.filter(c => !c.bloqueadoPorCuota).length;
  const modularesBloqueadosCount = totalModularesCount - modularesHabilitadosCount;
  const totalCursosCount = certificadosCursos.length;

  // Solo mostrar en Diplomas generales los diplomados con al menos 1 módulo aprobado o con diploma completo/habilitable
  const diplomadosVisibles = useMemo(
    () =>
      diplomadosProgreso.filter(
        d => d.completado || d.bloqueadoPorCuota || d.modularesAprobados >= 1
      ),
    [diplomadosProgreso]
  );

  // Orden dinámico de pestañas según el avance del estudiante ('Todos' siempre al final)
  const tabsOrdenadas = useMemo(() => {
    const tabDiplomas = {
      id: 'DIPLOMAS' as TabTipo,
      label: 'Diplomas generales',
      icon: GraduationCap,
      badge: diplomadosVisibles.length,
    };
    const tabModulares = {
      id: 'MODULARES' as TabTipo,
      label: 'Certificados modulares',
      icon: FileText,
      badge: totalModularesCount,
    };
    const tabCursos = {
      id: 'CURSOS_TALLERES' as TabTipo,
      label: 'Certificados de cursos',
      icon: BookOpen,
      badge: totalCursosCount,
    };
    const tabConvenios = {
      id: 'CONVENIOS' as TabTipo,
      label: 'Certificados adicionales',
      icon: Globe,
      badge: 2,
    };
    const tabTodos = {
      id: 'TODOS' as TabTipo,
      label: 'Todos',
      icon: LayoutGrid,
      badge: diplomadosVisibles.length + totalModularesCount + totalCursosCount,
    };

    const tieneDiplomaCompleto = diplomadosVisibles.some(
      d => d.completado || d.bloqueadoPorCuota
    );
    const tieneAlgunModular = totalModularesCount > 0 || diplomadosVisibles.length > 0;

    if (tieneDiplomaCompleto) {
      return [tabDiplomas, tabModulares, tabCursos, tabConvenios, tabTodos];
    }
    if (tieneAlgunModular) {
      return [tabModulares, tabDiplomas, tabCursos, tabConvenios, tabTodos];
    }
    return [tabCursos, tabModulares, tabDiplomas, tabConvenios, tabTodos];
  }, [diplomadosVisibles, totalModularesCount, totalCursosCount]);

  useEffect(() => {
    if (!loading && !tabInicialAplicadaRef.current && tabsOrdenadas.length > 0) {
      tabInicialAplicadaRef.current = true;
      setTabActiva(tabsOrdenadas[0].id);
    }
  }, [loading, tabsOrdenadas]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <DashboardLoader minHeight="min-h-full" />
      </div>
    );
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado Unificado */}
        <StudentPageHeader
          icon={Award}
          title="Mis certificados"
        />

        {/* NAVEGACIÓN POR PESTAÑAS (TABS) */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="flex items-center gap-2 overflow-x-auto pt-1.5 pb-4 px-1.5 scrollbar-none" aria-label="Categorías de Certificados">
            {tabsOrdenadas.map((tab) => {
              const Icon = tab.icon;
              const esActiva = tabActiva === tab.id;
              const esTabTodos = tab.id === 'TODOS';
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id as TabTipo)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    esActiva
                      ? esTabTodos
                        ? 'bg-slate-800 text-white dark:bg-slate-700 border-transparent shadow-sm shadow-slate-900/20'
                        : (esOscuro 
                            ? 'bg-indigo-600 text-white border-indigo-400/30 shadow-md shadow-indigo-600/20' 
                            : 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20')
                      : (esOscuro 
                          ? 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800' 
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 shadow-2xs')
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${esActiva ? 'text-white' : (esOscuro ? 'text-slate-400' : 'text-slate-500')}`} />
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

        {/* ==========================================
            SECCIÓN 1: DIPLOMAS GENERALES DE DIPLOMADOS
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'DIPLOMAS') && (
          <div className="space-y-5">
            <div className="pb-3 pt-1 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Diplomas generales
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {diplomadosVisibles.filter(d => d.completado).length} habilitado(s)
              </span>
            </div>

            {diplomadosVisibles.length === 0 ? (
              <div className={`text-center py-10 px-6 rounded-2xl border ${
                esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <GraduationCap className="size-10 mx-auto text-amber-400 mb-3 opacity-60" />
                <p className={`text-sm font-bold ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>
                  Aún no tienes diplomas generales en progreso
                </p>
                <p className="text-xs mt-1 max-w-md mx-auto">
                  Cuando apruebes tu primer módulo de un diplomado, aquí podrás ver el avance hacia tu Diploma general.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {diplomadosVisibles.map((dip) => {
                const whatsappCuotaDipUrl = `https://wa.me/51984512809?text=${encodeURIComponent(
                  `Hola EDUMIN, ya aprobé los módulos de ${dip.titulo} y deseo orientación para pagar mi siguiente cuota y habilitar mi Diploma General.`
                )}`;
                const modeloDip = resolverModeloParaCertificado({
                  tipo: 'Diplomado',
                  titulo: dip.titulo,
                  codigo: dip.codigo,
                  horas: dip.horas,
                  modelo_id: dip.modelo_id,
                });
                const abrirPreviewDip = () =>
                  abrirVistaPrevia({
                    titulo: dip.titulo,
                    subtitulo: 'DIPLOMA GENERAL DE ESPECIALIZACIÓN',
                    categoria: 'Diplomado Oficial EDUMIN',
                    fecha: dip.fecha || '15/03/2026',
                    horas: dip.horas,
                    codigo: dip.codigo,
                    modelo_id: dip.modelo_id,
                    nota: dip.promedio,
                    tipo: 'Diplomado',
                  });

                if (dip.completado) {
                  const filasDip = obtenerMetadatosTarjeta({
                    modelo: modeloDip,
                    horas: dip.horas,
                    fecha: dip.fecha || '15/03/2026',
                    codigo: dip.codigo,
                    esDiploma: true,
                  });
                  /* DIPLOMA HABILITADO 100% */
                  return (
                    <div key={dip.id} className="border border-indigo-500/30 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative flex flex-col justify-between shadow-lg">
                      <CertificadoMiniatura
                        tipo="DIPLOMA"
                        orientacion={modeloDip.orientacion}
                        estudiante={nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN'}
                        programa={dip.titulo}
                        horas={dip.horas}
                        fecha={dip.fecha || '15/03/2026'}
                        codigo={dip.codigo}
                        imagenFondoUrl={modeloDip.imagenFondoUrl}
                        diseno={modeloDip.disenoCoordenadas}
                        incluyeQr={modeloDip.incluyeQr !== false}
                        onPreview={abrirPreviewDip}
                        esOscuro={true}
                      />

                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="size-3 shrink-0" /> Habilitado
                            </span>
                            {formatearNotaCertificado(dip.promedio) && (
                              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-bold px-2.5 py-0.5 rounded-lg text-[11px] tabular-nums shrink-0">
                                Nota: {formatearNotaCertificado(dip.promedio)}
                              </span>
                            )}
                          </div>
                          <h3 title={dip.titulo} className="text-sm font-bold uppercase leading-snug line-clamp-2 min-h-[2.45rem] text-white">
                            {dip.titulo}
                          </h3>
                          <div className="text-[11px] text-indigo-200/80 space-y-1">
                            {filasDip.map((fila) => (
                              <p key={fila.label} className={fila.mono ? 'tabular-nums truncate' : 'truncate'}>
                                <span className="text-indigo-200/60">{fila.label}:</span> {fila.value}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={abrirPreviewDip}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer flex items-center justify-center"
                            title="Vista Previa"
                          >
                            <Eye className="w-4 h-4" />
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
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (dip.bloqueadoPorCuota) {
                  const filasDipBloq = obtenerMetadatosTarjeta({
                    modelo: modeloDip,
                    horas: dip.horas,
                    fecha: dip.fecha || '15/03/2026',
                    codigo: dip.codigo,
                    esDiploma: true,
                    bloqueadoPorCuota: true,
                  });
                  /* DIPLOMA APROBADO ACADÉMICAMENTE, BLOQUEADO POR CUOTA PENDIENTE */
                  return (
                    <div key={dip.id} className={`border rounded-2xl overflow-hidden relative flex flex-col justify-between ${esOscuro ? 'bg-slate-900/90 border-purple-500/30' : 'bg-white border-purple-200 shadow-sm'}`}>
                      <CertificadoMiniatura
                        tipo="DIPLOMA"
                        orientacion={modeloDip.orientacion}
                        estudiante={nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN'}
                        programa={dip.titulo}
                        horas={dip.horas}
                        fecha={dip.fecha || '15/03/2026'}
                        codigo={dip.codigo}
                        imagenFondoUrl={modeloDip.imagenFondoUrl}
                        diseno={modeloDip.disenoCoordenadas}
                        incluyeQr={modeloDip.incluyeQr !== false}
                        bloqueadoPorCuota={true}
                        esOscuro={esOscuro}
                      />

                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-600 border border-purple-400/30 text-white shadow-xs">
                              <Lock className="size-3 shrink-0" /> Bloqueado por cuota
                            </span>
                            {formatearNotaCertificado(dip.promedio) && (
                              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-lg text-[11px] tabular-nums shrink-0">
                                Nota: {formatearNotaCertificado(dip.promedio)}
                              </span>
                            )}
                          </div>
                          <h3 title={dip.titulo} className={`text-sm font-bold uppercase leading-snug line-clamp-2 min-h-[2.45rem] ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                            {dip.titulo}
                          </h3>
                          <div className={`text-[11px] space-y-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                            {filasDipBloq.map((fila) => (
                              <p key={fila.label} className={fila.mono ? 'tabular-nums truncate' : 'truncate'}>
                                {fila.label}: {fila.value}
                              </p>
                            ))}
                          </div>

                          <div className={`p-2.5 rounded-xl border text-[11px] leading-snug ${esOscuro ? 'bg-purple-950/30 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
                            Se habilitará al completar tus cuotas ({reglasCertificados.cuotasPagadas} de {reglasCertificados.cuotasTotales} cuotas registradas).
                          </div>
                        </div>

                        <a
                          href={whatsappCuotaDipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-xs font-bold px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-600/20 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pagar cuota</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                }

                /* DIPLOMA EN PROGRESO (FALTAN MÓDULOS POR APROBAR — SIN MINIATURA PARA EVITAR RUIDO VISUAL) */
                return (
                  <div key={dip.id} className={`border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between gap-4 ${esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                          <Lock className="size-3 shrink-0" /> En progreso
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border tabular-nums ${esOscuro ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {dip.modularesAprobados} / {dip.modularesTotales} módulos
                        </span>
                      </div>
                      <h3 title={dip.titulo} className={`text-sm font-bold uppercase leading-snug line-clamp-2 min-h-[2.45rem] ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                        {dip.titulo}
                      </h3>
                      
                      <div className="pt-1">
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

                    <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5 pt-2">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Aprueba {Math.max(1, dip.modularesTotales - dip.modularesAprobados)} módulo(s) adicional(es) para desbloquear tu Diploma.
                    </p>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SECCIÓN 2: CERTIFICADOS MODULARES
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'MODULARES') && (
          <div className="space-y-5">
            <div className="pb-3 pt-1 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Certificados modulares
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {modularesHabilitadosCount} / {totalModularesCount} habilitado(s)
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

                      {/* Tarjetas de certificados modulares del diplomado */}
                      {estaAbierto && (
                        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                          {modulares.map((cert) => {
                            const whatsappCuotaModUrl = `https://wa.me/51984512809?text=${encodeURIComponent(
                              `Hola EDUMIN, aprobé "${cert.modulo}" en ${cert.diplomado} y deseo orientación para pagar mi cuota ${cert.cuotaRequerida} y habilitar este certificado modular.`
                            )}`;
                            const modeloMod = resolverModeloParaCertificado({
                              tipo: 'Modular',
                              titulo: cert.modulo,
                              codigo: cert.codigo,
                              horas: cert.horas,
                              modelo_id: cert.modelo_id,
                            });
                            const abrirPreviewMod = () =>
                              abrirVistaPrevia({
                                titulo: cert.modulo,
                                subtitulo: cert.diplomado,
                                categoria: 'Certificado Modular (PAE)',
                                fecha: cert.fecha,
                                horas: cert.horas,
                                codigo: cert.codigo,
                                modelo_id: cert.modelo_id,
                                nota: cert.nota,
                                tipo: 'Modular',
                              });

                            const filasMod = obtenerMetadatosTarjeta({
                              modelo: modeloMod,
                              horas: cert.horas,
                              fecha: cert.fecha,
                              codigo: cert.codigo,
                              esDiploma: false,
                              bloqueadoPorCuota: Boolean(cert.bloqueadoPorCuota),
                            });

                            return (
                              <div
                                key={cert.id}
                                className={`rounded-2xl overflow-hidden border flex flex-col justify-between transition-all ${
                                  cert.bloqueadoPorCuota
                                    ? esOscuro
                                      ? 'bg-slate-950/60 border-purple-500/30'
                                      : 'bg-purple-50/30 border-purple-200'
                                    : esOscuro
                                      ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/40'
                                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                                }`}
                              >
                                <CertificadoMiniatura
                                  tipo="MODULAR"
                                  orientacion={modeloMod.orientacion}
                                  estudiante={nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN'}
                                  programa={cert.diplomado}
                                  modulo={cert.modulo}
                                  horas={cert.horas}
                                  fecha={cert.fecha}
                                  codigo={cert.codigo}
                                  imagenFondoUrl={modeloMod.imagenFondoUrl}
                                  diseno={modeloMod.disenoCoordenadas}
                                  incluyeQr={modeloMod.incluyeQr !== false}
                                  bloqueadoPorCuota={cert.bloqueadoPorCuota}
                                  onPreview={cert.bloqueadoPorCuota ? undefined : abrirPreviewMod}
                                  esOscuro={esOscuro}
                                />

                                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                      {cert.bloqueadoPorCuota ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-600 text-white border border-purple-400/30">
                                          <Lock className="size-3 shrink-0" /> Bloqueado por cuota
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                                          <CheckCircle2 className="size-3 shrink-0" /> Habilitado
                                        </span>
                                      )}

                                      {formatearNotaCertificado(cert.nota) && (
                                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-lg text-[11px] tabular-nums shrink-0">
                                          Nota: {formatearNotaCertificado(cert.nota)}
                                        </span>
                                      )}
                                    </div>

                                    <h3 title={cert.modulo} className={`text-sm font-bold uppercase leading-snug line-clamp-2 min-h-[2.45rem] ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                      {cert.modulo}
                                    </h3>

                                    <div className={`text-[11px] space-y-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {filasMod.map((fila) => (
                                        <p key={fila.label} className={fila.mono ? 'tabular-nums truncate' : 'truncate'}>
                                          {fila.label}: {fila.value}
                                        </p>
                                      ))}
                                    </div>

                                    {cert.bloqueadoPorCuota && (
                                      <p className={`text-[11px] font-semibold p-2.5 rounded-xl border leading-snug ${
                                        esOscuro
                                          ? 'bg-purple-950/30 border-purple-500/25 text-purple-300'
                                          : 'bg-purple-50 border-purple-200 text-purple-800'
                                      }`}>
                                        Se habilitará automáticamente con tu cuota {cert.cuotaRequerida} de {reglasCertificados.cuotasTotales}.
                                      </p>
                                    )}
                                  </div>

                                  {cert.bloqueadoPorCuota ? (
                                    <a
                                      href={whatsappCuotaModUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-600/20 cursor-pointer"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Pagar cuota</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        onClick={abrirPreviewMod}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer inline-flex items-center justify-center ${
                                          esOscuro
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                                        }`}
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
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Descargar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
            SECCIÓN 3: CURSOS Y TALLERES (UNIFICADO)
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'CURSOS_TALLERES') && (
          <div className="space-y-5">
            <div className="pb-3 pt-1 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Certificados de cursos
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {totalCursosCount} certificados
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
                {certificadosCursos.map((curso) => {
                  const modeloCurso = resolverModeloParaCertificado({
                    tipo: curso.tipo,
                    titulo: curso.titulo,
                    codigo: curso.codigo,
                    horas: curso.horas,
                    modelo_id: curso.modelo_id,
                  });
                  const abrirPreviewCurso = () =>
                    abrirVistaPrevia({
                      titulo: curso.titulo,
                      subtitulo: curso.titulo,
                      fecha: curso.fecha,
                      horas: curso.horas,
                      codigo: curso.codigo,
                      modelo_id: curso.modelo_id,
                      nota: curso.nota,
                      tipo: curso.tipo as any,
                    });

                  const filasCurso = obtenerMetadatosTarjeta({
                    modelo: modeloCurso,
                    horas: curso.horas,
                    fecha: curso.fecha,
                    codigo: curso.codigo,
                    esDiploma: false,
                  });

                  return (
                    <div
                      key={curso.id}
                      className={`rounded-2xl overflow-hidden border flex flex-col justify-between transition-all ${
                        esOscuro ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                      }`}
                    >
                      <CertificadoMiniatura
                        tipo={curso.tipo === 'Taller' ? 'TALLER' : 'CURSO'}
                        orientacion={modeloCurso.orientacion}
                        estudiante={nombreEstudianteCompleto || 'ESTUDIANTE EDUMIN'}
                        programa={curso.titulo}
                        horas={curso.horas}
                        fecha={curso.fecha}
                        codigo={curso.codigo}
                        imagenFondoUrl={modeloCurso.imagenFondoUrl}
                        diseno={modeloCurso.disenoCoordenadas}
                        incluyeQr={modeloCurso.incluyeQr !== false}
                        onPreview={abrirPreviewCurso}
                        esOscuro={esOscuro}
                      />

                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                              <CheckCircle2 className="size-3 shrink-0" /> Habilitado
                            </span>
                            {formatearNotaCertificado(curso.nota) && (
                              <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg tabular-nums shrink-0">
                                Nota: {formatearNotaCertificado(curso.nota)}
                              </span>
                            )}
                          </div>
                          <h3 title={curso.titulo} className={`text-sm font-bold uppercase leading-snug line-clamp-2 min-h-[2.45rem] ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                            {curso.titulo}
                          </h3>

                          {/* Metadatos dinámicos del certificado (Duración, Créditos, Emisión, Código) */}
                          <div className={`text-[11px] space-y-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                            {filasCurso.map((fila) => (
                              <p key={fila.label} className={fila.mono ? 'tabular-nums truncate' : 'truncate'}>
                                {fila.label}: {fila.value}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={abrirPreviewCurso}
                            className={`px-3 py-2.5 rounded-xl text-xs transition-colors border cursor-pointer flex items-center justify-center ${
                              esOscuro
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                            }`}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SECCIÓN 4: CERTIFICADOS ADICIONALES
           ========================================== */}
        {(tabActiva === 'TODOS' || tabActiva === 'CONVENIOS') && (
          <div className="space-y-5">
            <div className="pb-3 pt-1 px-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Certificados adicionales
              </h2>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                2 convenios
              </span>
            </div>

            {/* Grid de Convenios en 3 columnas (compactos cuando aún no tiene Diploma General) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              {/* Tarjeta CIP */}
              <div className={`shadow-lg relative overflow-hidden flex flex-col justify-between border transition-all ${
                tieneDiplomaGeneral 
                  ? 'rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white' 
                  : `rounded-2xl p-5 ${esOscuro ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'}`
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-3">
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
                  <h3 className={`font-bold leading-snug ${tieneDiplomaGeneral ? 'text-lg text-white' : `text-sm ${esOscuro ? 'text-white' : 'text-slate-900'}`}`}>
                    Colegio de Ingenieros del Perú (CIP)
                  </h3>
                  <p className={`mt-2 leading-relaxed ${tieneDiplomaGeneral ? 'text-slate-300 text-xs sm:text-sm' : `text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}`}>
                    Acreditación respaldada institucionalmente por el CIP para validar tus horas lectivas y especialización profesional.
                  </p>
                  {!tieneDiplomaGeneral && (
                    <p className="text-[11px] text-amber-400 mt-3 font-medium flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Requisito: obtén primero tu Diploma General.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => abrirModal('CIP')}
                  disabled={!tieneDiplomaGeneral}
                  className={`mt-5 w-full font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs ${
                    tieneDiplomaGeneral 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer' 
                      : `${esOscuro ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'} cursor-not-allowed border`
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> 
                  {tieneDiplomaGeneral ? 'Solicitar Certificación CIP' : 'Disponible al completar diplomado'}
                </button>
              </div>

              {/* Tarjeta MIAMI */}
              <div className={`shadow-lg relative overflow-hidden flex flex-col justify-between border transition-all ${
                tieneDiplomaGeneral 
                  ? 'rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white' 
                  : `rounded-2xl p-5 ${esOscuro ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'}`
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-3">
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
                  <h3 className={`font-bold leading-snug ${tieneDiplomaGeneral ? 'text-lg text-white' : `text-sm ${esOscuro ? 'text-white' : 'text-slate-900'}`}`}>
                    San Ignacio University (Miami, FL)
                  </h3>
                  <p className={`mt-2 leading-relaxed ${tieneDiplomaGeneral ? 'text-slate-300 text-xs sm:text-sm' : `text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}`}>
                    Certificación académica internacional expedida desde EE.UU. con validez global en tu programa de alta especialización.
                  </p>

                  {!tieneDiplomaGeneral && (
                    <p className="text-[11px] text-amber-400 mt-3 font-medium flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Requisito: obtén primero tu Diploma General.
                    </p>
                  )}
                </div>

                {tieneDiplomaGeneral ? (
                  <button
                    onClick={() => abrirModal('MIAMI')}
                    className="mt-5 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Globe className="w-4 h-4" /> Solicitar Certificación MIAMI
                  </button>
                ) : (
                  <button
                    disabled
                    className={`mt-5 w-full font-bold py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs cursor-not-allowed ${
                      esOscuro ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <Globe className="w-4 h-4" /> Disponible al completar diplomado
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* MODAL DE VISTA PREVIA DEL CERTIFICADO (SOLO DOCUMENTO A4 REAL + BARRA DE ACCIONES) */}
        {modalVistaPrevia?.abierto && (() => {
          const orientacionFinal = modeloActivo?.orientacion || (modalVistaPrevia.tipo === 'Curso' || modalVistaPrevia.tipo === 'Taller' ? 'vertical' : 'horizontal');
          const esVerticalModal = orientacionFinal === 'vertical';

          return (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setModalVistaPrevia(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`rounded-3xl w-full ${esVerticalModal ? 'max-w-lg' : 'max-w-4xl'} p-4 sm:p-5 shadow-2xl relative border flex flex-col gap-3.5 my-auto ${
                  esOscuro ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                {/* Botón de cierre limpio sin badge ni código redundante */}
                <button 
                  onClick={() => setModalVistaPrevia(null)} 
                  className={`absolute top-3 right-3 z-30 p-1.5 rounded-full transition-colors cursor-pointer ${
                    esOscuro
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* CERTIFICADO A4 COMPLETO (SIN RECORTE NI SOLAPAMIENTO EN HORIZONTAL NI EN VERTICAL) */}
                <div className="w-full flex items-center justify-center pt-2 pb-1 overflow-hidden shrink">
                  <div
                    className="mx-auto flex items-center justify-center"
                    style={{
                      width: '100%',
                      maxWidth: esVerticalModal
                        ? 'min(100%, calc((80vh - 150px) * 210 / 297), 440px)'
                        : 'min(100%, calc((80vh - 150px) * 297 / 210), 840px)',
                      aspectRatio: esVerticalModal ? '210 / 297' : '297 / 210'
                    }}
                  >
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
                      className="!shadow-xl !rounded-lg"
                    />
                  </div>
                </div>

                {/* BARRA DE ACCIONES (2 FILAS EN VERTICAL Y HORIZONTAL FLUIDO SIN SOLAPAMIENTO) */}
                <div className="pt-2 shrink-0 z-20 flex flex-col gap-2 w-full">
                  {esVerticalModal ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                          onClick={copiarLinkValidacion}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                            copiadoLink 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                              : (esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                          }`}
                        >
                          {copiadoLink ? <Check className="size-4 shrink-0 text-emerald-500" /> : <Copy className="size-4 shrink-0" />}
                          <span className="truncate">{copiadoLink ? '¡Copiado!' : 'Copiar enlace'}</span>
                        </button>

                        <button
                          onClick={compartirLinkedIn}
                          className="w-full bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold px-3 py-2.5 rounded-xl text-xs whitespace-nowrap transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Share2 className="size-4 shrink-0" />
                          <span className="truncate">Añadir a LinkedIn</span>
                        </button>
                      </div>

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
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <Download className="size-4 shrink-0" />
                        <span>Descargar PDF Oficial</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
                      <button
                        onClick={copiarLinkValidacion}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center justify-center gap-2 border cursor-pointer ${
                          copiadoLink 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                            : (esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                        }`}
                      >
                        {copiadoLink ? <Check className="size-4 shrink-0 text-emerald-500" /> : <Copy className="size-4 shrink-0" />}
                        {copiadoLink ? '¡Enlace copiado!' : 'Copiar enlace de validación'}
                      </button>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={compartirLinkedIn}
                          className="flex-1 sm:flex-initial bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Share2 className="size-4 shrink-0" /> Añadir a LinkedIn
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
                          className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs whitespace-nowrap transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Download className="size-4 shrink-0" /> Descargar PDF
                        </button>
                      </div>
                    </div>
                  )}
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