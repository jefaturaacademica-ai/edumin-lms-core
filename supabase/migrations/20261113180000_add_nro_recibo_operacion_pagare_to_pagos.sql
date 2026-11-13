-- Migración para añadir soporte formal de Recibos/Boletas, Operación Bancaria y Pagaré en la tabla pagos
ALTER TABLE public.pagos 
ADD COLUMN IF NOT EXISTS nro_pagare TEXT,
ADD COLUMN IF NOT EXISTS nro_recibo TEXT,
ADD COLUMN IF NOT EXISTS nro_operacion TEXT,
ADD COLUMN IF NOT EXISTS comprobante TEXT;

COMMENT ON COLUMN public.pagos.nro_pagare IS 'Número de pagaré o contrato financiero institucional (ej: 2026-I-0001)';
COMMENT ON COLUMN public.pagos.nro_recibo IS 'Número de recibo de caja o boleta de venta institucional (ej: REC-2026-001 o B001-00234)';
COMMENT ON COLUMN public.pagos.nro_operacion IS 'Número de operación bancaria o código de voucher digital (ej: OP-984321, Yape/BCP/BBVA). En efectivo se guarda N/A';
COMMENT ON COLUMN public.pagos.comprobante IS 'Referencia de comprobante o voucher';
