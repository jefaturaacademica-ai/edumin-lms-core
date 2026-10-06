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
  Wrench, 
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
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';

export default function CertificadosPage() {
  const { esOscuro } = useTheme();

  // Perfil real del estudiante desde Supabase
  const [perfilEstudiante, setPerfilEstudiante] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setPerfilEstudiante(data.profile);
            if (data.profile.diplomado_1) {
              setDiplomadoSeleccionado(data.profile.diplomado_1);
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
    titulo: string;
    subtitulo: string;
    categoria: string;
    fecha: string;
    codigo: string;
    nota?: number;
    tipo: 'Diplomado' | 'Modular' | 'Curso' | 'Taller';
  } | null>(null);

  const [copiadoLink, setCopiadoLink] = useState(false);

  // ESTADO DE SIMULACIÓN DEV (SOLO DESARROLLO INTERNO)
  const [estadoSimuladoDev, setEstadoSimuladoDev] = useState<'cero' | 'un_modular' | 'vista_actual'>('vista_actual');
  const [mostrarPanelDev, setMostrarPanelDev] = useState(true);

  // Nombre completo del estudiante desde Supabase
  const nombreEstudianteCompleto = perfilEstudiante
    ? `${perfilEstudiante.nombres || ''} ${perfilEstudiante.apellidos || ''}`.trim()
    : 'JUAN CARLOS QUISPE RAMOS';

  const paqueteUsuario = perfilEstudiante?.paquete_adquirido || 'COMPLETO';

  // 1. DIPLOMAS GENERALES DINÁMICOS DESDE SUPABASE
  const diplomadosProgreso = useMemo(() => {
    if (!perfilEstudiante) {
      return [
        {
          id: 'geometalurgia',
          titulo: 'GEOMETALURGIA',
          modularesAprobados: 3,
          modularesTotales: 3,
          promedio: 18.0,
          completado: true,
          fecha: '15/03/2026',
          codigo: 'EDUMIN-DIP-71234567-GEO'
        }
      ];
    }

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    return rawDiplomados.map((d: any, idx: number) => {
      const modulos = d.modulos || [];
      const modulosCompletados = modulos.filter((m: any) => m.completado);
      const modularesAprobados = modulosCompletados.length;
      const modularesTotales = modulos.length || 3;
      const sumaNotas = modulosCompletados.reduce((sum: number, m: any) => sum + (Number(m.nota) || 0), 0);
      const promedio = modularesAprobados > 0 ? Number((sumaNotas / modularesAprobados).toFixed(1)) : 0;
      const completado = d.completado || (modularesAprobados === modularesTotales && modularesTotales > 0);

      return {
        id: d.id || d.slug || `dip-${idx + 1}`,
        titulo: d.titulo || 'Diplomado',
        modularesAprobados,
        modularesTotales,
        promedio: d.promedio || promedio,
        completado,
        fecha: d.fecha || '15/03/2026',
        codigo: d.codigo || `EDUMIN-DIP-${perfilEstudiante.dni_ce || '71234567'}-${(d.id || 'DIP').substring(0, 3).toUpperCase()}`
      };
    });
  }, [perfilEstudiante]);

  // 2. CERTIFICADOS MODULARES DINÁMICOS DESDE SUPABASE
  const certificadosModulares = useMemo(() => {
    if (!perfilEstudiante) {
      return [
        { id: 1, modulo: 'Módulo 01: GEOTECNIA DE SUELOS Y ROCAS', diplomado: 'GEOMETALURGIA', nota: 18, fecha: '15/01/2026', codigo: 'EDUMIN-MOD-71234567-GEO1' },
        { id: 2, modulo: 'Módulo 02: MONITOREO GEOTÉCNICO', diplomado: 'GEOMETALURGIA', nota: 17, fecha: '20/02/2026', codigo: 'EDUMIN-MOD-71234567-GEO2' },
        { id: 3, modulo: 'Módulo 03: ANÁLISIS HIDROGEOLÓGICO', diplomado: 'GEOMETALURGIA', nota: 19, fecha: '15/03/2026', codigo: 'EDUMIN-MOD-71234567-GEO3' },
        { id: 4, modulo: 'Módulo 01: Marco Legal e Institucional del Sector Minero', diplomado: 'DERECHO MINERO', nota: 18, fecha: '10/02/2026', codigo: 'EDUMIN-MOD-71234567-DER1' },
        { id: 5, modulo: 'Módulo 02: Procedimientos Catastrales y Concesiones', diplomado: 'DERECHO MINERO', nota: 16, fecha: '05/03/2026', codigo: 'EDUMIN-MOD-71234567-DER2' },
      ];
    }

    const rawDiplomados = parseDiplomadosFromProfile(perfilEstudiante);
    const result: any[] = [];
    let counter = 1;

    rawDiplomados.forEach((d: any) => {
      (d.modulos || []).forEach((m: any) => {
        if (m.completado) {
          result.push({
            id: counter++,
            modulo: `${m.codigo || 'Módulo'}: ${m.nombre}`,
            diplomado: d.titulo,
            nota: m.nota || 18,
            fecha: m.fecha || '15/01/2026',
            codigo: m.codigo_cert || `EDUMIN-MOD-${perfilEstudiante.dni_ce || '71234567'}-${counter}`
          });
        }
      });
    });

    return result;
  }, [perfilEstudiante]);

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

  // 3. CERTIFICADOS DE CURSOS DINÁMICOS DESDE SUPABASE
  const certificadosCursos = useMemo(() => {
    if (!perfilEstudiante) {
      return [
        { id: 'c1', titulo: "MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783", categoria: "Seguridad & SSOMA", horas: "24 Horas", fecha: "18/02/2026", nota: 18, codigo: 'EDUMIN-CUR-71234567-01' },
        { id: 'c2', titulo: "IPERC CONTINUO EN TRABAJOS DE ALTO RIESGO", categoria: "Seguridad & SSOMA", horas: "16 Horas", fecha: "05/03/2026", nota: 17, codigo: 'EDUMIN-CUR-71234567-02' },
        { id: 't1', titulo: "TALLER PRÁCTICO EN VIVO: PRIMEROS AUXILIOS Y EMERGENCIAS MINERAS", categoria: "Taller Especializado", horas: "08 Horas", fecha: "25/02/2026", nota: 19, codigo: 'EDUMIN-TAL-71234567-01' }
      ];
    }

    const rawCursos = parseCursosFromProfile(perfilEstudiante);
    return rawCursos.filter((c: any) => c.completado).map((c: any, idx: number) => ({
      id: c.id || `cur-${idx + 1}`,
      titulo: c.titulo,
      categoria: c.categoria || 'Seguridad & SSOMA',
      horas: c.horas || '24 Horas',
      fecha: c.fecha || '18/02/2026',
      nota: c.nota,
      codigo: c.codigo || `EDUMIN-CUR-${perfilEstudiante.dni_ce || '71234567'}-${idx + 1}`
    }));
  }, [perfilEstudiante]);

  const [diplomadoSeleccionado, setDiplomadoSeleccionado] = useState(
    diplomadosProgreso[0]?.titulo || 'GEOMETALURGIA'
  );

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
    categoria: string;
    fecha: string;
    codigo: string;
    nota?: number;
    tipo: 'Diplomado' | 'Modular' | 'Curso' | 'Taller';
  }) => {
    setCopiadoLink(false);
    setModalVistaPrevia({ abierto: true, ...certData });
  };

  const copiarLinkValidacion = () => {
    if (!modalVistaPrevia) return;
    navigator.clipboard.writeText(`https://edumin.pe/validar/${modalVistaPrevia.codigo}`);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  const compartirLinkedIn = () => {
    if (!modalVistaPrevia) return;
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(modalVistaPrevia.titulo)}&organizationName=${encodeURIComponent('EDUMIN - Escuela de Especialización Minera')}&issueYear=2026&issueMonth=3&certUrl=${encodeURIComponent(`https://edumin.pe/validar/${modalVistaPrevia.codigo}`)}`;
    window.open(url, '_blank');
  };

  const totalModularesCount = Object.values(modularesPorDiplomado).flat().length;
  const totalCursosCount = certificadosCursos.length;

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Encabezado Principal */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight flex items-center gap-3 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              <Award className="w-8 h-8 text-indigo-600" />
              Muro de Certificados y Logros
            </h1>
            <p className={`mt-2 text-sm sm:text-base ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Visualiza en vista previa, descarga o comparte en LinkedIn tus certificaciones oficiales acreditadas.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </header>

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
                  : (estadoSimuladoDev === 'un_modular' ? 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border-purple-500/40' : 'bg-slate-900/60 border-slate-800/80 opacity-80')
              }`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {tieneDiplomaGeneral ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Habilitado
                      </span>
                    ) : (
                      estadoSimuladoDev === 'un_modular' ? (
                        <span className="text-[11px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="size-3" /> No Incluido en tu Plan
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="size-3" /> Bloqueado
                        </span>
                      )
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">San Ignacio University (Miami, FL)</h3>
                  <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                    Certificación académica internacional expedida desde EE.UU. con validez global en tu programa de alta especialización.
                  </p>

                  {!tieneDiplomaGeneral && estadoSimuladoDev === 'un_modular' && (
                    <p className="text-xs text-purple-300 mt-3 font-medium flex items-center gap-1.5 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                      <Sparkles className="size-4 shrink-0 text-purple-400" />
                      Tu plan no incluye esta acreditación internacional. Puedes comprarla directamente para certificar tu programa.
                    </p>
                  )}

                  {!tieneDiplomaGeneral && estadoSimuladoDev !== 'un_modular' && (
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
                  estadoSimuladoDev === 'un_modular' ? (
                    <button
                      onClick={() => abrirModal('MIAMI')}
                      className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" /> Comprar Acreditación Internacional ($120 USD)
                    </button>
                  ) : (
                    <button
                      disabled
                      className="mt-6 w-full bg-slate-800 text-slate-500 font-bold py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-not-allowed"
                    >
                      <Globe className="w-4 h-4" /> Requisito: Obten tu Diploma General
                    </button>
                  )
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
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{curso.categoria}</span>
                      {curso.nota ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Nota: {curso.nota}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Acceso Gratuito
                        </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold uppercase leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                      {curso.titulo}
                    </h4>

                    {/* Duración y Fecha en filas separadas */}
                    <div className={`text-[11px] mt-3 space-y-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                      <p>Duración: {curso.horas}</p>
                      <p>Fecha: {curso.fecha}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => abrirVistaPrevia({
                        titulo: curso.titulo,
                        subtitulo: `DURACIÓN: ${curso.horas}`,
                        categoria: curso.categoria,
                        fecha: curso.fecha,
                        codigo: curso.codigo,
                        nota: curso.nota,
                        tipo: 'Curso'
                      })}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs transition-colors border border-slate-700 cursor-pointer"
                      title="Vista Previa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer">
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
          const estilo = (function(tipo: string) {
            const t = (tipo || '').toUpperCase();
            if (t.includes('DIPLOM')) {
              return {
                marco: 'border-amber-600/40 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 text-slate-900 shadow-amber-900/10',
                tituloHeader: 'DIPLOMA DE ALTA ESPECIALIZACIÓN',
                otorgamiento: 'Por haber cumplido y aprobado con excelencia los 3 módulos del programa oficial de:',
                escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
                institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
                horas: '120 horas cronológicas',
                firmas: ['Director Académico', 'Coordinador General']
              };
            }
            if (t.includes('MODULAR')) {
              return {
                marco: 'border-indigo-600/40 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/50 text-slate-900 shadow-indigo-900/10',
                tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
                otorgamiento: 'Por haber completado satisfactoriamente la evaluación y contenidos del módulo:',
                escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
                institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
                horas: '40 horas cronológicas',
                firmas: ['Director Académico']
              };
            }
            if (t.includes('CURSO')) {
              return {
                marco: 'border-emerald-600/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/50 text-slate-900 shadow-emerald-900/10',
                tituloHeader: 'CERTIFICADO DE ESPECIALIZACIÓN PROFESIONAL',
                otorgamiento: 'Por su destacada participación y aprobación del curso técnico intensivo de:',
                escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
                institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
                horas: '24 horas cronológicas',
                firmas: ['Director Académico', 'Docente Titular']
              };
            }
            if (t.includes('CIP')) {
              return {
                marco: 'border-rose-700/40 bg-gradient-to-br from-rose-50/40 via-white to-amber-50/40 text-slate-900 shadow-rose-900/10',
                tituloHeader: 'CERTIFICACIÓN CONVENIO OFICIAL CIP',
                otorgamiento: 'En convenio interinstitucional con el Colegio de Ingenieros del Perú (CIP), acredita a:',
                escuelaHeader: 'CONVENIO INSTITUCIONAL CIP & EDUMIN',
                institucionHeader: 'COLEGIO DE INGENIEROS DEL PERÚ',
                horas: '120 horas cronológicas',
                firmas: ['Decano CIP Nacional', 'Director EDUMIN']
              };
            }
            if (t.includes('MIAMI')) {
              return {
                marco: 'border-cyan-600/40 bg-gradient-to-br from-cyan-50/40 via-white to-indigo-50/40 text-slate-900 shadow-cyan-900/10',
                tituloHeader: 'INTERNATIONAL CERTIFICATE OF COMPLETION',
                otorgamiento: 'University international partner certificate awarded for professional excellence in:',
                escuelaHeader: 'INTERNATIONAL PARTNERSHIP ACADEMY',
                institucionHeader: 'SAN IGNACIO UNIVERSITY (MIAMI, FL)',
                horas: '150 horas internacionales',
                firmas: ['International Dean', 'Executive Director']
              };
            }
            return {
              marco: 'border-purple-600/40 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/50 text-slate-900 shadow-purple-900/10',
              tituloHeader: 'CONSTANCIA DE TALLER PRÁCTICO EN VIVO',
              otorgamiento: 'Por su asistencia y participación en el taller especializado de:',
              escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
              institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
              horas: '08 horas prácticas',
              firmas: ['Director Académico']
            };
          })(modalVistaPrevia.tipo);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
              <div className={`rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative border space-y-6 my-6 ${
                esOscuro ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
              }`}>
                <button 
                  onClick={() => setModalVistaPrevia(null)} 
                  className="absolute right-6 top-6 text-slate-400 hover:text-white font-bold p-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 grid place-items-center shrink-0">
                    <Eye className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Vista Previa del Certificado</h3>
                    <p className="text-xs text-slate-400">Modelo Máster A4 aplicado dinámicamente según categoría.</p>
                  </div>
                </div>

                {/* CANVAS DIPLOMA/CERTIFICADO FIEL A LA PLANTILLA MAESTRA A4 (COMPARTIDO CON ADMIN) */}
                <div className="p-2 sm:p-4 bg-slate-950/90 rounded-2xl flex items-center justify-center">
                  <div className={`rounded-2xl border-8 p-6 sm:p-8 relative text-center shadow-2xl transition-all overflow-hidden w-full ${
                    estilo.marco
                  }`}>
                    {/* Header: Escuela + Instituto (izq) e Insignia EM (der) */}
                    <div className="flex justify-between items-center border-b border-black/10 pb-3 mb-4">
                      <div className="text-left">
                        <span className="text-[9px] font-mono font-bold tracking-widest block opacity-70 text-slate-600">
                          {estilo.escuelaHeader}
                        </span>
                        <h4 className="text-xs font-black text-slate-900">
                          {estilo.institucionHeader}
                        </h4>
                      </div>
                      <div className="size-8 rounded-full bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                        EM
                      </div>
                    </div>

                    {/* Subtítulo Tipo de Certificado */}
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block text-slate-700">
                      {estilo.tituloHeader}
                    </span>

                    <p className="text-[11px] opacity-70 mt-2 text-slate-600">Otorgado a favor de:</p>
                    
                    {/* Nombre Estudiante en Fuente Serif Elegante con subrayado dorado */}
                    <h3 className="text-xl sm:text-2xl font-extrabold font-serif text-slate-900 my-2 underline decoration-amber-500 underline-offset-4">
                      {nombreEstudianteCompleto || 'JUAN CARLOS QUISPE RAMOS'}
                    </h3>
                    <p className="text-[10px] opacity-60 font-mono text-slate-600">
                      DNI / CE: {perfilEstudiante?.dni || '71234567'}
                    </p>

                    {/* Texto de Otorgamiento */}
                    <p className="text-xs mt-3 px-4 leading-relaxed opacity-85 text-slate-700">
                      {estilo.otorgamiento}
                    </p>

                    {/* Título del Programa / Curso en Mayúsculas Azules/Índigo */}
                    <p className="text-sm sm:text-base font-black mt-1 uppercase px-4 text-indigo-950 tracking-wide">
                      {modalVistaPrevia.titulo}
                    </p>
                    {modalVistaPrevia.subtitulo && (
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">{modalVistaPrevia.subtitulo}</p>
                    )}

                    {/* Pastillas de Métricas: Horas y Calificación */}
                    <div className="my-4 flex items-center justify-center gap-4 text-xs font-bold text-slate-800">
                      <span className="px-3 py-1 rounded-lg border border-black/10 bg-black/5">
                        ⏱️ {estilo.horas}
                      </span>
                      {modalVistaPrevia.nota && (
                        <span className="px-3 py-1 rounded-lg border border-black/10 bg-black/5">
                          🏆 Calificación: {modalVistaPrevia.nota}
                        </span>
                      )}
                    </div>

                    {/* Footer del Certificado con Fechas, Firmas y Código QR */}
                    <div className="mt-6 pt-4 border-t border-black/10 flex justify-between items-end text-[9px] opacity-80 text-slate-700">
                      <div className="text-left font-mono">
                        <p>Fecha de emisión: {modalVistaPrevia.fecha || '2026-10-06'}</p>
                        <p className="font-bold mt-0.5 text-indigo-900">Código: {modalVistaPrevia.codigo}</p>
                      </div>

                      <div className="flex gap-4 sm:gap-6">
                        {estilo.firmas.map((f: string, i: number) => (
                          <div key={i} className="text-center">
                            <div className="w-16 sm:w-20 border-b border-black/30 mb-1"></div>
                            <span className="text-[8px] block font-bold text-slate-800">{f}</span>
                            <span className="text-[7px] opacity-70 text-slate-500">EDUMIN LMS</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col items-center p-1 bg-white text-slate-900 rounded-lg border border-slate-200 shadow-sm shrink-0">
                        <QrCode className="w-7 h-7 text-slate-900" />
                        <span className="text-[7px] font-mono mt-0.5 font-bold">VÁLIDO</span>
                      </div>
                    </div>
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
                    {copiadoLink ? '¡Enlace Copiado!' : 'Copiar Enlace de Validación'}
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={compartirLinkedIn}
                      className="flex-1 sm:flex-initial bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Share2 className="size-4" /> Añadir a LinkedIn
                    </button>

                    <button className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer">
                      <Download className="size-4" /> Descargar
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* MODAL DE VALIDACIÓN UNIFICADO (CIP / MIAMI) */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className={`rounded-3xl w-full max-w-lg p-8 shadow-2xl relative border ${esOscuro ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'}`}>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-200 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
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

      {/* PANEL FLOTANTE DE SIMULACIÓN DEV (DESARROLLO INTERNO) */}
      {mostrarPanelDev && (
        <aside className="fixed bottom-5 right-5 z-40 bg-slate-900/95 text-white border border-slate-700/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl max-w-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Wrench className="size-3.5" /> Simulador Dev (Interno)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">v1.0</span>
              <button 
                onClick={() => setMostrarPanelDev(false)}
                className="text-slate-400 hover:text-white transition p-0.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Cerrar panel de simulación"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-300">
            Prueba la vista de certificados según modulares:
          </p>

          <div className="space-y-1.5 text-xs">
            <button
              onClick={() => setEstadoSimuladoDev('cero')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'cero' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div>
                <span className="block font-bold">1. Sin Modulares (Inicio)</span>
                <span className="text-[10px] opacity-80">0 Modulares, 1 Dip. (0/3), 4 Cursos</span>
              </div>
              {estadoSimuladoDev === 'cero' && <CheckCircle2 className="size-3.5 text-white shrink-0" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('un_modular')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'un_modular' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div>
                <span className="block font-bold">2. Con 1 Modular Aprobado</span>
                <span className="text-[10px] opacity-80">1 Modular, 1 Dip. Pendiente (1/3), 4 Cursos</span>
              </div>
              {estadoSimuladoDev === 'un_modular' && <CheckCircle2 className="size-3.5 text-white shrink-0" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('vista_actual')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'vista_actual' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div>
                <span className="block font-bold">3. Vista Mixta (Dip. 1 OK / Dip. 2 Bloq.)</span>
                <span className="text-[10px] opacity-80">Dip 1 (3/3 100%), Dip 2 (2/3 Bloqueado)</span>
              </div>
              {estadoSimuladoDev === 'vista_actual' && <CheckCircle2 className="size-3.5 text-white shrink-0" />}
            </button>
          </div>
        </aside>
      )}

    </main>
  );
}