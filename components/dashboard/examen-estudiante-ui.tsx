'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Loader2,
  RotateCcw,
  Timer
} from 'lucide-react';
import type { DetalleCalificacionPregunta } from '@/lib/types/examenes';

export interface ConfigExamenEstudiante {
  tiempo_minutos?: number;
  cantidad_preguntas?: number;
  nota_minima?: number;
  aplica_examen?: boolean;
  intentos_permitidos?: number;
}

interface ExamenBarraSuperiorProps {
  titulo: string;
  esOscuro: boolean;
  enCuestionario: boolean;
  respondidas: number;
  totalPreguntas: number;
  tiempoRestanteSegundos: number;
  tiempoFormateado: string;
}

/**
 * Barra superior continua de la vista de examen (mismo alto fijo en todos los estados y sticky en cuestionario).
 */
export function ExamenBarraSuperior({
  titulo,
  esOscuro,
  enCuestionario,
  respondidas,
  totalPreguntas,
  tiempoRestanteSegundos,
  tiempoFormateado
}: ExamenBarraSuperiorProps) {
  return (
    <div
      className={`px-3.5 sm:px-5 h-[60px] min-h-[60px] border-b rounded-t-2xl flex items-center justify-between gap-3 shrink-0 transition-colors ${
        enCuestionario ? 'sticky top-0 z-20 lg:static shadow-xs lg:shadow-none' : ''
      } ${
        esOscuro
          ? 'border-slate-800 bg-slate-950'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-9 rounded-xl bg-amber-500/15 text-amber-500 grid place-items-center shrink-0">
          <FileText className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h2
            className={`text-xs sm:text-sm font-bold uppercase truncate ${
              esOscuro ? 'text-white' : 'text-slate-900'
            }`}
          >
            {titulo}
          </h2>
        </div>
      </div>

      {enCuestionario && (
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div
            className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
              esOscuro
                ? 'bg-slate-900 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              {respondidas} / {totalPreguntas} respondidas
            </span>
          </div>

          <div
            className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 tabular-nums ${
              esOscuro
                ? 'bg-slate-800/80 border-slate-700/80'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Timer
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                tiempoRestanteSegundos <= 300 ? 'text-rose-500 animate-pulse' : 'text-indigo-500'
              }`}
            />
            <span
              className={`text-xs sm:text-sm font-bold ${
                tiempoRestanteSegundos <= 300
                  ? 'text-rose-500 animate-pulse'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {tiempoFormateado}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExamenIndicacionesPanelProps {
  esOscuro: boolean;
  cargandoConfig?: boolean;
  config: ConfigExamenEstudiante | null;
  tipo: 'curso' | 'diplomado';
  onCancelar: () => void;
  onComenzar: () => void;
}

/**
 * Panel de indicaciones previas con tarjetitas informativas dinámicas, párrafo general y botones alineados.
 */
export function ExamenIndicacionesPanel({
  esOscuro,
  cargandoConfig = false,
  config,
  tipo,
  onCancelar,
  onComenzar
}: ExamenIndicacionesPanelProps) {
  if (cargandoConfig) {
    return (
      <div className="py-14 text-center text-slate-400 space-y-3">
        <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" />
        <p className="text-xs sm:text-sm font-medium">Cargando configuración del examen...</p>
      </div>
    );
  }

  if (config && config.aplica_examen === false) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-4">
        <div
          className={`p-6 rounded-2xl border text-center space-y-3 ${
            esOscuro ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="size-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Este {tipo === 'curso' ? 'curso' : 'módulo'} no requiere examen
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Este {tipo === 'curso' ? 'curso' : 'módulo'} cuenta con certificación directa. Tu certificado oficial se habilitará automáticamente al completar las clases del temario.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center">
          <button
            type="button"
            onClick={onCancelar}
            className="h-10 sm:h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Entendido, volver a las clases
          </button>
        </div>
      </div>
    );
  }

  const tiempoMinutos = config?.tiempo_minutos ?? 30;
  const intentosPermitidos = config?.intentos_permitidos ?? 1;
  const cantidadPreguntas = config?.cantidad_preguntas ?? 10;
  const notaMinima = config?.nota_minima ?? 12;

  const tarjetas = [
    {
      label: 'Tiempo',
      valor: `${tiempoMinutos} ${tiempoMinutos === 1 ? 'minuto' : 'minutos'}`,
      icono: <Timer className="w-4 h-4 text-indigo-500 shrink-0" />
    },
    {
      label: 'Intentos',
      valor: `${intentosPermitidos} ${intentosPermitidos === 1 ? 'intento' : 'intentos'}`,
      icono: <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
    },
    {
      label: 'Preguntas',
      valor: `${cantidadPreguntas} ${cantidadPreguntas === 1 ? 'pregunta' : 'preguntas'}`,
      icono: <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />
    },
    {
      label: 'Nota para aprobar',
      valor: `${notaMinima} / 20`,
      icono: <Award className="w-4 h-4 text-emerald-500 shrink-0" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tarjetas.map((item) => (
          <div
            key={item.label}
            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col gap-1.5 ${
              esOscuro
                ? 'bg-slate-800/50 border-slate-800'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.icono}
              <span className="truncate">{item.label}</span>
            </div>
            <span
              className={`text-sm sm:text-base font-bold ${
                esOscuro ? 'text-white' : 'text-slate-900'
              }`}
            >
              {item.valor}
            </span>
          </div>
        ))}
      </div>

      <p
        className={`text-xs sm:text-sm leading-relaxed ${
          esOscuro ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        Lee atentamente cada pregunta antes de marcar tu respuesta. Al iniciar el examen comenzará a correr el cronómetro con el tiempo asignado y, al finalizar, podrás visualizar tu calificación y la retroalimentación de tus respuestas.
      </p>

      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className={`h-10 sm:h-11 px-5 rounded-xl text-xs sm:text-sm font-bold border transition-colors inline-flex items-center justify-center cursor-pointer ${
            esOscuro
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onComenzar}
          className="h-10 sm:h-11 px-6 rounded-xl text-xs sm:text-sm font-bold border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Comenzar examen</span>
        </button>
      </div>
    </div>
  );
}

interface ExamenResultadoYRetroalimentacionProps {
  esOscuro: boolean;
  nota: number;
  aprobado: boolean;
  notaMinima: number;
  detalles: DetalleCalificacionPregunta[] | null;
  cargandoRetroalimentacion?: boolean;
  mostrarRetroalimentacion: boolean;
  onToggleRetroalimentacion: () => void;
  whatsappSustitutorioHref: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  formatearTexto?: (texto: string) => React.ReactNode;
}

function formatearFechaHoraExamen(iso?: string | null): string {
  if (!iso) return 'No registrado';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'No registrado';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(fecha);
}

function calcularTiempoEmpleadoExamen(inicioIso?: string | null, finIso?: string | null): string {
  if (!inicioIso || !finIso) return 'No registrado';
  const inicioMs = new Date(inicioIso).getTime();
  const finMs = new Date(finIso).getTime();
  if (Number.isNaN(inicioMs) || Number.isNaN(finMs)) return 'No registrado';
  const totalSeg = Math.max(0, Math.round((finMs - inicioMs) / 1000));
  const horas = Math.floor(totalSeg / 3600);
  const minutos = Math.floor((totalSeg % 3600) / 60);
  const segundos = totalSeg % 60;
  if (horas > 0) {
    return `${horas} h ${minutos.toString().padStart(2, '0')} min`;
  }
  if (minutos > 0) {
    return `${minutos} min ${segundos.toString().padStart(2, '0')} s`;
  }
  return `${segundos} s`;
}

/**
 * Vista unificada de resultado y revisión de respuestas para exámenes de curso/taller y módulos de diplomado.
 */
export function ExamenResultadoYRetroalimentacion({
  esOscuro,
  nota,
  aprobado,
  notaMinima,
  detalles,
  cargandoRetroalimentacion = false,
  mostrarRetroalimentacion,
  onToggleRetroalimentacion,
  whatsappSustitutorioHref,
  fechaInicio = null,
  fechaFin = null,
  formatearTexto = (texto: string) => texto
}: ExamenResultadoYRetroalimentacionProps) {
  const tiempoEmpleado = calcularTiempoEmpleadoExamen(fechaInicio, fechaFin);

  return (
    <div className="space-y-4">
      {/* Tarjeta compacta de calificación e historial de tiempos */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
          aprobado
            ? esOscuro
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : esOscuro
              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`size-11 rounded-xl grid place-items-center shrink-0 ${
                aprobado ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
              }`}
            >
              {aprobado ? <Award className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    aprobado ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {aprobado ? 'Examen aprobado' : 'Evaluación no aprobada'}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className={`text-xs font-medium ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                  Mínimo {notaMinima}/20
                </span>
              </div>
              <h3
                className={`text-xl sm:text-2xl font-black tabular-nums mt-0.5 ${
                  esOscuro ? 'text-white' : 'text-slate-900'
                }`}
              >
                Nota: {nota.toString().padStart(2, '0')} / 20
              </h3>
            </div>
          </div>
        </div>

        {/* Tiempos del intento: inicio, fin y duración calculada */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t ${
            aprobado
              ? esOscuro
                ? 'border-emerald-800/40'
                : 'border-emerald-200/80'
              : esOscuro
                ? 'border-rose-800/40'
                : 'border-rose-200/80'
          }`}
        >
          <div
            className={`px-3 py-2 rounded-xl border text-xs ${
              esOscuro ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white/75 border-slate-200/70'
            }`}
          >
            <span className={`flex items-center gap-1.5 font-medium ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Inicio
            </span>
            <p className={`font-semibold tabular-nums mt-0.5 ${esOscuro ? 'text-slate-100' : 'text-slate-800'}`}>
              {formatearFechaHoraExamen(fechaInicio)}
            </p>
          </div>

          <div
            className={`px-3 py-2 rounded-xl border text-xs ${
              esOscuro ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white/75 border-slate-200/70'
            }`}
          >
            <span className={`flex items-center gap-1.5 font-medium ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Fin
            </span>
            <p className={`font-semibold tabular-nums mt-0.5 ${esOscuro ? 'text-slate-100' : 'text-slate-800'}`}>
              {formatearFechaHoraExamen(fechaFin)}
            </p>
          </div>

          <div
            className={`px-3 py-2 rounded-xl border text-xs ${
              esOscuro ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white/75 border-slate-200/70'
            }`}
          >
            <span className={`flex items-center gap-1.5 font-medium ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              <Timer className="w-3.5 h-3.5 shrink-0" />
              Tiempo empleado
            </span>
            <p className={`font-semibold tabular-nums mt-0.5 ${esOscuro ? 'text-slate-100' : 'text-slate-800'}`}>
              {tiempoEmpleado}
            </p>
          </div>
        </div>
      </div>

      {/* Fila separada de botones de acción */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {(cargandoRetroalimentacion || (detalles && detalles.length > 0)) && (
          <button
            type="button"
            onClick={onToggleRetroalimentacion}
            className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-colors inline-flex items-center gap-2 cursor-pointer ${
              mostrarRetroalimentacion
                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                : esOscuro
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800 shadow-2xs'
            }`}
          >
            {mostrarRetroalimentacion ? (
              <>
                <EyeOff className="w-4 h-4 shrink-0" />
                <span>Ocultar respuestas</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 shrink-0" />
                <span>Ver respuestas</span>
              </>
            )}
          </button>
        )}

        {aprobado ? (
          <Link
            href="/dashboard/certificados"
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Ver certificado</span>
          </Link>
        ) : (
          <a
            href={whatsappSustitutorioHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors inline-flex items-center gap-2"
          >
            <span>Solicitar sustitutorio</span>
          </a>
        )}
      </div>

      {/* Revisión de respuestas (cerrada por defecto; visible solo al hacer clic en Ver respuestas) */}
      {mostrarRetroalimentacion && (
        <div className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Revisión de respuestas</span>
          </h4>

          {cargandoRetroalimentacion ? (
            <div className="py-10 text-center text-slate-400 space-y-2.5">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs sm:text-sm font-medium">Cargando respuestas...</p>
            </div>
          ) : detalles && detalles.length > 0 ? (
            <div className="space-y-4">
              {detalles.map((det, dIdx) => {
                const esCompleta = det.puntajeObtenido >= det.puntajeMaximoPregunta;
                const esParcial = !esCompleta && det.puntajeObtenido > 0;

                return (
                  <div
                    key={det.preguntaId || dIdx}
                    className={`p-5 sm:p-6 rounded-2xl border space-y-3.5 ${
                      esOscuro
                        ? 'bg-slate-900/70 border-slate-800'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    {/* Fila superior: Pregunta # a la izquierda; tipo de pregunta y puntaje a la derecha */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Pregunta {dIdx + 1} de {detalles.length}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            det.tipo === 'multiple_select'
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-500 dark:text-purple-400'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400'
                          }`}
                        >
                          {det.tipo === 'multiple_select' ? 'Selección múltiple' : 'Opción única'}
                        </span>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            esCompleta
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : esParcial
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {esCompleta
                            ? `Correcto (+${det.puntajeObtenido} pts)`
                            : esParcial
                              ? `Parcial (+${det.puntajeObtenido} pts)`
                              : 'Incorrecto (0 pts)'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold leading-relaxed text-pretty">
                      {formatearTexto(det.pregunta)}
                    </h3>

                    {/* Opciones en disposición interna de 2 columnas: texto uniforme + badge Respuesta correcta */}
                    <div className="space-y-2.5 pt-1">
                      {det.desgloseOpciones?.map((opt) => {
                        let estiloFila = esOscuro
                          ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700';

                        if (opt.marcadaPorAlumno && opt.isCorrect) {
                          estiloFila = esOscuro
                            ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200 font-semibold ring-1 ring-emerald-600/50'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500/50';
                        } else if (opt.marcadaPorAlumno && !opt.isCorrect) {
                          estiloFila = esOscuro
                            ? 'bg-rose-950/40 border-rose-600 text-rose-200 font-semibold ring-1 ring-rose-600/50'
                            : 'bg-rose-50 border-rose-500 text-rose-950 font-semibold ring-1 ring-rose-500/50';
                        }

                        return (
                          <div
                            key={opt.indice}
                            className={`p-3.5 rounded-xl border text-xs sm:text-sm grid grid-cols-[minmax(0,1fr)_8.75rem] sm:grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-3 ${estiloFila}`}
                          >
                            <span className="leading-relaxed min-w-0 text-pretty">
                              {formatearTexto(opt.text)}
                            </span>

                            <div className="flex justify-end">
                              {opt.isCorrect && (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border whitespace-nowrap bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700">
                                  Respuesta correcta
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No hay desglose disponible para este intento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
