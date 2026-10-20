export type ModoLoginContenido = 'contactos' | 'html' | 'vacio';

export interface LoginBannerConfig {
  modo: ModoLoginContenido;
  tituloCampana?: string;
  htmlPersonalizado: string;
  fechaActualizacion?: string;
}

export interface PlantillaLogin {
  id: string;
  nombre: string;
  descripcion: string;
  html: string;
}

/**
 * Plantillas predefinidas listas para usar en el panel administrativo
 */
export const PLANTILLAS_PREDEFINIDAS: PlantillaLogin[] = [
  {
    id: 'navidad',
    nombre: '🎄 Campaña Navideña / Fin de Año',
    descripcion: 'Diseño festivo con tonos dorados, mensaje de fiestas y botón a WhatsApp.',
    html: `<div class="space-y-5 text-center sm:text-left bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
  <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
    <span>✨ ¡Felices Fiestas! • EDUMIN</span>
  </div>
  <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
    Campaña de Especialización y Cierre de Año
  </h2>
  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
    Te deseamos un próspero año nuevo lleno de metas profesionales alcanzadas. Nuestro campus virtual se encuentra disponible las 24 horas del día para tu capacitación continua.
  </p>
  <div class="pt-2 flex flex-wrap gap-3">
    <a href="https://wa.me/51980694497?text=Hola%2C%20deseo%20informaci%C3%B3n%20sobre%20las%20promociones%20de%20fin%20de%20a%C3%B1o" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg">
      Consultar promociones especiales
    </a>
  </div>
</div>`
  },
  {
    id: 'inscripciones',
    nombre: '🎓 Inscripciones y Nuevos Diplomados',
    descripcion: 'Anuncio moderno en azul e índigo destacando inicio de clases y matrículas.',
    html: `<div class="space-y-5 text-center sm:text-left bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
  <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
    <span>📢 Convocatoria Oficial Abierta</span>
  </div>
  <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
    Nuevos Diplomados de Especialización Minera
  </h2>
  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
    Inicia tu formación de alto impacto con certificación universitaria y docentes referentes de la industria minera peruana e internacional.
  </p>
  <div class="pt-2 flex flex-wrap gap-3">
    <a href="https://wa.me/51980694497?text=Hola%2C%20deseo%20conocer%20el%20cat%C3%A1logo%20de%20nuevos%20diplomados" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg">
      Ver catálogo de diplomados
    </a>
  </div>
</div>`
  },
  {
    id: 'comunicado',
    nombre: '📌 Comunicado Institucional / Mantenimiento',
    descripcion: 'Aviso formal para notificar fechas clave, horarios festivos o comunicados.',
    html: `<div class="space-y-4 text-center sm:text-left bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
  <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
    <span>⚠️ Comunicado Importante</span>
  </div>
  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
    Atención a la Comunidad Estudiantil
  </h2>
  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
    Estimados estudiantes, les recordamos revisar sus fechas límites de entrega y cronogramas de evaluación en la sección correspondiente de su aula virtual.
  </p>
</div>`
  }
];
