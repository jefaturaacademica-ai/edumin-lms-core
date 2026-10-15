'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ProfileContextType = {
  nombres: string;
  apellidos: string;
  iniciales: string;
  paqueteContratado: string;
  role: string;
  fotoPerfil: string | null;
  cargando: boolean;
  actualizarFotoPerfil: (nuevaFoto: string | null) => void;
  actualizarDatosUsuario: (datos: { nombres: string; apellidos: string; paqueteContratado?: string }) => void;
  recargarPerfil: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  nombres: '',
  apellidos: '',
  iniciales: '',
  paqueteContratado: '',
  role: 'ESTUDIANTE',
  fotoPerfil: null,
  cargando: true,
  actualizarFotoPerfil: () => {},
  actualizarDatosUsuario: () => {},
  recargarPerfil: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [paqueteContratado, setPaqueteContratado] = useState('');
  const [role, setRole] = useState('ESTUDIANTE');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargarPerfil = useCallback(async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/dashboard/me');
      if (res.ok) {
        const data = await res.json();
        const profile = data.profile;
        if (profile) {
          const nom = profile.nombres || '';
          const ape = profile.apellidos || '';
          const paq = profile.paquete_adquirido || 'PROGRAMA FULL';
          const rol = profile.role || 'ESTUDIANTE';
          const foto = profile.foto_perfil || null;

          setNombres(nom);
          setApellidos(ape);
          setPaqueteContratado(paq);
          setRole(rol);

          if (foto) {
            setFotoPerfil(foto);
            localStorage.setItem('edumin_foto_perfil', foto);
          }

          if (nom) localStorage.setItem('edumin_nombres', nom);
          if (ape) localStorage.setItem('edumin_apellidos', ape);
          if (paq) localStorage.setItem('edumin_paquete', paq);
          if (rol) localStorage.setItem('edumin_role', rol);
        }
      }
    } catch (e) {
      console.error('Error al cargar perfil desde Supabase en ProfileProvider:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // 1. Cargar almacenamiento local rápido si existe
    const nombresGuardados = localStorage.getItem('edumin_nombres');
    const apellidosGuardados = localStorage.getItem('edumin_apellidos');
    const paqueteGuardado = localStorage.getItem('edumin_paquete');
    const fotoGuardada = localStorage.getItem('edumin_foto_perfil');

    if (nombresGuardados) setNombres(nombresGuardados);
    if (apellidosGuardados) setApellidos(apellidosGuardados);
    if (paqueteGuardado) setPaqueteContratado(paqueteGuardado);
    if (fotoGuardada) setFotoPerfil(fotoGuardada);

    // 2. Fetch directo a Supabase para sincronizar siempre con el perfil real logueado
    recargarPerfil();
  }, [recargarPerfil]);

  const actualizarFotoPerfil = (nuevaFoto: string | null) => {
    setFotoPerfil(nuevaFoto);
    if (nuevaFoto) {
      localStorage.setItem('edumin_foto_perfil', nuevaFoto);
    } else {
      localStorage.removeItem('edumin_foto_perfil');
    }
  };

  const actualizarDatosUsuario = (datos: { nombres: string; apellidos: string; paqueteContratado?: string }) => {
    setNombres(datos.nombres);
    setApellidos(datos.apellidos);
    localStorage.setItem('edumin_nombres', datos.nombres);
    localStorage.setItem('edumin_apellidos', datos.apellidos);

    if (datos.paqueteContratado) {
      setPaqueteContratado(datos.paqueteContratado);
      localStorage.setItem('edumin_paquete', datos.paqueteContratado);
    }
  };

  const inicialN = nombres.trim().charAt(0) || 'E';
  const inicialA = apellidos.trim().charAt(0) || 'D';
  const iniciales = (inicialN + inicialA).toUpperCase();

  return (
    <ProfileContext.Provider value={{
      nombres,
      apellidos,
      iniciales,
      paqueteContratado,
      role,
      fotoPerfil,
      cargando,
      actualizarFotoPerfil,
      actualizarDatosUsuario,
      recargarPerfil
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
