'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ProfileContextType = {
  nombres: string;
  apellidos: string;
  iniciales: string;
  paqueteContratado: string;
  fotoPerfil: string | null;
  actualizarFotoPerfil: (nuevaFoto: string | null) => void;
  actualizarDatosUsuario: (datos: { nombres: string; apellidos: string; paqueteContratado?: string }) => void;
};

const ProfileContext = createContext<ProfileContextType>({
  nombres: 'Juan Carlos',
  apellidos: 'Quispe Mamani',
  iniciales: 'JQ',
  paqueteContratado: 'PROGRAMA FULL',
  fotoPerfil: null,
  actualizarFotoPerfil: () => {},
  actualizarDatosUsuario: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [nombres, setNombres] = useState('Juan Carlos');
  const [apellidos, setApellidos] = useState('Quispe Mamani');
  const [paqueteContratado, setPaqueteContratado] = useState('PROGRAMA FULL');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  useEffect(() => {
    const fotoGuardada = localStorage.getItem('edumin_foto_perfil');
    if (fotoGuardada) {
      setFotoPerfil(fotoGuardada);
    }

    const nombresGuardados = localStorage.getItem('edumin_nombres');
    const apellidosGuardados = localStorage.getItem('edumin_apellidos');

    if (nombresGuardados) setNombres(nombresGuardados);
    if (apellidosGuardados) setApellidos(apellidosGuardados);
  }, []);

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

  const inicialN = nombres.trim().charAt(0) || 'J';
  const inicialA = apellidos.trim().charAt(0) || 'Q';
  const iniciales = (inicialN + inicialA).toUpperCase();

  return (
    <ProfileContext.Provider value={{
      nombres,
      apellidos,
      iniciales,
      paqueteContratado,
      fotoPerfil,
      actualizarFotoPerfil,
      actualizarDatosUsuario
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
