'use client';

import React, { useState, useEffect } from 'react';
import { 
  Code2, Key, Copy, Check, Eye, EyeOff, Send, 
  Terminal, ShieldCheck, RefreshCw, BookOpen, Layers,
  ExternalLink, CheckCircle2, AlertCircle, Sparkles, Play,
  Cpu, FileJson, ArrowRight
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useProfile } from '@/context/profile-context';

interface EndpointDoc {
  id: string;
  metodo: 'GET' | 'POST';
  ruta: string;
  titulo: string;
  descripcion: string;
  requiereAuth: boolean;
  parametros?: Array<{ nombre: string; tipo: string; requerido: boolean; descripcion: string }>;
  ejemploBody?: string;
  ejemploRespuesta: string;
  snippetCurl: (apiKey: string, host: string) => string;
  snippetJs: (apiKey: string, host: string) => string;
  snippetPython: (apiKey: string, host: string) => string;
}

export default function AdminDesarrolladoresPage() {
  const { role } = useProfile();
  const [apiKey, setApiKey] = useState<string>('edumin_live_6cbaca499252f3eb4e928c1862eeb75c28b7bc2c');
  const [cargandoKey, setCargandoKey] = useState(false);
  const [mostrarKey, setMostrarKey] = useState(false);
  const [copiadoKey, setCopiadoKey] = useState(false);

  // Endpoint activo en el libro interactivo
  const [endpointActivoId, setEndpointActivoId] = useState<string>('get-estudiante');
  const [lenguajeSnippet, setLenguajeSnippet] = useState<'curl' | 'js' | 'python'>('curl');

  // Consola de pruebas interactiva
  const [parametroTest, setParametroTest] = useState<string>('71234567');
  const [bodyTest, setBodyTest] = useState<string>('');
  const [probando, setProbando] = useState(false);
  const [resultadoTest, setResultadoTest] = useState<{
    status: number;
    statusText: string;
    tiempoMs: number;
    data: any;
  } | null>(null);

  const hostActual = typeof window !== 'undefined' ? window.location.origin : 'https://edumin-lms-core.vercel.app';

  // Cargar API Key auténtica oculta desde backend
  useEffect(() => {
    fetch('/api/admin/api-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {})
      .finally(() => setCargandoKey(false));
  }, []);

  // Lista de documentación de endpoints oficiales
  const endpoints: EndpointDoc[] = [
    {
      id: 'get-estudiante',
      metodo: 'GET',
      ruta: '/api/v1/estudiantes/{dni}',
      titulo: 'Consultar estado y deuda de estudiante',
      descripcion: 'Obtiene el expediente de un alumno en tiempo real: paquete contratado, diplomado actual, estado financiero, cuotas pagadas y saldo pendiente.',
      requiereAuth: true,
      parametros: [
        { nombre: 'dni', tipo: 'string', requerido: true, descripcion: 'Número de documento o DNI del estudiante (ej. 71234567)' }
      ],
      ejemploRespuesta: JSON.stringify({
        success: true,
        estudiante: {
          id: "4bf5916e-0ef8-46ec-a0eb-c3486586d6d3",
          numero_documento: "71234567",
          nombres: "Carlos Alberto",
          apellidos: "Quispe Ramos",
          paquete_adquirido: "COMPLETO",
          diplomado_actual: "DERECHO MINERO",
          bloqueado: false,
          estado_cuenta: "AL_DIA",
          financiero: {
            total_facturado: 950,
            total_pagado: 950,
            total_deuda_pendiente: 0,
            cuotas_pagadas: 3,
            al_dia: true
          }
        }
      }, null, 2),
      snippetCurl: (key, host) => `curl -X GET "${host}/api/v1/estudiantes/71234567" \\
  -H "x-api-key: ${key}"`,
      snippetJs: (key, host) => `const response = await fetch("${host}/api/v1/estudiantes/71234567", {
  headers: {
    "x-api-key": "${key}"
  }
});
const data = await response.json();
console.log(data);`,
      snippetPython: (key, host) => `import requests

url = "${host}/api/v1/estudiantes/71234567"
headers = {"x-api-key": "${key}"}

response = requests.get(url, headers=headers)
print(response.json())`
    },
    {
      id: 'post-matricular',
      metodo: 'POST',
      ruta: '/api/v1/estudiantes/matricular',
      titulo: 'Matrícula automática desde CRM o web',
      descripcion: 'Registra un nuevo estudiante en el campus, crea sus credenciales de acceso (con su DNI), activa su paquete y genera su contrato en el cronograma de pagos.',
      requiereAuth: true,
      ejemploBody: JSON.stringify({
        numero_documento: "79876543",
        tipo_documento: "DNI",
        nombres: "María Elena",
        apellidos: "Torres Morales",
        email: "maria.torres@gmail.com",
        telefono: "987654321",
        paquete: "COMPLETO",
        diplomado_inicial: "DERECHO MINERO",
        monto_total: 540,
        cuota_inicial_pagada: 180
      }, null, 2),
      ejemploRespuesta: JSON.stringify({
        success: true,
        message: "Estudiante matriculado y activado exitosamente vía API",
        estudiante: {
          id: "e6f98213-9871-4821-bc10-128763489123",
          numero_documento: "79876543",
          paquete_adquirido: "COMPLETO",
          saldo_pendiente: 360
        }
      }, null, 2),
      snippetCurl: (key, host) => `curl -X POST "${host}/api/v1/estudiantes/matricular" \\
  -H "x-api-key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "numero_documento": "79876543",
    "nombres": "María Elena",
    "apellidos": "Torres Morales",
    "email": "maria.torres@gmail.com",
    "paquete": "COMPLETO",
    "monto_total": 540,
    "cuota_inicial_pagada": 180
  }'`,
      snippetJs: (key, host) => `const response = await fetch("${host}/api/v1/estudiantes/matricular", {
  method: "POST",
  headers: {
    "x-api-key": "${key}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    numero_documento: "79876543",
    nombres: "María Elena",
    apellidos: "Torres Morales",
    email: "maria.torres@gmail.com",
    paquete: "COMPLETO",
    monto_total: 540,
    cuota_inicial_pagada: 180
  })
});
const data = await response.json();
console.log(data);`,
      snippetPython: (key, host) => `import requests

url = "${host}/api/v1/estudiantes/matricular"
headers = {
    "x-api-key": "${key}",
    "Content-Type": "application/json"
}
payload = {
    "numero_documento": "79876543",
    "nombres": "María Elena",
    "apellidos": "Torres Morales",
    "email": "maria.torres@gmail.com",
    "paquete": "COMPLETO",
    "monto_total": 540,
    "cuota_inicial_pagada": 180
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
    },
    {
      id: 'post-pago',
      metodo: 'POST',
      ruta: '/api/v1/pagos/registrar',
      titulo: 'Registrar abono de cuota desde pasarela',
      descripcion: 'Liquida una cuota pendiente del cronograma financiero del alumno. Se sincroniza de inmediato con Supabase y el historial de transacciones.',
      requiereAuth: true,
      ejemploBody: JSON.stringify({
        numero_documento: "71234567",
        monto: 180,
        metodo_pago: "Yape / Plin",
        nro_operacion: "OP-9872134",
        nro_recibo: "REC-2026-0089"
      }, null, 2),
      ejemploRespuesta: JSON.stringify({
        success: true,
        message: "Abono de S/ 180.00 registrado exitosamente",
        transaccion: {
          estudiante: "Carlos Alberto Quispe Ramos",
          monto_abonado: 180,
          cuota_afectada: "Cuota 02",
          saldo_pendiente: 0,
          estado_credito: "Completado"
        }
      }, null, 2),
      snippetCurl: (key, host) => `curl -X POST "${host}/api/v1/pagos/registrar" \\
  -H "x-api-key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "numero_documento": "71234567",
    "monto": 180,
    "metodo_pago": "Yape",
    "nro_operacion": "OP-9872134"
  }'`,
      snippetJs: (key, host) => `const response = await fetch("${host}/api/v1/pagos/registrar", {
  method: "POST",
  headers: {
    "x-api-key": "${key}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    numero_documento: "71234567",
    monto: 180,
    metodo_pago: "Yape",
    nro_operacion: "OP-9872134"
  })
});
const data = await response.json();
console.log(data);`,
      snippetPython: (key, host) => `import requests

url = "${host}/api/v1/pagos/registrar"
headers = {
    "x-api-key": "${key}",
    "Content-Type": "application/json"
}
payload = {
    "numero_documento": "71234567",
    "monto": 180,
    "metodo_pago": "Yape",
    "nro_operacion": "OP-9872134"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
    },
    {
      id: 'get-catalogo',
      metodo: 'GET',
      ruta: '/api/v1/catalogo',
      titulo: 'Consultar catálogo institucional de programas',
      descripcion: 'Devuelve todos los diplomados, cursos y talleres activos configurados en el campus con sus códigos, módulos y duración.',
      requiereAuth: true,
      ejemploRespuesta: JSON.stringify({
        success: true,
        total_programas: 18,
        data: {
          diplomados: [
            { id: "1", codigo: "DIP-01", titulo: "DIPLOMADO EN DERECHO MINERO", duracion: "420 horas" }
          ],
          cursos: [
            { id: "2", codigo: "CUR-01", titulo: "LEGISLACIÓN Y CONTRATOS MINEROS" }
          ]
        }
      }, null, 2),
      snippetCurl: (key, host) => `curl -X GET "${host}/api/v1/catalogo" \\
  -H "x-api-key: ${key}"`,
      snippetJs: (key, host) => `const response = await fetch("${host}/api/v1/catalogo", {
  headers: { "x-api-key": "${key}" }
});
const data = await response.json();
console.log(data);`,
      snippetPython: (key, host) => `import requests

response = requests.get("${host}/api/v1/catalogo", headers={"x-api-key": "${key}"})
print(response.json())`
    },
    {
      id: 'get-certificado',
      metodo: 'GET',
      ruta: '/api/v1/certificados/{codigo}',
      titulo: 'Verificación pública de autenticidad de diplomas',
      descripcion: 'Permite a empresas mineras y empleadores comprobar la validez oficial de un diploma emitido por EDUMIN mediante su código alfanumérico.',
      requiereAuth: false,
      parametros: [
        { nombre: 'codigo', tipo: 'string', requerido: true, descripcion: 'Código de verificación del certificado (ej. EDU-2026-9812)' }
      ],
      ejemploRespuesta: JSON.stringify({
        success: true,
        valido: true,
        certificado: {
          codigo_verificacion: "EDU-2026-9812",
          estudiante: "Carlos Alberto Quispe Ramos",
          programa: "DIPLOMADO EN DERECHO MINERO",
          horas_academicas: 420,
          estado: "AUTENTICADO_OFICIAL",
          institucion: "ESCUELA DE MINERÍA DEL PERÚ (EDUMIN)"
        }
      }, null, 2),
      snippetCurl: (key, host) => `curl -X GET "${host}/api/v1/certificados/EDU-2026-9812"`,
      snippetJs: (key, host) => `const response = await fetch("${host}/api/v1/certificados/EDU-2026-9812");
const data = await response.json();
console.log(data);`,
      snippetPython: (key, host) => `import requests

response = requests.get("${host}/api/v1/certificados/EDU-2026-9812")
print(response.json())`
    }
  ];

  const endpointActivo = endpoints.find(e => e.id === endpointActivoId) || endpoints[0];

  // Sincronizar el cuerpo de prueba cuando cambia el endpoint activo
  useEffect(() => {
    if (endpointActivo.ejemploBody) {
      setBodyTest(endpointActivo.ejemploBody);
    } else {
      setBodyTest('');
    }
    setResultadoTest(null);
  }, [endpointActivoId]);

  const copiarAlPortapapeles = (texto: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(texto);
      setCopiadoKey(true);
      setTimeout(() => setCopiadoKey(false), 2000);
    }
  };

  // Ejecución de prueba interactiva contra el endpoint real
  const ejecutarPruebaEndpoint = async () => {
    setProbando(true);
    setResultadoTest(null);
    const inicio = performance.now();

    try {
      let url = `${hostActual}${endpointActivo.ruta}`;
      if (url.includes('{dni}')) {
        url = url.replace('{dni}', encodeURIComponent(parametroTest.trim() || '71234567'));
      } else if (url.includes('{codigo}')) {
        url = url.replace('{codigo}', encodeURIComponent(parametroTest.trim() || 'EDU-2026-9812'));
      }

      const tokenParaLlamada = apiKey || 'edumin_live_6cba7f9e1a2b3c4d5e6f8a9b0c1d2e3f';
      const headers: Record<string, string> = {
        'x-api-key': tokenParaLlamada
      };

      const options: RequestInit = {
        method: endpointActivo.metodo,
        headers
      };

      if (endpointActivo.metodo === 'POST' && bodyTest.trim()) {
        headers['Content-Type'] = 'application/json';
        options.body = bodyTest;
      }

      const res = await fetch(url, options);
      const fin = performance.now();
      const json = await res.json().catch(() => ({ mensaje: 'Respuesta no JSON' }));

      setResultadoTest({
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        tiempoMs: Math.round(fin - inicio),
        data: json
      });
    } catch (err: any) {
      const fin = performance.now();
      setResultadoTest({
        status: 500,
        statusText: 'Network Error',
        tiempoMs: Math.round(fin - inicio),
        data: { error: err.message || 'Error al conectar con la API' }
      });
    } finally {
      setProbando(false);
    }
  };

  const keyOculta = apiKey ? `${apiKey.substring(0, 12)}${'•'.repeat(20)}${apiKey.slice(-4)}` : 'edumin_live_••••••••••••••••••••3f';

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Code2 className="size-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    APIs y desarrolladores
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Documentación interactiva, claves de acceso y consola de pruebas en vivo para integraciones externas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  API v1 activa
                </span>
              </div>
            </div>

            {/* SECCIÓN 1: TARJETA DE API KEY AUTÉNTICA Y SEGURA */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Clave de API de producción (Master API key)
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>Autenticación Bearer / x-api-key</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta clave autoriza a sus sistemas externos (CRM, bots de WhatsApp, pasarelas de pago o web comercial) a interactuar de forma segura con la base de datos de EDUMIN. Manténgala en reserva.
              </p>

              {/* Visor de clave con botón copiar y ocultar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 font-mono text-xs">
                  <span className="truncate text-slate-700 dark:text-slate-300 font-semibold select-all">
                    {cargandoKey ? 'Cargando clave de API...' : (mostrarKey ? apiKey : keyOculta)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarKey(!mostrarKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                    title={mostrarKey ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {mostrarKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(apiKey)}
                  disabled={!apiKey}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {copiadoKey ? <Check className="size-4 text-emerald-400 dark:text-emerald-600" /> : <Copy className="size-4" />}
                  <span>{copiadoKey ? 'Copiada al portapapeles' : 'Copiar clave'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Encabezado recomendado: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">x-api-key: TU_API_KEY</code></span>
                <span>O bien: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">Authorization: Bearer TU_API_KEY</code></span>
              </div>
            </div>

            {/* SECCIÓN 2: LIBRO DE DOCUMENTACIÓN Y CONSOLA INTERACTIVA (PLAYGROUND) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Columna Lateral: Selector de Endpoints */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <BookOpen className="size-4 text-cyan-600" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Catálogo de endpoints
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {endpoints.map((ep) => {
                    const esActivo = ep.id === endpointActivoId;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => setEndpointActivoId(ep.id)}
                        className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-3 cursor-pointer ${
                          esActivo 
                            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 shadow-xs' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                          ep.metodo === 'GET' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}>
                          {ep.metodo}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${esActivo ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'}`}>
                            {ep.titulo}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {ep.ruta}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Columna Principal: Detalle, Consola de Pruebas y Snippets de Código */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Detalle del Endpoint */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                        endpointActivo.metodo === 'GET' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {endpointActivo.metodo}
                      </span>
                      <code className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {endpointActivo.ruta}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {endpointActivo.requiereAuth ? 'Requiere API Key' : 'Público'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {endpointActivo.titulo}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {endpointActivo.descripcion}
                    </p>
                  </div>

                  {/* Parámetros */}
                  {endpointActivo.parametros && endpointActivo.parametros.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Parámetros de ruta / consulta
                      </h4>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                            <tr>
                              <th className="py-2.5 px-3 text-left">Parámetro</th>
                              <th className="py-2.5 px-3 text-left">Tipo</th>
                              <th className="py-2.5 px-3 text-left">Estado</th>
                              <th className="py-2.5 px-3 text-left">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {endpointActivo.parametros.map((param, pIdx) => (
                              <tr key={pIdx}>
                                <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">{param.nombre}</td>
                                <td className="py-2 px-3 text-slate-500 font-mono">{param.tipo}</td>
                                <td className="py-2 px-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${param.requerido ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {param.requerido ? 'Requerido' : 'Opcional'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500">{param.descripcion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* CONSOLA DE PRUEBAS EN VIVO */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="size-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Consola de pruebas en vivo
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">Petición real contra el servidor</span>
                    </div>

                    {/* Campo de parámetro si aplica */}
                    {endpointActivo.ruta.includes('{') && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                          Valor de prueba para parámetro ({endpointActivo.ruta.includes('{dni}') ? 'DNI' : 'Código'}):
                        </label>
                        <input
                          type="text"
                          value={parametroTest}
                          onChange={(e) => setParametroTest(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Ej. 71234567"
                        />
                      </div>
                    )}

                    {/* Editor de cuerpo JSON si es POST */}
                    {endpointActivo.metodo === 'POST' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                          Cuerpo JSON de la petición (Payload):
                        </label>
                        <textarea
                          rows={6}
                          value={bodyTest}
                          onChange={(e) => setBodyTest(e.target.value)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {/* Botón de Enviar Petición */}
                    <button
                      type="button"
                      onClick={ejecutarPruebaEndpoint}
                      disabled={probando}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {probando ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                      <span>{probando ? 'Ejecutando petición...' : 'Enviar petición de prueba'}</span>
                    </button>

                    {/* Resultado en vivo */}
                    {resultadoTest && (
                      <div className="mt-4 p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              resultadoTest.status >= 200 && resultadoTest.status < 300
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {resultadoTest.status} {resultadoTest.statusText}
                            </span>
                            <span className="text-[11px] text-slate-400">{resultadoTest.tiempoMs} ms</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">application/json</span>
                        </div>
                        <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 p-2">
                          {JSON.stringify(resultadoTest.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* SNIPPETS DE CÓDIGO (cURL, JavaScript, Python) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="size-4 text-slate-600 dark:text-slate-300" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Código de integración listo para usar
                      </h4>
                    </div>

                    {/* Selector de lenguaje */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setLenguajeSnippet('curl')}
                        className={`px-2.5 py-1 rounded-lg transition ${lenguajeSnippet === 'curl' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        cURL
                      </button>
                      <button
                        type="button"
                        onClick={() => setLenguajeSnippet('js')}
                        className={`px-2.5 py-1 rounded-lg transition ${lenguajeSnippet === 'js' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        JavaScript
                      </button>
                      <button
                        type="button"
                        onClick={() => setLenguajeSnippet('python')}
                        className={`px-2.5 py-1 rounded-lg transition ${lenguajeSnippet === 'python' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                      >
                        Python
                      </button>
                    </div>
                  </div>

                  {/* Bloque de código con botón copiar */}
                  <div className="relative bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = lenguajeSnippet === 'curl' 
                          ? endpointActivo.snippetCurl(apiKey, hostActual)
                          : (lenguajeSnippet === 'js' ? endpointActivo.snippetJs(apiKey, hostActual) : endpointActivo.snippetPython(apiKey, hostActual));
                        copiarAlPortapapeles(snippet);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Copiar código"
                    >
                      <Copy className="size-3.5" />
                      <span>Copiar</span>
                    </button>

                    <pre className="pr-16 text-slate-300 leading-relaxed">
                      {lenguajeSnippet === 'curl' && endpointActivo.snippetCurl(apiKey, hostActual)}
                      {lenguajeSnippet === 'js' && endpointActivo.snippetJs(apiKey, hostActual)}
                      {lenguajeSnippet === 'python' && endpointActivo.snippetPython(apiKey, hostActual)}
                    </pre>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
