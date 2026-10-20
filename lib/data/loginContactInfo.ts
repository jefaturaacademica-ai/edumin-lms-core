/**
 * Configuración oficial de medios de contacto y ayuda para la pantalla de Login de EDUMIN.
 * Puede ser consumida directamente en el login y editada desde el panel administrativo.
 */

export interface CanalContacto {
  titulo: string;
  valor: string;
  textoBoton: string;
  enlace: string;
  tipo: 'whatsapp' | 'email' | 'telefono';
}

export interface LoginContactConfig {
  tituloBienvenida: string;
  subtituloBienvenida: string;
  canales: {
    academicas: CanalContacto;
    pagos: CanalContacto;
    correo: CanalContacto;
    telefonoFijo: CanalContacto;
  };
  horarioAtencion: string;
  mensajeAdicionalHtml?: string;
}

export const LOGIN_CONTACT_INFO: LoginContactConfig = {
  tituloBienvenida: "Bienvenido al aula virtual",
  subtituloBienvenida: "¿Tienes problemas de acceso o necesitas soporte con tu cuenta? Contáctate directamente con nuestros canales oficiales de atención al estudiante:",
  canales: {
    academicas: {
      titulo: "Consultas académicas",
      valor: "+51 980694497",
      textoBoton: "Escribir al WhatsApp",
      enlace: "https://wa.me/51980694497?text=Hola%2C%20tengo%20una%20consulta%20acad%C3%A9mica%20en%20el%20Aula%20Virtual%20de%20EDUMIN",
      tipo: "whatsapp"
    },
    pagos: {
      titulo: "Consultas de pagos",
      valor: "+51 914601253",
      textoBoton: "Escribir al WhatsApp",
      enlace: "https://wa.me/51914601253?text=Hola%2C%20tengo%20una%20consulta%20sobre%20mis%20pagos%20en%20EDUMIN",
      tipo: "whatsapp"
    },
    correo: {
      titulo: "Correo electrónico",
      valor: "area.academica@edumin.pe",
      textoBoton: "Enviar correo",
      enlace: "mailto:area.academica@edumin.pe?subject=Consulta%20Aula%20Virtual%20EDUMIN",
      tipo: "email"
    },
    telefonoFijo: {
      titulo: "Teléfono fijo",
      valor: "054-643005",
      textoBoton: "Llamar",
      enlace: "tel:054643005",
      tipo: "telefono"
    }
  },
  horarioAtencion: "Horario de atención: de lunes a viernes de 8:30 a. m. a 6:30 p. m. (hora de Perú)"
};
