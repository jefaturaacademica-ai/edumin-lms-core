import driveVideosJson from './drive_videos_mapped.json';

export interface DriveClassVideo {
  titulo: string;
  videoUrl: string;
  driveId: string | null;
  driveName: string | null;
}

export interface DriveModuloVideo {
  codigo: string;
  nombre: string;
  docente: string;
  clases: DriveClassVideo[];
}

export interface DriveDiplomadoVideo {
  diplomado: string;
  driveFolderUrl: string | null;
  modulos: DriveModuloVideo[];
}

export const DRIVE_VIDEOS_MAPPED: Record<string, DriveDiplomadoVideo> = driveVideosJson as any;

export function getDriveVideoForClass(diplomadoSlug: string, modIdx: number, claseIdx: number): string | null {
  if (!diplomadoSlug) return null;
  const normSlug = diplomadoSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Try exact match or fuzzy match
  let dipData = DRIVE_VIDEOS_MAPPED[normSlug];
  if (!dipData) {
    const keys = Object.keys(DRIVE_VIDEOS_MAPPED);
    const keyMatch = keys.find(k => k.includes(normSlug) || normSlug.includes(k));
    if (keyMatch) {
      dipData = DRIVE_VIDEOS_MAPPED[keyMatch];
    }
  }

  if (dipData && Array.isArray(dipData.modulos) && dipData.modulos[modIdx]) {
    const clases = dipData.modulos[modIdx].clases;
    if (Array.isArray(clases) && clases[claseIdx] && clases[claseIdx].videoUrl) {
      return clases[claseIdx].videoUrl;
    }
  }
  return null;
}
