'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function limpiarSesionLocal() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('edumin_foto_perfil');
    localStorage.removeItem('edumin_nombres');
    localStorage.removeItem('edumin_apellidos');
    localStorage.removeItem('edumin_dni');
    localStorage.removeItem('edumin_paquete');
    localStorage.removeItem('edumin_role');
    localStorage.removeItem('edumin_user_id');
  } catch (err) {
    console.warn('No se pudo limpiar localStorage:', err);
  }
}

type ProfileContextType = {
  nombres: string;
  apellidos: string;
  iniciales: string;
  dni: string;
  paqueteContratado: string;
  role: string;
  fotoPerfil: string | null;
  debeCambiarPassword: boolean;
  cargando: boolean;
  actualizarFotoPerfil: (nuevaFoto: string | null) => void;
  actualizarDatosUsuario: (datos: { nombres: string; apellidos: string; paqueteContratado?: string; dni?: string }) => void;
  marcarPasswordActualizada: () => void;
  recargarPerfil: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  nombres: '',
  apellidos: '',
  iniciales: '',
  dni: '',
  paqueteContratado: '',
  role: 'ESTUDIANTE',
  fotoPerfil: null,
  debeCambiarPassword: false,
  cargando: true,
  actualizarFotoPerfil: () => {},
  actualizarDatosUsuario: () => {},
  marcarPasswordActualizada: () => {},
  recargarPerfil: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [paqueteContratado, setPaqueteContratado] = useState('');
  const [role, setRole] = useState('ESTUDIANTE');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(false);
  const [cargando, setCargando] = useState(true);

  const marcarPasswordActualizada = useCallback(() => {
    setDebeCambiarPassword(false);
  }, []);

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
          const userDni = profile.dni_ce || profile.dni || '';
          const paq = profile.paquete_adquirido || 'PROGRAMA FULL';
          const rolesObj = profile.roles && typeof profile.roles === 'object' ? profile.roles : null;
          const rol = rolesObj?.administrativo || rolesObj?.academico || profile.role || 'ESTUDIANTE';
          const foto = profile.foto_perfil || null;

          setNombres(nom);
          setApellidos(ape);
          setDni(userDni);
          setPaqueteContratado(paq);
          setRole(rol);
          setDebeCambiarPassword(Boolean(profile.debe_cambiar_password));

          // Siempre sincronizar fotoPerfil: si el nuevo usuario no tiene foto, debe quedar en null y limpiar localStorage
          setFotoPerfil(foto);
          if (foto) {
            localStorage.setItem('edumin_foto_perfil', foto);
          } else {
            localStorage.removeItem('edumin_foto_perfil');
          }

          if (profile.id) localStorage.setItem('edumin_user_id', profile.id);
          if (nom) localStorage.setItem('edumin_nombres', nom);
          if (ape) localStorage.setItem('edumin_apellidos', ape);
          if (userDni) localStorage.setItem('edumin_dni', userDni);
          if (paq) localStorage.setItem('edumin_paquete', paq);
          if (rol) localStorage.setItem('edumin_role', rol);
        }
      } else {
        // Si no hay sesión válida
        setFotoPerfil(null);
        setNombres('');
        setApellidos('');
        setDni('');
        setPaqueteContratado('');
        setRole('ESTUDIANTE');
        limpiarSesionLocal();
      }
    } catch (e) {
      console.error('Error al cargar perfil desde Supabase en ProfileProvider:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // 1. Cargar almacenamiento local rápido si existe
    try {
      const nombresGuardados = localStorage.getItem('edumin_nombres');
      const apellidosGuardados = localStorage.getItem('edumin_apellidos');
      const dniGuardado = localStorage.getItem('edumin_dni');
      const paqueteGuardado = localStorage.getItem('edumin_paquete');
      const fotoGuardada = localStorage.getItem('edumin_foto_perfil');
      const rolGuardado = localStorage.getItem('edumin_role');

      if (nombresGuardados) setNombres(nombresGuardados);
      if (apellidosGuardados) setApellidos(apellidosGuardados);
      if (dniGuardado) setDni(dniGuardado);
      if (paqueteGuardado) setPaqueteContratado(paqueteGuardado);
      if (fotoGuardada) setFotoPerfil(fotoGuardada);
      if (rolGuardado) setRole(rolGuardado);
    } catch {
      // ignore
    }

    // 2. Fetch directo a Supabase para sincronizar siempre con el perfil real logueado
    recargarPerfil();
  }, [recargarPerfil]);

  // 3. Listener en tiempo real de cambios de autenticación (logout, login)
  useEffect(() => {
    try {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setFotoPerfil(null);
          setNombres('');
          setApellidos('');
          setDni('');
          setPaqueteContratado('');
          setRole('ESTUDIANTE');
          limpiarSesionLocal();
        } else if (event === 'SIGNED_IN') {
          recargarPerfil();
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch {
      // ignore
    }
  }, [recargarPerfil]);

  const actualizarFotoPerfil = (nuevaFoto: string | null) => {
    setFotoPerfil(nuevaFoto);
    if (nuevaFoto) {
      localStorage.setItem('edumin_foto_perfil', nuevaFoto);
    } else {
      localStorage.removeItem('edumin_foto_perfil');
    }
  };

  const actualizarDatosUsuario = (datos: { nombres: string; apellidos: string; paqueteContratado?: string; dni?: string }) => {
    setNombres(datos.nombres);
    setApellidos(datos.apellidos);
    localStorage.setItem('edumin_nombres', datos.nombres);
    localStorage.setItem('edumin_apellidos', datos.apellidos);

    if (datos.dni) {
      setDni(datos.dni);
      localStorage.setItem('edumin_dni', datos.dni);
    }

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
      dni,
      paqueteContratado,
      role,
      fotoPerfil,
      debeCambiarPassword,
      cargando,
      actualizarFotoPerfil,
      actualizarDatosUsuario,
      marcarPasswordActualizada,
      recargarPerfil
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
