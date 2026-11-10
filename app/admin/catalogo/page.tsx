'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Settings, LogOut, 
  ShieldCheck, Activity, X, Layers, ChevronRight, ChevronDown, ChevronUp, UploadCloud, Plus, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Download, Search, Edit3, Trash2, Code, Sparkles, Folder, Table, PlayCircle, Video, FileText
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useTabSlug } from '@/lib/hooks/useTabSlug';
import * as XLSX from 'xlsx';
import { convertirModulosALeccionRows } from '@/lib/data/diplomadosLeccionesService';

export default function CatalogoAdminPage() {
  const [activeTab, setActiveTab] = useTabSlug<'diplomados' | 'cursos' | 'talleres'>('diplomados', ['diplomados', 'cursos', 'talleres'] as const);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModulesModal, setShowBulkModulesModal] = useState(false);
  
  // Filtro de búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Objeto en edición (Diplomado, Curso o Taller)
  const [itemEditando, setItemEditando] = useState<any>(null);
  const [bulkModulesJson, setBulkModulesJson] = useState('');

  // Estados de acordeón colapsable para edición limpia y ordenada (UI/UX progresiva)
  const [moduloExpandido, setModuloExpandido] = useState<number | null>(null);
  const [temaExpandido, setTemaExpandido] = useState<number | null>(null);
  const [cursoTemaExpandido, setCursoTemaExpandido] = useState<number | null>(null);

  // Selección múltiple para eliminación en lote
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  
  // Estado de carga y mensajes
  const [cargandoSupabase, setCargandoSupabase] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario de creación
  const [nuevoTipo, setNuevoTipo] = useState<'diplomado' | 'curso' | 'taller'>('diplomado');
  const [nuevoCodigo, setNuevoCodigo] = useState('DIP-23');
  const [nuevaVersion, setNuevaVersion] = useState('Versión 1');
  const [nuevoAno, setNuevoAno] = useState('2026');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoDocente, setNuevoDocente] = useState('');
  const [nuevoNumModulos, setNuevoNumModulos] = useState('3');
  const [nuevoTallerAplicable, setNuevoTallerAplicable] = useState('TAL-02: Taller de Seguridad Basada en el Comportamiento');
  const [nuevoPrecio, setNuevoPrecio] = useState('150.00');
  const [nuevaDuracion, setNuevaDuracion] = useState('325 horas académicas');
  const [nuevosCreditos, setNuevosCreditos] = useState('13');

  // Estado para archivo CSV
  const [archivoImportado, setArchivoImportado] = useState<File | null>(null);

  // Catálogos desde Supabase public.cursos
  const [catalogoDiplomados, setCatalogoDiplomados] = useState<any[]>([]);
  const [catalogoCursos, setCatalogoCursos] = useState<any[]>([]);
  const [catalogoTalleres, setCatalogoTalleres] = useState<any[]>([]);

  useEffect(() => {
    cargarCatalogoSupabase();
  }, []);

  const cargarCatalogoSupabase = async () => {
    setCargandoSupabase(true);
    try {
      const res = await fetch('/api/admin/catalogo');
      if (res.ok) {
        const data = await res.json();
        const dips = (data.diplomados || []).filter((d: any) => 
          (d.tipo === 'diplomado' || d.codigo?.toUpperCase().startsWith('DIP-')) &&
          !d.codigo?.toUpperCase().startsWith('CUR-') &&
          !d.codigo?.toUpperCase().startsWith('TAL-')
        );
        const curs = (data.cursosEspecializacion || []).filter((c: any) => 
          (c.tipo === 'curso' || c.codigo?.toUpperCase().startsWith('CUR-')) &&
          !c.codigo?.toUpperCase().startsWith('DIP-') &&
          !c.codigo?.toUpperCase().startsWith('TAL-')
        );
        const tals = (data.talleres || []).filter((t: any) => 
          (t.tipo === 'taller' || t.codigo?.toUpperCase().startsWith('TAL-')) &&
          !t.codigo?.toUpperCase().startsWith('DIP-') &&
          !t.codigo?.toUpperCase().startsWith('CUR-')
        );
        setCatalogoDiplomados(dips);
        setCatalogoCursos(curs);
        setCatalogoTalleres(tals);
      }
    } catch (err) {
      console.error('Error al cargar catálogo de Supabase:', err);
    } finally {
      setCargandoSupabase(false);
    }
  };

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoCodigo.trim()) return;

    const idGenerado = `${nuevoTipo}-${nuevoCodigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    
    try {
      const categoriaMap = {
        diplomado: 'Legal y cumplimiento',
        curso: 'Seguridad y prevención',
        taller: 'Taller'
      };

      const numModulos = nuevoTipo === 'diplomado' ? Number(nuevoNumModulos) || 3 : 0;

      const modulosIniciales = nuevoTipo === 'diplomado' ? Array.from({ length: numModulos }, (_, i) => {
        return {
          codigo: `Módulo ${(i + 1).toString().padStart(2, '0')}`,
          nombre: `MÓDULO ${(i + 1).toString().padStart(2, '0')}`,
          docente: nuevoDocente,
          temas: [
            {
              titulo: `Tema ${(i * 3 + 1).toString().padStart(2, '0')}: Fundamentos y Marco Teórico`,
              clases: [
                { titulo: 'Clase 1: Introducción y Conceptos Clave', videoUrl: '', iframe_url: '' },
                { titulo: 'Clase 2: Aplicación Práctica I', videoUrl: '', iframe_url: '' }
              ]
            }
          ]
        };
      }) : [
        {
          codigo: 'Clases',
          nombre: 'Clases del Programa',
          clases: [
            { id: 'parte-1', titulo: 'Parte 1', videoUrl: '', iframe_url: '', material1: '', material2: '', pdfUrl: '', excelUrl: '' }
          ]
        }
      ];

      const modsProcesados = nuevoTipo === 'diplomado'
        ? asegurarTemasYSecuenciarClases(modulosIniciales)
        : modulosIniciales;

      const res = await fetch('/api/admin/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idGenerado,
          codigo: nuevoCodigo.toUpperCase(),
          version: nuevaVersion,
          ano: Number(nuevoAno) || 2026,
          titulo: nuevoTitulo.toUpperCase(),
          tipo: nuevoTipo,
          categoria: categoriaMap[nuevoTipo],
          num_modulos: numModulos,
          taller_aplicable: nuevoTipo === 'diplomado' ? nuevoTallerAplicable : null,
          docente: nuevoDocente,
          horas: Number(nuevaDuracion) || 30,
          creditos: Number(nuevosCreditos) || 0,
          nivel: null,
          precio: Number(nuevoPrecio) || 150.00,
          modulos: modsProcesados
        })
      });

      const data = await res.json();

      if (res.ok) {
        await cargarCatalogoSupabase();
        setActiveTab(nuevoTipo === 'diplomado' ? 'diplomados' : nuevoTipo === 'taller' ? 'talleres' : 'cursos');
        setNuevoTitulo('');
        setShowCreateModal(false);
        setMensajeExito(`¡Producto [${nuevoCodigo.toUpperCase()}] registrado exitosamente en Supabase!`);
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert(`Error al guardar en Supabase: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error de conexión con el servidor: ${err.message}`);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditando) return;

    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemEditando.id,
          tipo: itemEditando.tipo,
          codigo: itemEditando.codigo,
          version: itemEditando.version,
          ano: itemEditando.ano,
          titulo: itemEditando.titulo,
          categoria: itemEditando.categoria,
          nivel: itemEditando.nivel || null,
          num_modulos: itemEditando.tipo === 'diplomado' ? itemEditando.num_modulos : 0,
          taller_aplicable: itemEditando.tipo === 'diplomado' ? itemEditando.taller_aplicable : null,
          docente: itemEditando.docente,
          horas: itemEditando.horas !== undefined ? itemEditando.horas : 30,
          creditos: Number(itemEditando.creditos) || 0,
          precio: itemEditando.precio,
          modulos: itemEditando.modulos || [],
          lecciones: itemEditando.lecciones || []
        })
      });

      if (res.ok) {
        await cargarCatalogoSupabase();
        setShowEditModal(false);
        setItemEditando(null);
        setMensajeExito("¡Producto, temas, clases y tabla lecciones actualizados correctamente en Supabase!");
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert("No se pudo actualizar en Supabase.");
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    }
  };

  // Helper para asegurar la estructura de Temas y Sesiones con numeración secuencial de clases
  const asegurarTemasYSecuenciarClases = (modulos: any[]) => {
    if (!Array.isArray(modulos)) return [];
    let contadorClaseGlobal = 1;
    let contadorTemaGlobal = 1;

    return modulos.map((mod: any, mIdx: number) => {
      const codigoModulo = `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`;
      let temasInput = Array.isArray(mod.temas) && mod.temas.length > 0 ? mod.temas : null;

      if (!temasInput) {
        const clasesFlat = Array.isArray(mod.clases) && mod.clases.length > 0
          ? mod.clases
          : [
              { titulo: 'Sesión Magistral de Introducción', videoUrl: '', iframe_url: '' },
              { titulo: 'Casuística Aplicada', videoUrl: '', iframe_url: '' }
            ];

        let hasExplicitOrRepeatingTema = false;
        const temaNamesSeen: string[] = [];

        clasesFlat.forEach((cItem: any) => {
          const isObj = typeof cItem === 'object' && cItem !== null;
          const tName = isObj ? (cItem.tema || cItem.titulo || '') : String(cItem);
          const cleanName = tName.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').replace(/\s*\(Parte\s*\d+\)$/i, '').trim();
          if (isObj && cItem.tema) hasExplicitOrRepeatingTema = true;
          if (cleanName && temaNamesSeen.includes(cleanName.toLowerCase())) hasExplicitOrRepeatingTema = true;
          if (cleanName) temaNamesSeen.push(cleanName.toLowerCase());
        });

        temasInput = [];

        if (hasExplicitOrRepeatingTema) {
          let currentGroup: { titulo: string; clases: any[] } | null = null;
          clasesFlat.forEach((cItem: any) => {
            const isObj = typeof cItem === 'object' && cItem !== null;
            const rawTit = isObj ? (cItem.tema || cItem.titulo || '') : String(cItem);
            const temaLimpio = rawTit.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').replace(/\s*\(Parte\s*\d+\)$/i, '').trim();

            if (currentGroup && currentGroup.titulo.toLowerCase() === temaLimpio.toLowerCase()) {
              currentGroup.clases.push(cItem);
            } else {
              currentGroup = {
                titulo: temaLimpio || 'Especialización Aplicada',
                clases: [cItem]
              };
              temasInput.push(currentGroup);
            }
          });
        } else {
          for (let i = 0; i < clasesFlat.length; i += 2) {
            const chunk = clasesFlat.slice(i, i + 2);
            const firstItem = chunk[0];
            const firstClaseTitle = typeof firstItem === 'object' ? (firstItem?.titulo || '') : String(firstItem || '');
            const nombreTemaLimpio = firstClaseTitle.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').trim();

            const tNum = Math.floor(i / 2) + 1;
            const tNumGlobal = (mIdx * 3) + tNum;
            const tNumStr = tNumGlobal < 10 ? `0${tNumGlobal}` : `${tNumGlobal}`;

            temasInput.push({
              titulo: `Tema ${tNumStr}: ${nombreTemaLimpio || 'Fundamentos y Gestión Aplicada'}`,
              clases: chunk
            });
          }
        }
      }

      const temasProcesados = temasInput.map((tObj: any) => {
        const numTema = contadorTemaGlobal++;
        const numTemaStr = numTema < 10 ? `0${numTema}` : `${numTema}`;
        const rawTitulo = tObj.titulo || `Tema ${numTemaStr}`;
        const temaLimpio = rawTitulo
          .replace(/^Tema\s*\d+[:\-\s]*/i, '')
          .replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '')
          .trim();
        const temaTituloFinal = `Tema ${numTemaStr}: ${temaLimpio}`;

        const rawClases = Array.isArray(tObj.clases) ? tObj.clases : [];
        const clasesProcesadas = rawClases.map((claseItem: any) => {
          const numClase = contadorClaseGlobal++;
          const isObj = typeof claseItem === 'object' && claseItem !== null;
          const claseText = isObj ? (claseItem.titulo || '') : String(claseItem);
          const nombreLimpio = claseText.replace(/^Clase \d+[\s:\-]+/i, '').trim();
          const tituloFormateado = `Clase ${numClase}: ${nombreLimpio || 'Nueva Clase'}`;

          const videoUrlVal = isObj ? (claseItem.videoUrl || claseItem.iframe_url || claseItem.VideoUrl || '') : '';
          const pdfUrlVal = isObj ? (claseItem.pdf_url || claseItem.pdfUrl || claseItem.PdfUrl || '') : '';
          const excelUrlVal = isObj ? (claseItem.excel_url || claseItem.excelUrl || claseItem.material1 || claseItem.Material1 || '') : '';
          const videoResumenVal = isObj ? (claseItem.videoResumenUrl || claseItem.resumenVideoUrl || claseItem.ResumenVideoUrl || '') : '';
          const audioResumenVal = isObj ? (claseItem.audioResumenUrl || claseItem.resumenAudioUrl || claseItem.ResumenAudioUrl || '') : '';
          const resumenInteractivoVal = isObj ? (claseItem.resumenInteractivo || claseItem.ResumenInteractivo || '') : '';
          const material1Val = isObj ? (claseItem.material1 || claseItem.Material1 || excelUrlVal || '') : '';
          const material2Val = isObj ? (claseItem.material2 || claseItem.Material2 || '') : '';

          return {
            ...(isObj ? claseItem : {}),
            titulo: tituloFormateado,
            videoUrl: videoUrlVal,
            iframe_url: videoUrlVal,
            pdf_url: pdfUrlVal,
            pdfUrl: pdfUrlVal,
            excel_url: excelUrlVal,
            excelUrl: excelUrlVal,
            videoResumenUrl: videoResumenVal,
            resumenVideoUrl: videoResumenVal,
            audioResumenUrl: audioResumenVal,
            resumenAudioUrl: audioResumenVal,
            resumenInteractivo: resumenInteractivoVal,
            material1: material1Val,
            material2: material2Val
          };
        });

        return {
          ...tObj,
          titulo: temaTituloFinal,
          clases: clasesProcesadas
        };
      });

      const clasesFlatMod = temasProcesados.flatMap((t: any) => t.clases);

      return {
        ...mod,
        codigo: codigoModulo,
        temas: temasProcesados,
        clases: clasesFlatMod
      };
    });
  };

  // Funciones para manipular Módulos, Temas y Sesiones
  const agregarModuloEditando = () => {
    if (!itemEditando) return;
    const actualMods = itemEditando.modulos || [];
    const nuevoNum = actualMods.length + 1;

    const nuevoMod = {
      codigo: `Módulo ${nuevoNum.toString().padStart(2, '0')}`,
      nombre: `MÓDULO ${nuevoNum.toString().padStart(2, '0')}: NUEVO MÓDULO`,
      docente: itemEditando.docente || 'Reginaldo Andía',
      temas: [
        {
          titulo: `Tema ${(nuevoNum * 3 - 2).toString().padStart(2, '0')}: Fundamentos del Módulo`,
          clases: [
            { titulo: 'Nueva Clase', videoUrl: '', iframe_url: '', pdf_url: '', excel_url: '', videoResumenUrl: '', audioResumenUrl: '' }
          ]
        }
      ]
    };

    const modsSecuenciados = asegurarTemasYSecuenciarClases([...actualMods, nuevoMod]);
    setItemEditando({
      ...itemEditando,
      modulos: modsSecuenciados,
      num_modulos: modsSecuenciados.length
    });
  };

  const eliminarModuloEditando = (mIdx: number) => {
    if (!itemEditando) return;
    const actualMods = itemEditando.modulos.filter((_: any, idx: number) => idx !== mIdx);
    const modsSecuenciados = asegurarTemasYSecuenciarClases(actualMods);
    setItemEditando({
      ...itemEditando,
      modulos: modsSecuenciados,
      num_modulos: modsSecuenciados.length
    });
  };

  const actualizarModuloEditando = (mIdx: number, campo: string, valor: any) => {
    if (!itemEditando) return;
    const nuevosMods = [...itemEditando.modulos];
    nuevosMods[mIdx] = { ...nuevosMods[mIdx], [campo]: valor };
    setItemEditando({ ...itemEditando, modulos: nuevosMods });
  };

  const agregarTemaAModulo = (mIdx: number) => {
    if (!itemEditando) return;
    const nuevosMods = JSON.parse(JSON.stringify(itemEditando.modulos));
    const modActual = nuevosMods[mIdx];
    const temasActuales = modActual.temas || [];
    
    temasActuales.push({
      titulo: `Nuevo Tema Especializado`,
      clases: [
        { titulo: 'Nueva Clase', videoUrl: '', iframe_url: '', pdf_url: '', excel_url: '', videoResumenUrl: '', audioResumenUrl: '' }
      ]
    });
    
    modActual.temas = temasActuales;
    const modsSecuenciados = asegurarTemasYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const eliminarTemaDeModulo = (mIdx: number, tIdx: number) => {
    if (!itemEditando) return;
    const nuevosMods = JSON.parse(JSON.stringify(itemEditando.modulos));
    const modActual = nuevosMods[mIdx];
    modActual.temas = (modActual.temas || []).filter((_: any, idx: number) => idx !== tIdx);

    const modsSecuenciados = asegurarTemasYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const actualizarTituloTema = (mIdx: number, tIdx: number, titulo: string) => {
    if (!itemEditando) return;
    const nuevosMods = JSON.parse(JSON.stringify(itemEditando.modulos));
    nuevosMods[mIdx].temas[tIdx].titulo = titulo;
    setItemEditando({ ...itemEditando, modulos: nuevosMods });
  };

  const agregarSesionATema = (mIdx: number, tIdx: number) => {
    if (!itemEditando) return;
    const nuevosMods = JSON.parse(JSON.stringify(itemEditando.modulos));
    const temaActual = nuevosMods[mIdx].temas[tIdx];
    temaActual.clases = temaActual.clases || [];
    temaActual.clases.push({
      titulo: 'Nueva Sesión',
      videoUrl: '',
      iframe_url: '',
      pdf_url: '',
      excel_url: '',
      videoResumenUrl: '',
      audioResumenUrl: ''
    });

    const modsSecuenciados = asegurarTemasYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const actualizarCampoSesion = (mIdx: number, tIdx: number, sIdx: number, campo: string, valor: string) => {
    if (!itemEditando) return;
    const nuevosMods = JSON.parse(JSON.stringify(itemEditando.modulos));
    const sesionActual = nuevosMods[mIdx].temas[tIdx].clases[sIdx];
    
    if (typeof sesionActual === 'object' && sesionActual !== null) {
      sesionActual[campo] = valor;
      if (campo === 'iframe_url' || campo === 'videoUrl') {
        sesionActual.iframe_url = valor;
        sesionActual.videoUrl = valor;
      }
      if (campo === 'pdf_url' || campo === 'pdfUrl') {
        sesionActual.pdf_url = valor;
        sesionActual.pdfUrl = valor;
      }
      if (campo === 'videoResumenUrl' || campo === 'resumenVideoUrl') {
        sesionActual.videoResumenUrl = valor;
        sesionActual.resumenVideoUrl = valor;
      }
      if (campo === 'audioResumenUrl' || campo === 'resumenAudioUrl') {
        sesionActual.audioResumenUrl = valor;
        sesionActual.resumenAudioUrl = valor;
      }
      if (campo === 'material1') {
        sesionActual.material1 = valor;
        sesionActual.excel_url = valor;
        sesionActual.excelUrl = valor;
      }
    } else {
      nuevosMods[mIdx].temas[tIdx].clases[sIdx] = {
        titulo: String(sesionActual),
        [campo]: valor,
        videoUrl: (campo === 'iframe_url' || campo === 'videoUrl') ? valor : '',
        iframe_url: (campo === 'iframe_url' || campo === 'videoUrl') ? valor : '',
        pdf_url: (campo === 'pdf_url' || campo === 'pdfUrl') ? valor : '',
        pdfUrl: (campo === 'pdf_url' || campo === 'pdfUrl') ? valor : '',
        material1: campo === 'material1' ? valor : ''
      };
    }

    const modsSecuenciados = asegurarTemasYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  const eliminarSesionDeTema = (mIdx: number, tIdx: number, sIdx: number) => {
    if (!itemEditando) return;
    const nuevosMods = JSON.parse(JSON.stringify(itemEditando.modulos));
    nuevosMods[mIdx].temas[tIdx].clases = nuevosMods[mIdx].temas[tIdx].clases.filter((_: any, idx: number) => idx !== sIdx);

    const modsSecuenciados = asegurarTemasYSecuenciarClases(nuevosMods);
    setItemEditando({ ...itemEditando, modulos: modsSecuenciados });
  };

  // =========================================================
  // HELPERS PARA TEMAS Y LECCIONES DE CURSOS Y TALLERES (SINCRONIZADOS CON SUPABASE)
  // =========================================================
  const actualizarLeccionCurso = (lIdx: number, campo: string, valor: string) => {
    if (!itemEditando || !Array.isArray(itemEditando.lecciones)) return;
    const nuevasLecciones = [...itemEditando.lecciones];
    nuevasLecciones[lIdx] = {
      ...nuevasLecciones[lIdx],
      [campo]: valor
    };
    setItemEditando({ ...itemEditando, lecciones: nuevasLecciones });
  };

  const agregarTemaCurso = () => {
    if (!itemEditando) return;
    const leccionesActuales = Array.isArray(itemEditando.lecciones) ? [...itemEditando.lecciones] : [];
    const nuevoNum = (leccionesActuales.length + 1).toString().padStart(2, '0');
    leccionesActuales.push({
      id: `temp-${Date.now()}`,
      tema: `Tema ${nuevoNum}: Nuevo Tema Oficial`,
      sesion: 'Parte 1',
      videoUrl: '',
      pdfUrl: '',
      resumenVideoUrl: '',
      resumenTexto: ''
    });
    setItemEditando({ ...itemEditando, lecciones: leccionesActuales });
    setCursoTemaExpandido(leccionesActuales.length - 1);
  };

  const eliminarTemaCurso = (lIdx: number) => {
    if (!itemEditando || !Array.isArray(itemEditando.lecciones)) return;
    const nuevasLecciones = itemEditando.lecciones.filter((_: any, idx: number) => idx !== lIdx);
    setItemEditando({ ...itemEditando, lecciones: nuevasLecciones });
    if (cursoTemaExpandido === lIdx) setCursoTemaExpandido(null);
  };

  // =========================================================
  // HELPERS PARA CURSOS Y TALLERES (PARTES 1 A 6)
  // =========================================================
  const obtenerClasesCursoEditando = (item: any): any[] => {
    if (!item) return [];
    if (Array.isArray(item.modulos) && item.modulos.length > 0) {
      if (Array.isArray(item.modulos[0]?.clases)) {
        return item.modulos[0].clases;
      }
    }
    if (Array.isArray(item.clases)) {
      return item.clases;
    }
    return [];
  };

  const actualizarClasesCursoEditando = (nuevasClases: any[]) => {
    const clasesFormateadas = nuevasClases.slice(0, 6).map((c, idx) => ({
      id: `parte-${idx + 1}`,
      titulo: `Parte ${idx + 1}`,
      videoUrl: c.videoUrl || c.iframe_url || '',
      iframe_url: c.videoUrl || c.iframe_url || '',
      material1: c.material1 || c.pdfUrl || '',
      material2: c.material2 || c.excelUrl || '',
      pdfUrl: c.material1 || c.pdfUrl || '',
      excelUrl: c.material2 || c.excelUrl || ''
    }));

    setItemEditando((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        num_modulos: 1,
        modulos: [
          {
            codigo: 'Clases',
            nombre: 'Clases del Programa',
            clases: clasesFormateadas
          }
        ]
      };
    });
  };

  const agregarParteCurso = () => {
    const clasesActuales = obtenerClasesCursoEditando(itemEditando);
    if (clasesActuales.length >= 6) {
      alert("Los Cursos y Talleres admiten un máximo de 6 partes.");
      return;
    }
    const nuevoNum = clasesActuales.length + 1;
    const nuevaParte = {
      id: `parte-${nuevoNum}`,
      titulo: `Parte ${nuevoNum}`,
      videoUrl: '',
      iframe_url: '',
      material1: '',
      material2: '',
      pdfUrl: '',
      excelUrl: ''
    };
    actualizarClasesCursoEditando([...clasesActuales, nuevaParte]);
  };

  const eliminarParteCurso = (idx: number) => {
    const clasesActuales = obtenerClasesCursoEditando(itemEditando);
    const filtradas = clasesActuales.filter((_, i) => i !== idx);
    actualizarClasesCursoEditando(filtradas);
  };

  const actualizarCampoParteCurso = (idx: number, campo: string, valor: string) => {
    const clasesActuales = [...obtenerClasesCursoEditando(itemEditando)];
    if (!clasesActuales[idx]) return;
    clasesActuales[idx] = {
      ...clasesActuales[idx],
      [campo]: valor
    };
    if (campo === 'videoUrl') {
      clasesActuales[idx].iframe_url = valor;
    } else if (campo === 'iframe_url') {
      clasesActuales[idx].videoUrl = valor;
    } else if (campo === 'material1') {
      clasesActuales[idx].pdfUrl = valor;
    } else if (campo === 'material2') {
      clasesActuales[idx].excelUrl = valor;
    }
    actualizarClasesCursoEditando(clasesActuales);
  };

  // Exportar estructura actual de módulos, temas y sesiones a CSV / Excel con las 20 columnas oficiales
  const descargarEstructuraCsvExcel = () => {
    if (!itemEditando || !Array.isArray(itemEditando.modulos)) {
      alert('No hay módulos disponibles para exportar.');
      return;
    }

    const headers = [
      'CodigoDiplomado', 'Diplomado', 'Modulo', 'NombreModulo', 'Docente',
      'Tema', 'Sesion', 'VideoUrl', 'PdfUrl', 'ResumenVideoUrl', 'ResumenAudioUrl',
      'ResumenInteractivo', 'Material1', 'Material2'
    ];
    const filas = convertirModulosALeccionRows(
      itemEditando.codigo || 'DIP-01',
      itemEditando.titulo || 'DIPLOMADO',
      itemEditando.modulos || []
    );

    const rows: string[][] = [headers];
    filas.forEach(f => {
      rows.push([
        f.CodigoDiplomado,
        f.Diplomado,
        f.Modulo,
        f.NombreModulo,
        f.Docente,
        f.Tema,
        f.Sesion,
        f.VideoUrl || '',
        f.PdfUrl || '',
        f.ResumenVideoUrl || '',
        f.ResumenAudioUrl || '',
        f.ResumenInteractivo || '',
        f.Material1 || '',
        f.Material2 || ''
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(row => 
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const nombreArchivo = `Estructura_${(itemEditando.codigo || 'DIP').replace(/[^a-zA-Z0-9]/g, '_')}_${(itemEditando.titulo || 'Programa').replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Descargar Estructura en Formato Excel (.XLSX) nativo con las 20 columnas oficiales
  const descargarEstructuraExcelXlsx = () => {
    if (!itemEditando) return;
    const filas = convertirModulosALeccionRows(
      itemEditando.codigo || 'DIP-01',
      itemEditando.titulo || 'DIPLOMADO',
      itemEditando.modulos || []
    );

    const data = filas.map(f => ({
      CodigoDiplomado: f.CodigoDiplomado,
      Diplomado: f.Diplomado,
      Modulo: f.Modulo,
      NombreModulo: f.NombreModulo,
      Docente: f.Docente,
      Tema: f.Tema,
      Sesion: f.Sesion,
      VideoUrl: f.VideoUrl || '',
      PdfUrl: f.PdfUrl || '',
      ResumenVideoUrl: f.ResumenVideoUrl || '',
      ResumenAudioUrl: f.ResumenAudioUrl || '',
      ResumenInteractivo: f.ResumenInteractivo || '',
      Material1: f.Material1 || '',
      Material2: f.Material2 || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estructura');
    const nombreArchivo = `Estructura_${(itemEditando.codigo || 'DIP').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  // Descargar Plantilla Ejemplo CSV con las 14 Columnas oficiales
  const descargarPlantillaEjemploCsv = () => {
    const headers = [
      'CodigoDiplomado', 'Diplomado', 'Modulo', 'NombreModulo', 'Docente',
      'Tema', 'Sesion', 'VideoUrl', 'PdfUrl', 'ResumenVideoUrl', 'ResumenAudioUrl',
      'ResumenInteractivo', 'Material1', 'Material2'
    ];
    const sampleRows = [
      headers,
      ['DIP-01', 'GEOTECNIA Y MECÁNICA DE ROCAS', 'Módulo 01', 'GEOTECNIA Y MECÁNICA DE ROCAS', 'Ing. Manuel Aucapuri', 'Tema 01: Fundamentos Geotécnicos', 'Parte 1', 'https://drive.google.com/file/d/1/preview', 'https://.../separata.pdf', 'https://.../resumen.mp4', 'https://.../audio.mp3', 'https://.../interactivo.html', 'https://.../plantilla.xlsx', ''],
      ['DIP-01', 'GEOTECNIA Y MECÁNICA DE ROCAS', 'Módulo 01', 'GEOTECNIA Y MECÁNICA DE ROCAS', 'Ing. Manuel Aucapuri', 'Tema 01: Fundamentos Geotécnicos', 'Parte 2', 'https://drive.google.com/file/d/2/preview', '', '', '', '', '', ''],
      ['DIP-01', 'GEOTECNIA Y MECÁNICA DE ROCAS', 'Módulo 02', 'MONITOREO GEOTÉCNICO', 'Ing. Mario Hilasaca', 'Tema 02: Instrumentación en Minas', 'Parte 1', 'https://drive.google.com/file/d/3/preview', '', '', '', '', '', '']
    ];

    const csvContent = '\uFEFF' + sampleRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Plantilla_Estructura_Modulos_EDUMIN.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarPlantillaEjemploExcel = () => {
    const data = [
      {
        CodigoDiplomado: 'DIP-01',
        Diplomado: 'GEOTECNIA Y MECÁNICA DE ROCAS',
        Modulo: 'Módulo 01',
        NombreModulo: 'GEOTECNIA Y MECÁNICA DE ROCAS',
        Docente: 'Ing. Manuel Aucapuri',
        Tema: 'Tema 01: Fundamentos Geotécnicos',
        Sesion: 'Parte 1',
        VideoUrl: 'https://drive.google.com/file/d/1/preview',
        PdfUrl: 'https://.../separata.pdf',
        ResumenVideoUrl: 'https://.../resumen.mp4',
        ResumenAudioUrl: 'https://.../audio.mp3',
        ResumenInteractivo: 'https://.../interactivo.html',
        Material1: 'https://.../plantilla.xlsx',
        Material2: ''
      },
      {
        CodigoDiplomado: 'DIP-01',
        Diplomado: 'GEOTECNIA Y MECÁNICA DE ROCAS',
        Modulo: 'Módulo 01',
        NombreModulo: 'GEOTECNIA Y MECÁNICA DE ROCAS',
        Docente: 'Ing. Manuel Aucapuri',
        Tema: 'Tema 01: Fundamentos Geotécnicos',
        Sesion: 'Parte 2',
        VideoUrl: 'https://drive.google.com/file/d/2/preview',
        PdfUrl: '',
        ResumenVideoUrl: '',
        ResumenAudioUrl: '',
        ResumenInteractivo: '',
        Material1: '',
        Material2: ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, 'Plantilla_Estructura_Modulos_EDUMIN.xlsx');
  };

  // Procesar archivo seleccionado (admite tanto .xlsx, .xls como .csv/.txt)
  const procesarArchivoSeleccionado = async (file: File) => {
    setArchivoImportado(file);
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        setBulkModulesJson(csvText);
        procesarCargaCsvExcel(csvText);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target?.result as string;
          if (text) {
            setBulkModulesJson(text);
            procesarCargaCsvExcel(text);
          }
        };
        reader.readAsText(file, 'UTF-8');
      }
    } catch (err: any) {
      alert(`Error al procesar el archivo Excel/CSV: ${err?.message || err}`);
    }
  };

  // Importar CSV / Excel cargado por archivo o texto
  const procesarCargaCsvExcel = (csvRawText: string) => {
    if (!csvRawText.trim() || !itemEditando) return;

    try {
      const cleanText = csvRawText.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length <= 1) {
        alert('El archivo CSV/Excel no contiene filas de datos válidas.');
        return;
      }

      const parseCsvLine = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headerRow = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const dataRows = lines.slice(1).map(l => parseCsvLine(l));

      const colModulo = headerRow.findIndex(h => h.includes('modulo') && !h.includes('nombre'));
      const colNombreModulo = headerRow.findIndex(h => h.includes('nombremodulo') || h.includes('nombremod'));
      const colDocente = headerRow.findIndex(h => h.includes('docente'));
      const colTema = headerRow.findIndex(h => h.includes('tema'));
      const colSesion = headerRow.findIndex(h => h.includes('sesion') || h.includes('clase') || (h.includes('titulo') && !h.includes('diplomado') && !h.includes('modulo')));
      const colVideo = headerRow.findIndex(h => (h.includes('videourl') || h.includes('video') || h.includes('drive')) && !h.includes('resumen'));
      const colPdf = headerRow.findIndex(h => h.includes('pdf'));
      const colVideoResumen = headerRow.findIndex(h => h.includes('resumenvideo') || h.includes('videoresumen'));
      const colAudioResumen = headerRow.findIndex(h => h.includes('resumenaudio') || h.includes('audioresumen') || h.includes('audio'));
      const colResumenInteractivo = headerRow.findIndex(h => h.includes('interactivo') || h.includes('resumeninteractivo'));
      const colMat1 = headerRow.findIndex(h => h === 'material1' || h.includes('excel'));
      const colMat2 = headerRow.findIndex(h => h === 'material2');

      const modulesMap = new Map<string, any>();

      dataRows.forEach((row) => {
        const rawMod = colModulo !== -1 && row[colModulo] ? row[colModulo] : 'Módulo 01';
        if (!rawMod) return;

        const modKey = rawMod.trim();
        if (!modulesMap.has(modKey)) {
          modulesMap.set(modKey, {
            codigo: modKey,
            nombre: colNombreModulo !== -1 && row[colNombreModulo] ? row[colNombreModulo] : modKey,
            docente: colDocente !== -1 && row[colDocente] ? row[colDocente] : (itemEditando.docente || ''),
            temasMap: new Map<string, any[]>()
          });
        }

        const modObj = modulesMap.get(modKey)!;
        const rawTema = colTema !== -1 && row[colTema] && row[colTema].trim() ? row[colTema].trim() : 'Tema 01: General';

        if (!modObj.temasMap.has(rawTema)) {
          modObj.temasMap.set(rawTema, []);
        }

        const sesionTitle = colSesion !== -1 && row[colSesion] ? row[colSesion].trim() : 'Nueva Sesión';
        const videoUrl = colVideo !== -1 && row[colVideo] ? row[colVideo].trim() : '';
        const pdfUrl = colPdf !== -1 && row[colPdf] ? row[colPdf].trim() : '';
        const videoResumenUrl = colVideoResumen !== -1 && row[colVideoResumen] ? row[colVideoResumen].trim() : '';
        const audioResumenUrl = colAudioResumen !== -1 && row[colAudioResumen] ? row[colAudioResumen].trim() : '';
        const resumenInteractivo = colResumenInteractivo !== -1 && row[colResumenInteractivo] ? row[colResumenInteractivo].trim() : '';
        const mat1 = colMat1 !== -1 && row[colMat1] ? row[colMat1].trim() : '';
        const mat2 = colMat2 !== -1 && row[colMat2] ? row[colMat2].trim() : '';

        modObj.temasMap.get(rawTema)!.push({
          titulo: sesionTitle,
          videoUrl,
          iframe_url: videoUrl,
          pdfUrl,
          pdf_url: pdfUrl,
          videoResumenUrl,
          resumenVideoUrl: videoResumenUrl,
          audioResumenUrl,
          resumenAudioUrl: audioResumenUrl,
          resumenInteractivo,
          material1: mat1,
          material2: mat2,
          excel_url: mat1,
          excelUrl: mat1
        });
      });

      const parsedModulosArray = Array.from(modulesMap.values()).map(m => {
        const temasArr = (Array.from(m.temasMap.entries()) as [string, any[]][]).map(([tTitulo, clasesList]) => ({
          titulo: tTitulo,
          clases: clasesList
        }));
        return {
          codigo: m.codigo,
          nombre: m.nombre,
          docente: m.docente,
          temas: temasArr
        };
      });

      const modsSecuenciados = asegurarTemasYSecuenciarClases(parsedModulosArray);

      if (modsSecuenciados.length > 0) {
        setItemEditando({
          ...itemEditando,
          modulos: modsSecuenciados,
          num_modulos: modsSecuenciados.length
        });

        // Guardar automáticamente en lecciones si el diplomado tiene código
        if (itemEditando.codigo) {
          const filasParaTabla = convertirModulosALeccionRows(itemEditando.codigo, itemEditando.titulo, modsSecuenciados);
          fetch('/api/admin/diplomados-lecciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codigoDiplomado: itemEditando.codigo,
              rows: filasParaTabla
            })
          }).catch(err => console.warn('Aviso guardando en lecciones:', err));
        }

        setShowBulkModulesModal(false);
        setBulkModulesJson('');
        alert(`¡Carga por Excel/CSV exitosa! Se cargaron ${modsSecuenciados.length} módulos con sus temas, sesiones y recursos.`);
      } else {
        alert('No se pudieron procesar datos válidos del CSV/Excel.');
      }
    } catch (e: any) {
      alert(`Error al procesar archivo CSV/Excel: ${e.message}`);
    }
  };

  const procesarCargaMasivaModulos = () => {
    if (!bulkModulesJson.trim() || !itemEditando) return;

    if (bulkModulesJson.trim().startsWith('{') || bulkModulesJson.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(bulkModulesJson);
        const rawMods = Array.isArray(parsed) ? parsed : (parsed.modulos && Array.isArray(parsed.modulos) ? parsed.modulos : []);
        const modsSecuenciados = asegurarTemasYSecuenciarClases(rawMods);

        if (modsSecuenciados.length > 0) {
          setItemEditando({
            ...itemEditando,
            modulos: modsSecuenciados,
            num_modulos: modsSecuenciados.length
          });
          setShowBulkModulesModal(false);
          setBulkModulesJson('');
          alert(`¡Se cargaron masivamente ${modsSecuenciados.length} módulos!`);
        }
      } catch (e: any) {
        alert(`Error al procesar JSON: ${e.message}`);
      }
    } else {
      procesarCargaCsvExcel(bulkModulesJson);
    }
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSeleccionarTodos = () => {
    const idsVisibles = listaActual.map(item => item.id);
    const todosSeleccionados = idsVisibles.every(id => seleccionados.includes(id));

    if (todosSeleccionados) {
      setSeleccionados(prev => prev.filter(id => !idsVisibles.includes(id)));
    } else {
      setSeleccionados(prev => Array.from(new Set([...prev, ...idsVisibles])));
    }
  };

  const eliminarSeleccionados = async () => {
    if (seleccionados.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${seleccionados.length} producto(s) seleccionado(s) de Supabase?`)) return;

    try {
      const res = await fetch('/api/admin/catalogo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: seleccionados })
      });

      if (res.ok) {
        await cargarCatalogoSupabase();
        setSeleccionados([]);
        setMensajeExito("¡Productos eliminados correctamente de Supabase!");
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert("Error al eliminar los productos de Supabase.");
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    }
  };

  // Descarga Masiva del Catálogo Completo (22 Diplomados + Módulos + Temas) en Excel (.XLSX) con 20 Columnas
  const descargarCatalogoCompletoExcelXlsx = async () => {
    try {
      let rows: any[] = [];
      const res = await fetch('/api/admin/diplomados-lecciones');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.filas) && data.filas.length > 0) {
          rows = data.filas.map((f: any) => ({
            CodigoDiplomado: f.CodigoDiplomado || '',
            Diplomado: f.Diplomado || '',
            Modulo: f.Modulo || '',
            NombreModulo: f.NombreModulo || '',
            Docente: f.Docente || '',
            Tema: f.Tema || '',
            Sesion: f.Sesion || '',
            VideoUrl: f.VideoUrl || '',
            PdfUrl: f.PdfUrl || '',
            ResumenVideoUrl: f.ResumenVideoUrl || '',
            ResumenAudioUrl: f.ResumenAudioUrl || '',
            ResumenInteractivo: f.ResumenInteractivo || '',
            Material1: f.Material1 || '',
            Material2: f.Material2 || '',
          }));
        }
      }

      if (rows.length === 0) {
        catalogoDiplomados.forEach((dip: any) => {
          const modRows = convertirModulosALeccionRows(dip.codigo || 'DIP', dip.titulo || 'DIPLOMADO', dip.modulos || []);
          modRows.forEach(f => {
            rows.push({
              CodigoDiplomado: f.CodigoDiplomado,
              Diplomado: f.Diplomado,
              Modulo: f.Modulo,
              NombreModulo: f.NombreModulo,
              Docente: f.Docente,
              Tema: f.Tema,
              Sesion: f.Sesion,
              VideoUrl: f.VideoUrl || '',
              PdfUrl: f.PdfUrl || '',
              ResumenVideoUrl: f.ResumenVideoUrl || '',
              ResumenAudioUrl: f.ResumenAudioUrl || '',
              ResumenInteractivo: f.ResumenInteractivo || '',
              Material1: f.Material1 || '',
              Material2: f.Material2 || '',
            });
          });
        });
      }

      if (rows.length === 0) {
        alert('No hay datos de diplomados cargados para exportar.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogo_Diplomados');
      XLSX.writeFile(workbook, `Catalogo_Completo_EDUMIN_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      alert(`Error al exportar Excel: ${err.message}`);
    }
  };

  // Descarga Masiva del Catálogo Completo en CSV
  const descargarCatalogoCompletoCsv = async () => {
    try {
      const headers = [
        'CodigoDiplomado', 'Diplomado', 'Modulo', 'NombreModulo', 'Docente',
        'Tema', 'Sesion', 'VideoUrl', 'PdfUrl', 'ResumenVideoUrl', 'ResumenAudioUrl',
        'ResumenInteractivo', 'Material1', 'Material2'
      ];
      const rows: string[][] = [headers];

      let dataRows: any[] = [];
      const res = await fetch('/api/admin/diplomados-lecciones');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.filas) && data.filas.length > 0) {
          dataRows = data.filas;
        }
      }

      if (dataRows.length === 0) {
        catalogoDiplomados.forEach((dip: any) => {
          const modRows = convertirModulosALeccionRows(dip.codigo || 'DIP', dip.titulo || 'DIPLOMADO', dip.modulos || []);
          dataRows.push(...modRows);
        });
      }

      dataRows.forEach((f: any) => {
        rows.push([
          f.CodigoDiplomado || '',
          f.Diplomado || '',
          f.Modulo || '',
          f.NombreModulo || '',
          f.Docente || '',
          f.Tema || '',
          f.Sesion || '',
          f.VideoUrl || '',
          f.PdfUrl || '',
          f.ResumenVideoUrl || '',
          f.ResumenAudioUrl || '',
          f.ResumenInteractivo || '',
          f.Material1 || '',
          f.Material2 || ''
        ]);
      });

      if (rows.length <= 1) {
        alert('No hay datos de diplomados cargados para exportar.');
        return;
      }

      const csvContent = '\uFEFF' + rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Catalogo_Completo_EDUMIN_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Error al exportar CSV: ${err.message}`);
    }
  };

  // Descargar Plantilla de Ejemplo en Excel (.XLSX)
  const descargarPlantillaCompletaExcelXlsx = () => {
    const sampleRows = [
      {
        CodigoDiplomado: 'DIP-01',
        Diplomado: 'DERECHO MINERO',
        Modulo: 'Módulo 01',
        NombreModulo: 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR',
        Docente: 'Reginaldo Andía',
        Tema: 'Tema 01: Regulación Ambiental y Catastro Minero',
        Sesion: 'Parte 1',
        VideoUrl: 'https://drive.google.com/file/d/1YcuePTMFN2MTU1JsjCowwnGmcwgiPcOY/preview',
        PdfUrl: 'https://.../separata.pdf',
        ResumenVideoUrl: 'https://.../resumen.mp4',
        ResumenAudioUrl: 'https://.../audio.mp3',
        ResumenInteractivo: 'https://.../actividad.html',
        Material1: 'https://.../separata.pdf',
        Material2: 'https://.../plantilla.xlsx'
      },
      {
        CodigoDiplomado: 'DIP-01',
        Diplomado: 'DERECHO MINERO',
        Modulo: 'Módulo 01',
        NombreModulo: 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR',
        Docente: 'Reginaldo Andía',
        Tema: 'Tema 01: Regulación Ambiental y Catastro Minero',
        Sesion: 'Parte 2',
        VideoUrl: 'https://drive.google.com/file/d/1FEf_erKQOT2VirpUQq7pr-oPU_Th3ZTy/preview',
        PdfUrl: '',
        ResumenVideoUrl: '',
        ResumenAudioUrl: '',
        ResumenInteractivo: '',
        Material1: '',
        Material2: ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, 'Plantilla_Catalogo_Diplomados_EDUMIN.xlsx');
  };

  // Descargar Plantilla de Ejemplo en CSV
  const descargarPlantillaCompletaCsv = () => {
    const headers = [
      'CodigoDiplomado', 'Diplomado', 'Modulo', 'NombreModulo', 'Docente',
      'Tema', 'Sesion', 'VideoUrl', 'PdfUrl', 'ResumenVideoUrl', 'ResumenAudioUrl',
      'ResumenInteractivo', 'Material1', 'Material2'
    ];
    const sampleRows = [
      headers,
      ['DIP-01', 'DERECHO MINERO', 'Módulo 01', 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR', 'Reginaldo Andía', 'Tema 01: Regulación Ambiental y Catastro Minero', 'Parte 1', 'https://drive.google.com/file/d/1YcuePTMFN2MTU1JsjCowwnGmcwgiPcOY/preview', 'https://.../separata.pdf', 'https://.../resumen.mp4', 'https://.../audio.mp3', 'https://.../actividad.html', 'https://.../separata.pdf', 'https://.../plantilla.xlsx'],
      ['DIP-01', 'DERECHO MINERO', 'Módulo 01', 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR', 'Reginaldo Andía', 'Tema 01: Regulación Ambiental y Catastro Minero', 'Parte 2', 'https://drive.google.com/file/d/1FEf_erKQOT2VirpUQq7pr-oPU_Th3ZTy/preview', '', '', '', '', '', '']
    ];

    const csvContent = '\uFEFF' + sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Plantilla_Catalogo_Diplomados_EDUMIN.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Importar Archivo Masivo (.xlsx, .xls o .csv) con Módulos, Temas y 20 Columnas
  const handleImportarArchivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoImportado) {
      alert("Por favor selecciona un archivo Excel (.xlsx) o CSV primero.");
      return;
    }

    setCargandoSupabase(true);
    try {
      let csvRawText = '';

      if (archivoImportado.name.endsWith('.xlsx') || archivoImportado.name.endsWith('.xls')) {
        const buffer = await archivoImportado.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        csvRawText = XLSX.utils.sheet_to_csv(firstSheet);
      } else {
        csvRawText = await archivoImportado.text();
      }

      const cleanText = csvRawText.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length <= 1) {
        alert('El archivo no contiene filas de datos válidas.');
        return;
      }

      const parseCsvLine = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headerRow = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const dataRows = lines.slice(1).map(l => parseCsvLine(l));

      const colCode = headerRow.findIndex(h => 
        h === 'codigodiplomado' || 
        h === 'codigo' || 
        (h.includes('codigo') && !h.includes('modulo'))
      );
      const colDip = headerRow.findIndex(h => 
        (h === 'diplomado' || h === 'nombrediplomado' || h === 'nombre' || h === 'titulo' || h === 'titulodiplomado' || h.includes('diplomado')) && 
        !h.includes('codigo')
      );
      const colMod = headerRow.findIndex(h => h.includes('modulo') && !h.includes('nombre'));
      const colNombreMod = headerRow.findIndex(h => h.includes('nombremodulo') || h.includes('nombremod'));
      const colDocente = headerRow.findIndex(h => h.includes('docente'));
      const colTema = headerRow.findIndex(h => h.includes('tema'));
      const colSesion = headerRow.findIndex(h => h.includes('sesion') || h.includes('clase'));
      const colVideo = headerRow.findIndex(h => (h.includes('videourl') || h.includes('video') || h.includes('drive')) && !h.includes('resumen'));
      const colPdf = headerRow.findIndex(h => h.includes('pdf'));
      const colVideoResumen = headerRow.findIndex(h => h.includes('resumenvideo') || h.includes('videoresumen'));
      const colAudioResumen = headerRow.findIndex(h => h.includes('resumenaudio') || h.includes('audioresumen') || h.includes('audio'));
      const colResumenInteractivo = headerRow.findIndex(h => h.includes('interactivo') || h.includes('resumeninteractivo'));
      const colMat1 = headerRow.findIndex(h => h === 'material1' || h.includes('excel'));
      const colMat2 = headerRow.findIndex(h => h === 'material2');

      const diplomadosMap = new Map<string, any>();
      const todasLasFilasTabla: any[] = [];

      dataRows.forEach((row, rIdx) => {
        const rawCode = colCode !== -1 && row[colCode] ? row[colCode].trim() : '';
        const rawDip = colDip !== -1 && row[colDip] ? row[colDip].trim() : '';
        if (!rawCode && !rawDip) return;

        const codeKey = rawCode
          ? rawCode.toUpperCase()
          : `DIP-${(diplomadosMap.size + 1).toString().padStart(2, '0')}`;
        const dipTitle = rawDip ? rawDip.trim().toUpperCase() : codeKey;

        if (!diplomadosMap.has(codeKey)) {
          diplomadosMap.set(codeKey, {
            codigo: codeKey,
            titulo: dipTitle,
            modulosMap: new Map<string, any>()
          });
        } else {
          const existing = diplomadosMap.get(codeKey)!;
          if ((!existing.titulo || existing.titulo === codeKey) && rawDip) {
            existing.titulo = dipTitle;
          }
        }

        const dipObj = diplomadosMap.get(codeKey)!;
        const rawMod = colMod !== -1 && row[colMod] ? row[colMod].trim() : 'Módulo 01';
        const nombreModVal = colNombreMod !== -1 && row[colNombreMod] ? row[colNombreMod].trim() : rawMod;
        const docenteVal = colDocente !== -1 && row[colDocente] ? row[colDocente].trim() : '';
        
        if (!dipObj.modulosMap.has(rawMod)) {
          dipObj.modulosMap.set(rawMod, {
            codigo: rawMod,
            nombre: nombreModVal,
            docente: docenteVal,
            temasMap: new Map<string, any[]>()
          });
        }

        const modObj = dipObj.modulosMap.get(rawMod)!;
        const rawTema = colTema !== -1 && row[colTema] && row[colTema].trim() ? row[colTema].trim() : 'Tema 01: General';

        if (!modObj.temasMap.has(rawTema)) {
          modObj.temasMap.set(rawTema, []);
        }

        const sesionTitle = colSesion !== -1 && row[colSesion] ? row[colSesion].trim() : 'Clase 01';
        const videoUrl = colVideo !== -1 && row[colVideo] ? row[colVideo].trim() : '';
        const pdfUrl = colPdf !== -1 && row[colPdf] ? row[colPdf].trim() : '';
        const videoResumenUrl = colVideoResumen !== -1 && row[colVideoResumen] ? row[colVideoResumen].trim() : '';
        const audioResumenUrl = colAudioResumen !== -1 && row[colAudioResumen] ? row[colAudioResumen].trim() : '';
        const resumenInteractivo = colResumenInteractivo !== -1 && row[colResumenInteractivo] ? row[colResumenInteractivo].trim() : '';
        const mat1 = colMat1 !== -1 && row[colMat1] ? row[colMat1].trim() : '';
        const mat2 = colMat2 !== -1 && row[colMat2] ? row[colMat2].trim() : '';

        modObj.temasMap.get(rawTema)!.push({
          titulo: sesionTitle,
          videoUrl,
          iframe_url: videoUrl,
          pdfUrl,
          pdf_url: pdfUrl,
          videoResumenUrl,
          resumenVideoUrl: videoResumenUrl,
          audioResumenUrl,
          resumenAudioUrl: audioResumenUrl,
          resumenInteractivo,
          material1: mat1,
          material2: mat2,
          excel_url: mat1,
          excelUrl: mat1
        });

        todasLasFilasTabla.push({
          CodigoDiplomado: codeKey,
          Diplomado: dipTitle,
          Modulo: rawMod,
          NombreModulo: nombreModVal,
          Docente: docenteVal,
          Tema: rawTema,
          Sesion: sesionTitle,
          VideoUrl: videoUrl || null,
          PdfUrl: pdfUrl || null,
          ResumenVideoUrl: videoResumenUrl || null,
          ResumenAudioUrl: audioResumenUrl || null,
          ResumenInteractivo: resumenInteractivo || null,
          Material1: mat1 || null,
          Material2: mat2 || null,
          orden: rIdx + 1
        });
      });

      // 1. Guardar primero todas las filas con sus 20 columnas en lecciones (sobrescribe por CodigoDiplomado sin duplicar)
      if (todasLasFilasTabla.length > 0) {
        const resLecc = await fetch('/api/admin/diplomados-lecciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: todasLasFilasTabla
          })
        });
        if (!resLecc.ok) {
          const errData = await resLecc.json();
          throw new Error(errData.error || 'Error al guardar filas en lecciones');
        }
      }

      // 2. Actualizar metadata del catálogo (cursos) indicando skipSyncLecciones para evitar duplicidad
      let countSaved = 0;
      for (const [codeKey, dipData] of Array.from(diplomadosMap.entries())) {
        let contadorClaseGlobal = 1;
        let contadorTemaGlobal = 1;

        const modulosArr = Array.from(dipData.modulosMap.values()).map((m: any, mIdx: number) => {
          const temasArr = Array.from(m.temasMap.entries()).map(([tTit, cList]: any) => {
            const numTemaStr = contadorTemaGlobal < 10 ? `0${contadorTemaGlobal}` : `${contadorTemaGlobal}`;
            contadorTemaGlobal++;
            const temaClean = String(tTit).replace(/^Tema\s*\d+[:\-\s]*/i, '').replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').trim();
            
            const clasesFormatted = (cList || []).map((cObj: any) => {
              const numClase = contadorClaseGlobal++;
              const isObj = typeof cObj === 'object' && cObj !== null;
              const rawT = isObj ? (cObj.titulo || '') : String(cObj);
              const cleanT = rawT.replace(/^Clase \d+:\s*/i, '').trim();
              const tit = `Clase ${numClase}: ${cleanT || 'Nueva Sesión'}`;
              return isObj ? { ...cObj, titulo: tit } : { titulo: tit };
            });

            return {
              titulo: `Tema ${numTemaStr}: ${temaClean || 'Especialización Aplicada'}`,
              clases: clasesFormatted
            };
          });

          const clasesFlat = temasArr.flatMap((t: any) => t.clases);

          return {
            codigo: `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
            nombre: m.nombre || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
            docente: m.docente || '',
            temas: temasArr,
            clases: clasesFlat
          };
        });

        const numDigits = (dipData.codigo || '').replace(/[^0-9]/g, '');
        const idGen = numDigits ? `dip-${numDigits.padStart(2, '0')}` : `dip-${dipData.codigo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        await fetch('/api/admin/catalogo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: idGen,
            codigo: dipData.codigo,
            version: 'Versión 1',
            ano: 2026,
            titulo: dipData.titulo,
            tipo: 'diplomado',
            categoria: 'Diplomados Oficiales',
            num_modulos: modulosArr.length,
            docente: Array.from(new Set(modulosArr.map(m => m.docente).filter(Boolean))).join(', '),
            precio: 150.00,
            modulos: modulosArr,
            skipSyncLecciones: true // Omitir sincronización secundaria de lecciones porque ya se guardaron con todas las 20 columnas
          })
        });
        countSaved++;
      }

      await cargarCatalogoSupabase();
      setShowCsvModal(false);
      setArchivoImportado(null);
      setMensajeExito(`¡Se importaron correctamente ${countSaved} diplomados con sus módulos y temas a Supabase!`);
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err: any) {
      alert(`Error al procesar el archivo Excel/CSV: ${err.message}`);
    } finally {
      setCargandoSupabase(false);
    }
  };

  const limpiarTexto = (texto: string) => {
    return (texto || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const listaBase = activeTab === 'diplomados' 
    ? catalogoDiplomados 
    : activeTab === 'talleres' 
    ? catalogoTalleres 
    : catalogoCursos;

  const listaActual = listaBase.filter(item => {
    const q = limpiarTexto(busqueda);
    return limpiarTexto(item.titulo).includes(q) || limpiarTexto(item.codigo).includes(q) || limpiarTexto(item.docente).includes(q);
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal con Header Superior Institucional */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto">
          
          {mensajeExito && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Gestión del catálogo académico
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
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
                onClick={descargarCatalogoCompletoExcelXlsx} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Table className="w-4 h-4" /> Exportar Excel (.xlsx)
              </button>

              <button 
                type="button"
                onClick={descargarCatalogoCompletoCsv} 
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>

              <button 
                type="button"
                onClick={() => setShowCsvModal(true)} 
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-100 transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" /> Carga Masiva (.xlsx / .csv)
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setNuevoTipo(activeTab === 'diplomados' ? 'diplomado' : activeTab === 'talleres' ? 'taller' : 'curso');
                  setNuevoCodigo(activeTab === 'diplomados' ? `DIP-${catalogoDiplomados.length + 1}` : activeTab === 'talleres' ? `TAL-03` : `CUR-${catalogoCursos.length + 1}`);
                  setShowCreateModal(true);
                }} 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar Producto
              </button>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex border-b border-slate-200 mb-6 justify-between items-center">
            <div className="flex">
              <button 
                onClick={() => { setActiveTab('diplomados'); setSeleccionados([]); }} 
                className={`pb-3 px-5 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'diplomados' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Diplomados Oficiales ({catalogoDiplomados.length})
              </button>
              <button 
                onClick={() => { setActiveTab('cursos'); setSeleccionados([]); }} 
                className={`pb-3 px-5 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'cursos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Cursos de Alta Especialización ({catalogoCursos.length})
              </button>
              <button 
                onClick={() => { setActiveTab('talleres'); setSeleccionados([]); }} 
                className={`pb-3 px-5 font-bold text-sm transition border-b-2 cursor-pointer ${activeTab === 'talleres' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Talleres ({catalogoTalleres.length})
              </button>
            </div>

            <div className="relative mb-3 w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="size-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar por código, nombre o docente..."
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
                    
                    {activeTab === 'diplomados' ? (
                      <>
                        <th className="pb-3 px-4">Nombre del Diplomado</th>
                        <th className="pb-3 px-4">Categoría</th>
                        <th className="pb-3 px-4 text-center"># Módulos</th>
                        <th className="pb-3 px-4">Taller</th>
                      </>
                    ) : (
                      <>
                        <th className="pb-3 px-4">Año</th>
                        <th className="pb-3 px-4">Nombre del Programa</th>
                        <th className="pb-3 px-4">Categoría</th>
                        <th className="pb-3 px-4">Docente Asignado</th>
                      </>
                    )}

                    <th className="pb-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {listaActual.length > 0 ? (
                    listaActual.map((item) => {
                      const tieneTallerAsignado = Boolean(
                        item.taller_aplicable &&
                        item.taller_aplicable !== 'Ninguno' &&
                        String(item.taller_aplicable).trim() !== ''
                      );
                      return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={seleccionados.includes(item.id)}
                            onChange={() => toggleSeleccion(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-4 tabular-nums font-black text-indigo-700 bg-indigo-50/40 rounded-lg">{item.codigo}</td>

                        {activeTab === 'diplomados' ? (
                          <>
                            <td className="py-4 px-4 font-bold text-slate-800">{item.titulo}</td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                {item.categoria || 'Sin categoría'}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-700 text-center">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                                {Array.isArray(item.modulos) && item.modulos.length > 0 ? `${item.modulos.length} Módulos` : `${item.num_modulos ?? 3} Módulos`}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                title={tieneTallerAsignado ? item.taller_aplicable : 'Este diplomado no tiene un taller asignado'}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                                  tieneTallerAsignado
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {tieneTallerAsignado ? (
                                  <>
                                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                    Taller asignado
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                                    Sin taller asignado
                                  </>
                                )}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4 tabular-nums text-slate-600">{item.ano || 2026}</td>
                            <td className="py-4 px-4 font-bold text-slate-800">{item.titulo}</td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                                {item.categoria || (item.tipo === 'taller' ? 'Taller' : 'Sin categoría')}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-semibold text-indigo-600">{item.docente || 'Por asignar'}</td>
                          </>
                        )}

                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => { 
                              setModuloExpandido(null);
                              setTemaExpandido(null);
                              setCursoTemaExpandido(null);
                              if (item.tipo === 'diplomado') {
                                setItemEditando({ ...item, modulos: asegurarTemasYSecuenciarClases(item.modulos || []) });
                              } else {
                                const leccionesInit = Array.isArray(item.lecciones) && item.lecciones.length > 0
                                  ? [...item.lecciones]
                                  : (Array.isArray(item.temas) && item.temas.length > 0
                                      ? item.temas.map((t: string, idx: number) => ({
                                          id: `temp-${idx + 1}`,
                                          tema: t,
                                          sesion: 'Parte 1',
                                          videoUrl: '',
                                          pdfUrl: '',
                                          resumenVideoUrl: '',
                                          resumenTexto: ''
                                        }))
                                      : [
                                          { id: 'temp-1', tema: 'Tema 01: Fundamentos y marco normativo', sesion: 'Parte 1', videoUrl: '', pdfUrl: '', resumenVideoUrl: '', resumenTexto: '' },
                                          { id: 'temp-2', tema: 'Tema 02: Procedimientos técnicos operativos', sesion: 'Parte 1', videoUrl: '', pdfUrl: '', resumenVideoUrl: '', resumenTexto: '' },
                                          { id: 'temp-3', tema: 'Tema 03: Metodologías de control y mitigación', sesion: 'Parte 1', videoUrl: '', pdfUrl: '', resumenVideoUrl: '', resumenTexto: '' },
                                          { id: 'temp-4', tema: 'Tema 04: Implementación práctica y evaluación', sesion: 'Parte 1', videoUrl: '', pdfUrl: '', resumenVideoUrl: '', resumenTexto: '' }
                                        ]
                                    );
                                setItemEditando({ ...item, lecciones: leccionesInit });
                              }
                              setShowEditModal(true); 
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Edit3 className="size-3.5" /> Editar
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                        {cargandoSupabase ? 'Cargando catálogo desde Supabase...' : `No se encontraron registros para "${busqueda}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>

      {/* ========================================================= */}
      {/* MODAL: EDITAR PRODUCTO EN SUPABASE */}
      {/* ========================================================= */}
      {showEditModal && itemEditando && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    itemEditando.tipo === 'diplomado' 
                      ? 'text-indigo-700 bg-indigo-50 border-indigo-200' 
                      : itemEditando.tipo === 'taller'
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    {itemEditando.tipo === 'diplomado' ? 'Diplomado Oficial' : itemEditando.tipo === 'taller' ? 'Taller Práctico' : 'Curso de Alta Especialización'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Código: <strong className="text-slate-800">{itemEditando.codigo}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{itemEditando.titulo}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* Campos Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Código</label>
                  <input 
                    type="text" 
                    value={itemEditando.codigo}
                    onChange={(e) => setItemEditando({ ...itemEditando, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs tabular-nums font-bold text-slate-900"
                  />
                </div>

                {itemEditando.tipo === 'diplomado' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Versión</label>
                      <input 
                        type="text" 
                        value={itemEditando.version || 'Versión 1'}
                        onChange={(e) => setItemEditando({ ...itemEditando, version: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Año</label>
                      <input 
                        type="number" 
                        value={itemEditando.ano || 2026}
                        onChange={(e) => setItemEditando({ ...itemEditando, ano: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs tabular-nums font-bold text-slate-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Año</label>
                      <input 
                        type="number" 
                        value={itemEditando.ano || 2026}
                        onChange={(e) => setItemEditando({ ...itemEditando, ano: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs tabular-nums font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Docente Asignado</label>
                      <input 
                        type="text" 
                        value={itemEditando.docente || ''}
                        onChange={(e) => setItemEditando({ ...itemEditando, docente: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre del Programa</label>
                  <input 
                    type="text" 
                    required
                    value={itemEditando.titulo}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    onChange={(e) => setItemEditando({ ...itemEditando, titulo: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Categoría</label>
                  <input 
                    type="text" 
                    value={itemEditando.categoria || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, categoria: e.target.value })}
                    placeholder={itemEditando.tipo === 'taller' ? 'Taller' : 'Categoría oficial'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nivel (Opcional / Vacío)</label>
                  <input 
                    type="text" 
                    value={itemEditando.nivel || ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, nivel: e.target.value })}
                    placeholder="Vacío"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Horas Académicas (Solo Número)</label>
                  <input 
                    type="number" 
                    value={itemEditando.horas !== undefined && itemEditando.horas !== null ? itemEditando.horas : (itemEditando.tipo === 'diplomado' ? 325 : itemEditando.tipo === 'taller' ? 20 : 40)}
                    onChange={(e) => {
                      const hVal = e.target.value === '' ? '' : Number(e.target.value);
                      setItemEditando({ ...itemEditando, horas: hVal, duracion: hVal ? hVal + ' horas' : '' });
                    }}
                    placeholder={itemEditando.tipo === 'diplomado' ? '325' : itemEditando.tipo === 'taller' ? '20' : '40'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Créditos (Opcional / Vacío)</label>
                  <input 
                    type="number" 
                    value={itemEditando.creditos !== undefined && itemEditando.creditos !== null ? itemEditando.creditos : ''}
                    onChange={(e) => setItemEditando({ ...itemEditando, creditos: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder={itemEditando.tipo === 'diplomado' ? '13' : 'Vacío'}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                {itemEditando.tipo === 'diplomado' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Taller Aplicable (Regalo)</label>
                      <select 
                        value={
                          itemEditando.taller_aplicable?.includes('TAL-01') || itemEditando.taller_aplicable?.includes('Soft') || itemEditando.taller_aplicable?.includes('Taller 1')
                            ? 'TAL-01: Taller de Soft Skills en la Industria y Minería'
                            : !itemEditando.taller_aplicable || itemEditando.taller_aplicable === 'Ninguno'
                            ? 'Ninguno'
                            : 'TAL-02: Taller de Seguridad Basada en el Comportamiento'
                        }
                        onChange={(e) => setItemEditando({ ...itemEditando, taller_aplicable: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      >
                        <option value="TAL-02: Taller de Seguridad Basada en el Comportamiento">TAL-02: Taller de Seguridad Basada en el Comportamiento (Estándar)</option>
                        <option value="TAL-01: Taller de Soft Skills en la Industria y Minería">TAL-01: Taller de Soft Skills en la Industria y Minería</option>
                        <option value="Ninguno">Ninguno (Sin taller de regalo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1"># Módulos Registrados</label>
                      <input 
                        type="number" 
                        readOnly
                        value={itemEditando.modulos ? itemEditando.modulos.length : 3}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Sección de Módulos y Temas (Solo para Diplomados con acordeón progresivo UIX) */}
              {itemEditando.tipo === 'diplomado' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" /> Estructura de Módulos ({itemEditando.modulos ? itemEditando.modulos.length : 0})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Los módulos inician colapsados. Haz clic en &ldquo;Ver Temas&rdquo; para explorar y editar los temas y sesiones de cada módulo.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={descargarEstructuraExcelXlsx}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Descargar estructura actual en formato nativo de Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="size-3.5" /> Descargar Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={descargarEstructuraCsvExcel}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Descargar estructura actual en formato CSV"
                      >
                        <Download className="size-3.5" /> Descargar CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBulkModulesModal(true)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Cargar archivo Excel (.xlsx / .xls) o CSV con módulos, temas y enlaces"
                      >
                        <UploadCloud className="size-3.5" /> Importar Estructura (Excel/CSV)
                      </button>
                      <button
                        type="button"
                        onClick={agregarModuloEditando}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="size-3.5" /> + Agregar Módulo
                      </button>
                    </div>
                  </div>

                  {/* Lista de Módulos (Acordeón Progresivo) */}
                  <div className="space-y-4">
                    {itemEditando.modulos && itemEditando.modulos.length > 0 ? (
                      itemEditando.modulos.map((mod: any, mIdx: number) => {
                        const estaModuloAbierto = moduloExpandido === mIdx;
                        const cantTemas = Array.isArray(mod.temas) ? mod.temas.length : 0;

                        return (
                          <div key={mIdx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs">
                            {/* Cabecera del Módulo: Nombre, Docente y Botón para desplegar Temas */}
                            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-b border-slate-100">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="bg-indigo-600 text-white tabular-nums font-bold px-3 py-1.5 rounded-lg text-xs shrink-0">
                                  {mod.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`}
                                </span>
                                <input 
                                  type="text"
                                  placeholder="Nombre del Módulo..."
                                  value={mod.nombre || ''}
                                  onChange={(e) => actualizarModuloEditando(mIdx, 'nombre', e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                                />
                              </div>
                              
                              <div className="w-full md:w-56">
                                <input 
                                  type="text"
                                  placeholder="Docente del Módulo..."
                                  value={mod.docente || ''}
                                  onChange={(e) => actualizarModuloEditando(mIdx, 'docente', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700 focus:bg-white"
                                />
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModuloExpandido(estaModuloAbierto ? null : mIdx);
                                    setTemaExpandido(null);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    estaModuloAbierto
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {estaModuloAbierto ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                  <span>{estaModuloAbierto ? 'Ocultar Temas' : `Ver Temas (${cantTemas})`}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => eliminarModuloEditando(mIdx)}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer"
                                  title="Eliminar este módulo"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>

                            {/* CUERPO DEL MÓDULO: SE MUESTRA SOLO SI ESTÁ EXPANDIDO */}
                            {estaModuloAbierto && (
                              <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                  <div>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                      <Folder className="size-4 text-indigo-600" /> Temas y Sesiones de {mod.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`} ({cantTemas} temas)
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Haz clic en &ldquo;Editar Contenido&rdquo; de un tema para ver o modificar sus enlaces, videos y materiales.</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => agregarTemaAModulo(mIdx)}
                                    className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200 transition flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <Plus className="size-3.5" /> + Agregar Tema
                                  </button>
                                </div>

                                {/* LISTA DE TEMAS DEL MÓDULO */}
                                <div className="space-y-3">
                                  {mod.temas && mod.temas.length > 0 ? (
                                    mod.temas.map((temaObj: any, tIdx: number) => {
                                      const cantSesiones = Array.isArray(temaObj.clases) ? temaObj.clases.length : 0;
                                      const estaTemaAbierto = temaExpandido === tIdx;

                                      return (
                                        <div key={tIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                          {/* Cabecera del Tema */}
                                          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
                                            <div className="flex items-center gap-2 flex-1">
                                              <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-md text-[11px] shrink-0 tabular-nums">
                                                Tema {tIdx + 1}
                                              </span>
                                              <input
                                                type="text"
                                                value={temaObj.titulo || ''}
                                                placeholder="Título del Tema (ej: Tema 01: Marco Legal)..."
                                                onChange={(e) => actualizarTituloTema(mIdx, tIdx, e.target.value)}
                                                className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                                              />
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {cantSesiones} {cantSesiones === 1 ? 'sesión' : 'sesiones'}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => setTemaExpandido(estaTemaAbierto ? null : tIdx)}
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                                                  estaTemaAbierto 
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                                }`}
                                              >
                                                {estaTemaAbierto ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                                <span>{estaTemaAbierto ? 'Cerrar' : 'Editar Contenidos'}</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => agregarSesionATema(mIdx, tIdx)}
                                                className="text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                                                title="Agregar otra sesión/clase a este tema"
                                              >
                                                <Plus className="size-3" /> Sesión
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => eliminarTemaDeModulo(mIdx, tIdx)}
                                                className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                                                title="Eliminar tema entero"
                                              >
                                                <Trash2 className="size-4" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* CONTENIDOS Y SESIONES DEL TEMA (SOLO SI ESTÁ ABIERTO) */}
                                          {estaTemaAbierto && (
                                            <div className="p-3.5 bg-slate-50 border-t border-slate-100 space-y-3">
                                              <div className="space-y-3 pl-2 border-l-2 border-indigo-300">
                                                {Array.isArray(temaObj.clases) && temaObj.clases.length > 0 ? (
                                                  temaObj.clases.map((claseObj: any, sIdx: number) => {
                                                    const tituloClase = typeof claseObj === 'object' && claseObj !== null ? claseObj.titulo : String(claseObj);
                                                    const iframeUrl = typeof claseObj === 'object' && claseObj !== null ? (claseObj.iframe_url || claseObj.videoUrl || '') : '';
                                                    const videoResumenUrl = typeof claseObj === 'object' && claseObj !== null ? (claseObj.videoResumenUrl || claseObj.resumenVideoUrl || '') : '';
                                                    const audioResumenUrl = typeof claseObj === 'object' && claseObj !== null ? (claseObj.audioResumenUrl || claseObj.resumenAudioUrl || '') : '';
                                                    const pdfUrl = typeof claseObj === 'object' && claseObj !== null ? (claseObj.pdf_url || claseObj.pdfUrl || '') : '';
                                                    const resumenInteractivo = typeof claseObj === 'object' && claseObj !== null ? (claseObj.resumenInteractivo || '') : '';

                                                    return (
                                                      <div key={sIdx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">Sesión {sIdx + 1}:</span>
                                                          <input
                                                            type="text"
                                                            value={tituloClase}
                                                            placeholder="Título de la sesión/clase..."
                                                            onChange={(e) => actualizarCampoSesion(mIdx, tIdx, sIdx, 'titulo', e.target.value)}
                                                            className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 tabular-nums"
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() => eliminarSesionDeTema(mIdx, tIdx, sIdx)}
                                                            className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                                                            title="Eliminar sesión"
                                                          >
                                                            <X className="size-3.5" />
                                                          </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                                                          <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Video Principal (VideoUrl)</label>
                                                            <input
                                                              type="text"
                                                              placeholder="https://drive.google.com/file/d/... o YouTube"
                                                              value={iframeUrl}
                                                              onChange={(e) => actualizarCampoSesion(mIdx, tIdx, sIdx, 'iframe_url', e.target.value)}
                                                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 tabular-nums"
                                                            />
                                                          </div>

                                                          <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Material de Clase (PDF / Diapositivas)</label>
                                                            <input
                                                              type="text"
                                                              placeholder="https://.../material.pdf"
                                                              value={pdfUrl}
                                                              onChange={(e) => actualizarCampoSesion(mIdx, tIdx, sIdx, 'pdf_url', e.target.value)}
                                                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 tabular-nums"
                                                            />
                                                          </div>

                                                          <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Video Resumen / IA</label>
                                                            <input
                                                              type="text"
                                                              placeholder="https://edumin-edu.github.io/recursos/videos/..."
                                                              value={videoResumenUrl}
                                                              onChange={(e) => actualizarCampoSesion(mIdx, tIdx, sIdx, 'videoResumenUrl', e.target.value)}
                                                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 tabular-nums"
                                                            />
                                                          </div>

                                                          <div>
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Audio Resumen (Podcast)</label>
                                                            <input
                                                              type="text"
                                                              placeholder="https://.../podcast.mp3"
                                                              value={audioResumenUrl}
                                                              onChange={(e) => actualizarCampoSesion(mIdx, tIdx, sIdx, 'audioResumenUrl', e.target.value)}
                                                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 tabular-nums"
                                                            />
                                                          </div>

                                                          <div className="md:col-span-2">
                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Resumen Interactivo / Puntos Clave</label>
                                                            <input
                                                              type="text"
                                                              placeholder="Resumen o puntos clave de la sesión formativa..."
                                                              value={resumenInteractivo}
                                                              onChange={(e) => actualizarCampoSesion(mIdx, tIdx, sIdx, 'resumenInteractivo', e.target.value)}
                                                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700"
                                                            />
                                                          </div>
                                                        </div>
                                                      </div>
                                                    );
                                                  })
                                                ) : (
                                                  <p className="text-[10px] text-slate-400 italic py-1">No hay sesiones agregadas en este tema aún.</p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-xl">
                                      <p className="text-xs text-slate-500 font-medium">Este módulo no tiene temas ni sesiones agregadas aún.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium">Este diplomado aún no tiene módulos configurados.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección de Temas y Contenidos Oficiales (Solo para Cursos y Talleres) */}
              {itemEditando.tipo !== 'diplomado' && (() => {
                const lecciones = Array.isArray(itemEditando.lecciones) ? itemEditando.lecciones : [];
                const esTaller = itemEditando.tipo === 'taller';

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Folder className="w-4 h-4 text-emerald-600" />
                          Temario y Contenidos Oficiales ({lecciones.length} Temas registrados)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {esTaller
                            ? 'Talleres prácticos oficiales: edita los temas, videos, grabaciones y materiales sincronizados con Supabase.'
                            : 'Cursos de Alta Especialización: edita los temas oficiales, enlaces multimedia y resúmenes de Supabase.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={agregarTemaCurso}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="size-3.5" /> + Agregar Tema
                      </button>
                    </div>

                    {lecciones.length > 0 ? (
                      <div className="space-y-3">
                        {lecciones.map((lec: any, lIdx: number) => {
                          const estaAbierto = cursoTemaExpandido === lIdx;
                          const temaTitulo = lec.tema || lec.Tema || `Tema ${(lIdx + 1).toString().padStart(2, '0')}`;
                          const sesionVal = lec.sesion || lec.Sesion || 'Parte 1';
                          const videoVal = lec.videoUrl || lec.VideoUrl || '';
                          const pdfVal = lec.pdfUrl || lec.PdfUrl || '';
                          const resumenVideoVal = lec.resumenVideoUrl || lec.ResumenVideoUrl || '';
                          const resumenTextoVal = lec.resumenTexto || lec.ResumenTexto || '';

                          return (
                            <div key={lIdx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all">
                              {/* Fila del Tema: Resumen colapsado */}
                              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-slate-100">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 tabular-nums">
                                    Tema {(lIdx + 1).toString().padStart(2, '0')}
                                  </span>
                                  <input
                                    type="text"
                                    value={temaTitulo}
                                    placeholder="Título del tema de especialización..."
                                    onChange={(e) => actualizarLeccionCurso(lIdx, 'tema', e.target.value)}
                                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                                  />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setCursoTemaExpandido(estaAbierto ? null : lIdx)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      estaAbierto
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                    }`}
                                  >
                                    {estaAbierto ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                    <span>{estaAbierto ? 'Cerrar' : 'Editar Contenidos'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => eliminarTemaCurso(lIdx)}
                                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition cursor-pointer"
                                    title="Eliminar este tema"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Detalle expandido del Tema: Videos, Materiales, Resúmenes */}
                              {estaAbierto && (
                                <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Video de Clase / Enlace de Grabación (VideoUrl)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="https://www.youtube.com/embed/... o Drive"
                                        value={videoVal}
                                        onChange={(e) => actualizarLeccionCurso(lIdx, 'videoUrl', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 tabular-nums"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Material de Clase (PDF / PPTX / Diapositivas)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="https://edumin-edu.github.io/recursos/archivos/?curso=..."
                                        value={pdfVal}
                                        onChange={(e) => actualizarLeccionCurso(lIdx, 'pdfUrl', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 tabular-nums"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Video Resumen / Cápsula IA (ResumenVideoUrl)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="https://edumin-edu.github.io/recursos/videos/?curso=..."
                                        value={resumenVideoVal}
                                        onChange={(e) => actualizarLeccionCurso(lIdx, 'resumenVideoUrl', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 tabular-nums"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Sesión / Parte
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Parte 1"
                                        value={sesionVal}
                                        onChange={(e) => actualizarLeccionCurso(lIdx, 'sesion', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                      Resumen y Puntos Clave del Tema (Markdown / Texto)
                                    </label>
                                    <textarea
                                      rows={4}
                                      placeholder="Resumen del tema y puntos clave tratados en la sesión..."
                                      value={resumenTextoVal}
                                      onChange={(e) => actualizarLeccionCurso(lIdx, 'resumenTexto', e.target.value)}
                                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 leading-relaxed"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium">Este curso aún no tiene temas registrados en la tabla lecciones de Supabase.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Guardar Cambios en Supabase
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CARGA MASIVA DE MÓDULOS (EXCEL / CSV) */}
      {/* ========================================================= */}
      {showBulkModulesModal && itemEditando && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowBulkModulesModal(false); }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Carga Masiva de Módulos, Temas y Sesiones (Excel / CSV)
              </h3>
              <button onClick={() => setShowBulkModulesModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">¿Primera vez cargando por Excel/CSV?</h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">Descarga nuestra plantilla oficial con las columnas exactas (Modulo, NombreModulo, Docente, Tema, Sesion, VideoUrl, etc.).</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={descargarPlantillaEjemploExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="size-3.5" /> Plantilla Excel (.XLSX)
                  </button>
                  <button
                    type="button"
                    onClick={descargarPlantillaEjemploCsv}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="size-3.5" /> Plantilla CSV (.CSV)
                  </button>
                </div>
              </div>

              {/* Opción A: Subir Archivo Excel / CSV */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Opción A: Cargar Archivo Excel (.XLSX / .XLS) o CSV
                </label>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      procesarArchivoSeleccionado(file);
                    }
                  }}
                  className="w-full text-xs text-slate-600 border border-slate-300 rounded-2xl p-3 bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>

              {/* Opción B: Pegar contenido del Excel directamente */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Opción B: Pegar Líneas de Texto en Formato CSV / Excel
                </label>
                <textarea 
                  rows={6}
                  placeholder={`"Modulo","NombreModulo","Docente","Tema","Sesion","VideoUrl","VideoResumenUrl","AudioResumenUrl","PdfUrl","ExcelUrl"\n"Módulo 01","GEOTECNIA","Ing. Aucapuri","Tema 01: Fundamentos","Clase 1: Introducción","https://drive.google.com/file/d/1/preview","","","",""`}
                  value={bulkModulesJson}
                  onChange={(e) => setBulkModulesJson(e.target.value)}
                  className="w-full p-4 bg-slate-900 text-emerald-400 tabular-nums text-xs rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowBulkModulesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={procesarCargaMasivaModulos}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Procesar e Importar Estructura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVO PRODUCTO EN SUPABASE */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Agregar Producto a Supabase</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCrearProducto} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Programa</label>
                <select 
                  value={nuevoTipo} 
                  onChange={(e) => {
                    const tipo = e.target.value as any;
                    setNuevoTipo(tipo);
                    setNuevoCodigo(tipo === 'diplomado' ? `DIP-${catalogoDiplomados.length + 1}` : tipo === 'taller' ? `TAL-03` : `CUR-${catalogoCursos.length + 1}`);
                    if (tipo === 'diplomado') { setNuevaDuracion('325'); setNuevosCreditos('13'); }
                    else if (tipo === 'taller') { setNuevaDuracion('10'); setNuevosCreditos(''); }
                    else { setNuevaDuracion('30'); setNuevosCreditos(''); }
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                >
                  <option value="diplomado">Diplomado Oficial</option>
                  <option value="curso">Curso de Alta Especialización</option>
                  <option value="taller">Taller Práctico</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único</label>
                  <input 
                    type="text" 
                    required
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs tabular-nums font-bold bg-slate-50 text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Año</label>
                  <input 
                    type="number" 
                    required
                    value={nuevoAno}
                    onChange={(e) => setNuevoAno(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs tabular-nums font-bold bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              {nuevoTipo === 'diplomado' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Versión</label>
                    <input 
                      type="text" 
                      value={nuevaVersion}
                      onChange={(e) => setNuevaVersion(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"># Módulos Iniciales</label>
                    <input 
                      type="number" 
                      value={nuevoNumModulos}
                      onChange={(e) => setNuevoNumModulos(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre del Programa <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: GESTIÓN MINERA AVANZADA" 
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              {nuevoTipo !== 'diplomado' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Docente Asignado</label>
                  <input 
                    type="text" 
                    value={nuevoDocente}
                    onChange={(e) => setNuevoDocente(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-indigo-700"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Taller Aplicable (Regalo)</label>
                  <select 
                    value={nuevoTallerAplicable} 
                    onChange={(e) => setNuevoTallerAplicable(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  >
                    <option value="TAL-02: Taller de Seguridad Basada en el Comportamiento">TAL-02: Taller de Seguridad Basada en el Comportamiento (Estándar)</option>
                    <option value="TAL-01: Taller de Soft Skills en la Industria y Minería">TAL-01: Taller de Soft Skills en la Industria y Minería</option>
                    <option value="Ninguno">Ninguno (Sin taller de regalo)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Horas (Solo Número)</label>
                  <input 
                    type="number" 
                    value={nuevaDuracion}
                    onChange={(e) => setNuevaDuracion(e.target.value)}
                    placeholder={nuevoTipo === 'diplomado' ? '325' : nuevoTipo === 'taller' ? '10' : '30'}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Créditos (Opcional)</label>
                  <input 
                    type="number" 
                    value={nuevosCreditos}
                    onChange={(e) => setNuevosCreditos(e.target.value)}
                    placeholder={nuevoTipo === 'diplomado' ? '13' : 'Vacío'}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Precio de Venta (S/)</label>
                <input 
                  type="number" 
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Guardar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CARGA MASIVA A SUPABASE (XLSX / CSV) */}
      {/* ========================================================= */}
      {showCsvModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowCsvModal(false); }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Carga Masiva de Diplomados y Módulos</h3>
                <p className="text-[11px] text-slate-500">Formatos compatibles: Excel (.xlsx, .xls) y CSV (.csv)</p>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleImportarArchivo} className="p-6 space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900">Descargar formato de plantilla vacía de ejemplo:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={descargarPlantillaCompletaExcelXlsx}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Table className="size-3.5" /> Plantilla Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={descargarPlantillaCompletaCsv}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="size-3.5" /> Plantilla CSV (.csv)
                  </button>
                </div>
              </div>

              <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition relative">
                <FileSpreadsheet className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                <label className="block text-xs font-bold text-slate-700 cursor-pointer">
                  <span className="block text-sm font-extrabold text-indigo-900 mb-1">
                    {archivoImportado ? archivoImportado.name : "Selecciona tu archivo Excel (.xlsx) o CSV (.csv)"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Arrastra tu archivo aquí o haz clic para examinar</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
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
                  disabled={cargandoSupabase}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {cargandoSupabase && <Loader2 className="w-4 h-4 animate-spin" />}
                  Subir e Insertar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}