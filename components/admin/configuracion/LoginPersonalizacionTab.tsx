'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Code2, 
  Eye, 
  Save, 
  HelpCircle, 
  Video, 
  CheckCircle2, 
  RotateCcw,
  FileCode,
  ExternalLink,
  Layers
} from 'lucide-react';
import { PLANTILLAS_PREDEFINIDAS, type ModoLoginContenido } from '@/lib/types/loginBanner';

export function LoginPersonalizacionTab() {
  const [modo, setModo] = useState<ModoLoginContenido>('contactos');
  const [tituloCampana, setTituloCampana] = useState('');
  const [htmlPersonalizado, setHtmlPersonalizado] = useState('');
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/configuracion-login');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setModo(data.config.modo || 'contactos');
          setTituloCampana(data.config.tituloCampana || '');
          setHtmlPersonalizado(data.config.htmlPersonalizado || '');
        }
      }
    } catch (e) {
      console.error('Error cargando configuración del login:', e);
    } finally {
      setCargando(false);
    }
  };

  const handleSubirArchivoHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setHtmlPersonalizado(content);
        if (!tituloCampana) {
          const nombreLimpio = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTituloCampana(nombreLimpio);
        }
        setMensaje({ tipo: 'exito', texto: `Archivo "${file.name}" cargado exitosamente en el editor.` });
        setTimeout(() => setMensaje(null), 4000);
      }
    };
    reader.readAsText(file);
    // Limpiar input para permitir subir el mismo archivo si se edita
    e.target.value = '';
  };

  const handleAplicarPlantilla = (plantillaId: string) => {
    const seleccionada = PLANTILLAS_PREDEFINIDAS.find(p => p.id === plantillaId);
    if (!seleccionada) return;
    setHtmlPersonalizado(seleccionada.html);
    setTituloCampana(seleccionada.nombre.replace(/^[^\w\s]+/, '').trim());
    setMensaje({ tipo: 'exito', texto: `Plantilla "${seleccionada.nombre}" aplicada al editor.` });
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/configuracion-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo,
          tituloCampana,
          htmlPersonalizado
        })
      });

      if (res.ok) {
        setMensaje({ 
          tipo: 'exito', 
          texto: '¡Configuración guardada y publicada! Los cambios ya están visibles en la pantalla de login.' 
        });
        setTimeout(() => setMensaje(null), 5000);
      } else {
        const errData = await res.json();
        setMensaje({ tipo: 'error', texto: errData.error || 'Error al guardar la configuración.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
        <p className="text-xs text-slate-500 font-medium">Cargando personalización del login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Mensaje de Alerta */}
      {mensaje && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-sm ${
          mensaje.tipo === 'exito' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{mensaje.texto}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setMensaje(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Selector de Modo de Visualización en el Login */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="size-4 text-indigo-600" />
            <span>¿Qué deseas mostrar en el lado izquierdo del login?</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Elige el tipo de contenido que verán los estudiantes sobre el video institucional al entrar al aula virtual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Opción 1: Canales de contacto */}
          <button
            type="button"
            onClick={() => setModo('contactos')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              modo === 'contactos'
                ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-9 rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center font-bold">
                <HelpCircle className="size-5" />
              </div>
              {modo === 'contactos' && (
                <span className="size-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Canales de soporte y ayuda</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Muestra las tarjetas oficiales de WhatsApp para consultas académicas, pagos, correo y teléfono institucional.
              </p>
            </div>
          </button>

          {/* Opción 2: Campaña / HTML Personalizado */}
          <button
            type="button"
            onClick={() => setModo('html')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              modo === 'html'
                ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-9 rounded-xl bg-amber-100 text-amber-700 grid place-items-center font-bold">
                <Sparkles className="size-5" />
              </div>
              {modo === 'html' && (
                <span className="size-2 rounded-full bg-amber-600 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Campaña o HTML personalizado</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Sube o pega tu propio diseño HTML (cartel navideño, afiche de nuevos diplomados, comunicado, etc.).
              </p>
            </div>
          </button>

          {/* Opción 3: Solo video limpio */}
          <button
            type="button"
            onClick={() => setModo('vacio')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              modo === 'vacio'
                ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`size-9 rounded-xl grid place-items-center font-bold ${
                modo === 'vacio' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                <Video className="size-5" />
              </div>
              {modo === 'vacio' && (
                <span className="size-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <div>
              <p className={`text-sm font-bold ${modo === 'vacio' ? 'text-white' : 'text-slate-900'}`}>
                Solo video de fondo
              </p>
              <p className={`text-[11px] mt-1 leading-relaxed ${modo === 'vacio' ? 'text-slate-300' : 'text-slate-500'}`}>
                Pantalla limpia mostrando únicamente el video institucional de operaciones mineras y el logotipo de EDUMIN.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Área de Editor de HTML (Solo si el modo es 'html') */}
      {modo === 'html' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          
          {/* Cabecera y Herramientas Rápidas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="size-4 text-amber-600" />
                <span>Editor de contenido HTML para la campaña</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Puedes subir un archivo <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.html</code> que hayas diseñado o escribir el código directamente.
              </p>
            </div>

            {/* Botones de acción rápida: Subir archivo y plantillas */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleSubirArchivoHtml}
                className="hidden"
                id="upload-html-file"
              />
              <label
                htmlFor="upload-html-file"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                title="Cargar un archivo .html desde tu computadora"
              >
                <Upload className="size-3.5" />
                <span>Subir archivo .html</span>
              </label>

              {/* Selector de Plantillas */}
              <div className="relative inline-block">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAplicarPlantilla(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer outline-none"
                >
                  <option value="" disabled>Seleccionar plantilla rápida...</option>
                  {PLANTILLAS_PREDEFINIDAS.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Botón Limpiar */}
              {htmlPersonalizado && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Deseas vaciar el contenido del editor?')) {
                      setHtmlPersonalizado('');
                    }
                  }}
                  className="px-2.5 py-2 text-slate-400 hover:text-rose-600 transition text-xs font-semibold"
                  title="Vaciar editor"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Nombre descriptivo de la campaña */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="titulo-campana">
              Nombre de la campaña o cartel (opcional, para tu control):
            </label>
            <input
              id="titulo-campana"
              type="text"
              value={tituloCampana}
              onChange={(e) => setTituloCampana(e.target.value)}
              placeholder="Ej: Campaña Navideña 2026, Inicio de Diplomados Enero, etc."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm text-slate-900 outline-none"
            />
          </div>

          {/* Grid: Editor a la Izquierda + Vista Previa a la Derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* Columna Izquierda: Textarea con Código HTML */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Código HTML & Tailwind / CSS:</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {htmlPersonalizado.length} caracteres
                </span>
              </div>
              <textarea
                value={htmlPersonalizado}
                onChange={(e) => setHtmlPersonalizado(e.target.value)}
                placeholder="Pega aquí tu código HTML con clases de Tailwind CSS o estilos en línea..."
                rows={16}
                spellCheck={false}
                className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none resize-y leading-relaxed shadow-inner"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Tip:</strong> Puedes usar clases estándar de Tailwind CSS (como <code>bg-amber-500</code>, <code>rounded-2xl</code>, <code>text-white</code>, <code>font-bold</code>), imágenes con etiquetas <code>&lt;img&gt;</code> y enlaces con <code>&lt;a target=&quot;_blank&quot;&gt;</code>.
              </p>
            </div>

            {/* Columna Derecha: Vista Previa en Vivo del Login */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span className="flex items-center gap-1.5">
                  <Eye className="size-3.5 text-indigo-600" />
                  <span>Vista previa en tiempo real (sobre fondo oscuro del Login):</span>
                </span>
                <a
                  href="/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold inline-flex items-center gap-1"
                >
                  <span>Abrir /login</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Contenedor que simula la pantalla izquierda del login */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[360px] flex flex-col justify-between relative overflow-hidden shadow-inner">
                {/* Gradiente idéntico al login */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-slate-950/95 pointer-events-none" />

                {/* Header con Logo */}
                <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <img
                    src="/logo-blanco.png"
                    alt="EDUMIN"
                    className="h-7 w-auto object-contain"
                  />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Simulación de Login
                  </span>
                </div>

                {/* Renderizado en Vivo del HTML */}
                <div className="relative z-10 my-auto py-4">
                  {htmlPersonalizado.trim() ? (
                    <div 
                      className="w-full"
                      dangerouslySetInnerHTML={{ __html: htmlPersonalizado }}
                    />
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs italic">
                      Escribe o pega código HTML a la izquierda para ver cómo lucirá aquí.
                    </div>
                  )}
                </div>

                {/* Footer del login simulado */}
                <div className="relative z-10 text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                  Instituto Internacional EDUMIN • Plataforma de especialización minera
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. Botón Principal de Guardar y Publicar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          <p className="font-bold text-slate-900">Estado actual seleccionado:</p>
          <p className="text-slate-500">
            {modo === 'contactos' && '✓ Mostrando tarjetas oficiales de ayuda y WhatsApp.'}
            {modo === 'html' && `✓ Mostrando campaña personalizada ${tituloCampana ? `("${tituloCampana}")` : ''}.`}
            {modo === 'vacio' && '✓ Mostrando únicamente el video institucional sin tarjetas.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {guardando ? (
            <>
              <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Publicando cambios...</span>
            </>
          ) : (
            <>
              <Save className="size-4" />
              <span>Guardar y publicar en el login</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
