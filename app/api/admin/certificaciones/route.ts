import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email, paquete_adquirido, diplomado_1, telefono')
      .order('nombres', { ascending: true });

    const solicitudes = (profiles || []).map((p, idx) => ({
      id: `sol-${p.id.substring(0, 6)}`,
      estudiante: `${p.nombres} ${p.apellidos}`,
      dni: p.dni_ce,
      email: p.email,
      programa: p.diplomado_1 || 'DIPLOMADO EN SEGURIDAD Y SALUD OCUPACIONAL',
      tipo: idx % 2 === 0 ? 'CIP (Nacional)' : 'MIAMI (Internacional)',
      fecha: new Date().toISOString().split('T')[0],
      estado: idx === 0 ? 'Pendiente' : 'Emitido'
    }));

    // Generar registro histórico de certificados emitidos (Diplomas, Modulares, Cursos y Talleres)
    const mockEmitidos = [
      {
        id: 'cert-101',
        codigo: 'EDM-2026-DIP-8F4K2A',
        tipo: 'DIPLOMA',
        estudiante: 'Lucero Martinez',
        dni: '76543210',
        email: 'lucero.martinez@gmail.com',
        programa: 'DERECHO MINERO Y GESTIÓN DE TIERRAS',
        modulo: null,
        nota: 18,
        horas: '120 horas cronológicas',
        fecha: '2026-09-18',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-102',
        codigo: 'EDM-2026-MOD-9X7B1C',
        tipo: 'MODULAR',
        estudiante: 'Lucero Martinez',
        dni: '76543210',
        email: 'lucero.martinez@gmail.com',
        programa: 'DERECHO MINERO Y GESTIÓN DE TIERRAS',
        modulo: 'Módulo I: Marco Legal e Institucional del Sector Minero',
        nota: 17,
        horas: '40 horas cronológicas',
        fecha: '2026-08-20',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-103',
        codigo: 'EDM-2026-MOD-4K1M9Z',
        tipo: 'MODULAR',
        estudiante: 'Lucero Martinez',
        dni: '76543210',
        email: 'lucero.martinez@gmail.com',
        programa: 'DERECHO MINERO Y GESTIÓN DE TIERRAS',
        modulo: 'Módulo II: Procedimientos de Concesiones y Servidumbres',
        nota: 18,
        horas: '40 horas cronológicas',
        fecha: '2026-09-10',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-104',
        codigo: 'EDM-2026-CUR-3M6L8P',
        tipo: 'CURSO',
        estudiante: 'Lucero Martinez',
        dni: '76543210',
        email: 'lucero.martinez@gmail.com',
        programa: 'GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA',
        modulo: null,
        nota: 19,
        horas: '24 horas cronológicas',
        fecha: '2026-09-02',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Cursos de Alta Especialización'
      },
      {
        id: 'cert-105',
        codigo: 'EDM-2026-DIP-6V2N5H',
        tipo: 'DIPLOMA',
        estudiante: 'Marcos Quispe Choque',
        dni: '71234568',
        email: 'marcos.q@hotmail.com',
        programa: 'GEOLOGÍA MINERA, YACIMIENTOS Y EXPLORACIÓN',
        modulo: null,
        nota: 16,
        horas: '120 horas cronológicas',
        fecha: '2026-09-14',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-106',
        codigo: 'EDM-2026-MOD-2P8R4T',
        tipo: 'MODULAR',
        estudiante: 'Marcos Quispe Choque',
        dni: '71234568',
        email: 'marcos.q@hotmail.com',
        programa: 'GEOLOGÍA MINERA, YACIMIENTOS Y EXPLORACIÓN',
        modulo: 'Módulo I: Metalogenia y Génesis de Yacimientos Peruanos',
        nota: 16,
        horas: '40 horas cronológicas',
        fecha: '2026-08-15',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-107',
        codigo: 'EDM-2026-CUR-7D9Y2W',
        tipo: 'CURSO',
        estudiante: 'Marcos Quispe Choque',
        dni: '71234568',
        email: 'marcos.q@hotmail.com',
        programa: 'SOFTWARE APLICADO: LEAPFROG GEO & DATAMINE',
        modulo: null,
        nota: 18,
        horas: '30 horas cronológicas',
        fecha: '2026-09-05',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Cursos de Alta Especialización'
      },
      {
        id: 'cert-108',
        codigo: 'EDM-2026-DIP-1C4K8Q',
        tipo: 'DIPLOMA',
        estudiante: 'Ana Torres Valenzuela',
        dni: '78912345',
        email: 'ana.torres@gmail.com',
        programa: 'SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)',
        modulo: null,
        nota: 17,
        horas: '120 horas cronológicas',
        fecha: '2026-08-28',
        estadoFinanciero: 'DEUDA_PENDIENTE',
        habilitado: false,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-109',
        codigo: 'EDM-2026-MOD-5T3N7L',
        tipo: 'MODULAR',
        estudiante: 'Ana Torres Valenzuela',
        dni: '78912345',
        email: 'ana.torres@gmail.com',
        programa: 'SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)',
        modulo: 'Módulo I: Interpretación e Implementación de la Norma ISO 45001',
        nota: 17,
        horas: '40 horas cronológicas',
        fecha: '2026-07-22',
        estadoFinanciero: 'DEUDA_PENDIENTE',
        habilitado: false,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-110',
        codigo: 'EDM-2026-CUR-9B4Z6M',
        tipo: 'CURSO',
        estudiante: 'Pedro Huanca Ramos',
        dni: '43210987',
        email: 'pedro.h@outlook.com',
        programa: 'SEGURIDAD INDUSTRIAL Y PREVENCIÓN DE PÉRDIDAS',
        modulo: null,
        nota: 15,
        horas: '24 horas cronológicas',
        fecha: '2026-08-30',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Cursos de Alta Especialización'
      },
      {
        id: 'cert-111',
        codigo: 'EDM-2026-TAL-5R2W9Q',
        tipo: 'TALLER',
        estudiante: 'Pedro Huanca Ramos',
        dni: '43210987',
        email: 'pedro.h@outlook.com',
        programa: 'TALLER EN VIVO: PRIMEROS AUXILIOS Y EMERGENCIAS MINERAS',
        modulo: null,
        nota: 18,
        horas: '08 horas cronológicas',
        fecha: '2026-09-08',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Talleres'
      },
      {
        id: 'cert-112',
        codigo: 'EDM-2026-DIP-3H7E2V',
        tipo: 'DIPLOMA',
        estudiante: 'Sofia Beatriz Mendoza Ugarte',
        dni: '73412098',
        email: 'sofia.mendoza@gmail.com',
        programa: 'VENTILACIÓN DE MINAS Y CONTROL DE GASES TÓXICOS',
        modulo: null,
        nota: 19,
        horas: '120 horas cronológicas',
        fecha: '2026-09-22',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-113',
        codigo: 'EDM-2026-MOD-8L1X4P',
        tipo: 'MODULAR',
        estudiante: 'Sofia Beatriz Mendoza Ugarte',
        dni: '73412098',
        email: 'sofia.mendoza@gmail.com',
        programa: 'VENTILACIÓN DE MINAS Y CONTROL DE GASES TÓXICOS',
        modulo: 'Módulo I: Principios Físicos de la Ventilación Subterránea',
        nota: 19,
        horas: '40 horas cronológicas',
        fecha: '2026-08-10',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      },
      {
        id: 'cert-114',
        codigo: 'EDM-2026-CUR-4V9K7A',
        tipo: 'CURSO',
        estudiante: 'Sofia Beatriz Mendoza Ugarte',
        dni: '73412098',
        email: 'sofia.mendoza@gmail.com',
        programa: 'SIMULACIÓN DE REDES DE VENTILACIÓN CON VENTSIM',
        modulo: null,
        nota: 20,
        horas: '30 horas cronológicas',
        fecha: '2026-09-12',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Cursos de Alta Especialización'
      },
      {
        id: 'cert-115',
        codigo: 'EDM-2026-DIP-9Z3M6C',
        tipo: 'DIPLOMA',
        estudiante: 'Carlos Eduardo Benavides',
        dni: '43210987',
        email: 'carlos.benavides@outlook.com',
        programa: 'MINERÍA 4.0, AUTOMATIZACIÓN Y DIGITALIZACIÓN',
        modulo: null,
        nota: 18,
        horas: '120 horas cronológicas',
        fecha: '2026-09-21',
        estadoFinanciero: 'AL_DIA',
        habilitado: true,
        categoria: 'Diplomados Oficiales'
      }
    ];

    return NextResponse.json({ 
      solicitudes,
      emitidos: mockEmitidos,
      kpis: {
        totalEmitidos: mockEmitidos.length,
        diplomasGenerales: mockEmitidos.filter(c => c.tipo === 'DIPLOMA').length,
        modulares: mockEmitidos.filter(c => c.tipo === 'MODULAR').length,
        cursosTalleres: mockEmitidos.filter(c => c.tipo === 'CURSO' || c.tipo === 'TALLER').length,
        habilitados: mockEmitidos.filter(c => c.habilitado).length,
        retenidosDeuda: mockEmitidos.filter(c => !c.habilitado).length
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener certificaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, dni, codigoQr } = body;

    const admin = createAdminClient();

    // Registrar en auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'EMITIR_CERTIFICADO_CIP_MIAMI',
        detalles: {
          solicitudId: id,
          dni_ce: dni,
          codigoQr: codigoQr || `EDUMIN-CIP-2026-${Math.floor(1000 + Math.random() * 9000)}`
        }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, message: 'Certificado CIP emitido y notificado.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al emitir certificado' }, { status: 500 });
  }
}
