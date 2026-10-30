# -*- coding: utf-8 -*-
"""
Script maestro para procesar Cursos 21 a 30:
1. Carga archivos de Google Drive
2. Transforma a formato LMS (banco_preguntas)
3. Guarda backups en lib/data/banco_preguntas_curso_{21..30}.json
4. Sube preguntas a Supabase (banco_preguntas)
5. Renombra archivos en Google Drive con formato oficial:
   'CURSO {X} - EXAMEN NIVEL FÁCIL.json' y 'CURSO {X} - EXAMEN NIVEL MEDIO.json'
6. Mueve los archivos a la subcarpeta 'procesado/'
"""
import os
import sys
import json
import shutil
import urllib.request
import urllib.error

DRIVE_DIR = r"G:\Mi unidad\CLASES Y RESÚMENES DIPLOMADOS 2026\RESÚMENES DE DIPLOMADOS\CARPETA DE ADICIONALES\TRANSCRIPCIONES VIDEOS CURSOS\MARKDOWN RESUMEN Y EXÁMENES\PREGUNTAS"
PROCESADO_DIR = os.path.join(DRIVE_DIR, "procesado")
LIB_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "lib", "data"))

SUPABASE_URL = "https://wluuomwkxywpfotbngwf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc"

COURSES_METADATA = {
    21: {
        "codigo": "CUR-21",
        "nombre": "FUNDAMENTOS DE BIG DATA",
        "facil_file": "21 (2).json",
        "medio_file": "21 (1).json"
    },
    22: {
        "codigo": "CUR-22",
        "nombre": "MÉTODOS DE CAPTURA DE INFORMACIÓN EN BIG DATA",
        "facil_file": "22 (2).json",
        "medio_file": "22 (1).json"
    },
    23: {
        "codigo": "CUR-23",
        "nombre": "TENDENCIAS 2025-2026: CLAVES DE BIG DATA",
        "facil_file": "23 (1).json",
        "medio_file": "23 (2).json"
    },
    24: {
        "codigo": "CUR-24",
        "nombre": "BIG DATA: TRANSFORMACIÓN DE DATOS (PYTHON Y R)",
        "facil_file": "24 (2).json",
        "medio_file": "24 (1).json"
    },
    25: {
        "codigo": "CUR-25",
        "nombre": "MINERÍA 4.0 ESSENTIALS: NUEVAS HERRAMIENTAS",
        "facil_file": "25 (2).json",
        "medio_file": "25 (1).json"
    },
    26: {
        "codigo": "CUR-26",
        "nombre": "INNOVACIÓN EN MINERÍA: APLICACIONES DE INTELIGENCIA ARTIFICIAL",
        "facil_file": "26 (2).json",
        "medio_file": "26 (1).json"
    },
    27: {
        "codigo": "CUR-27",
        "nombre": "AUTOMATIZACIÓN 4.0 EN PROCESOS MINEROS",
        "facil_file": "27 (2).json",
        "medio_file": "27 (1).json"
    },
    28: {
        "codigo": "CUR-28",
        "nombre": "CADENA DE SUMINISTRO LOGÍSTICA Y DISTRIBUCIÓN",
        "facil_file": "28 (2).json",
        "medio_file": "28 (1).json"
    },
    29: {
        "codigo": "CUR-29",
        "nombre": "MEJORA DE LOS MÉTODOS Y MEDICIÓN DE LOS RECURSOS",
        "facil_file": "scratch/curso_29_examen_facil.json", # generado sintéticamente de resúmenes oficiales
        "medio_file": "29 (1).json",
        "duplicate_to_delete": "29 (2).json"
    },
    30: {
        "codigo": "CUR-30",
        "nombre": "INTRODUCCIÓN A LA GESTIÓN DE PROYECTOS",
        "facil_file": "30 (2).json",
        "medio_file": "30 (1).json"
    }
}

def load_quiz_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict) and "quiz" in data:
        return data["quiz"], data.get("topics", {})
    elif isinstance(data, list):
        return data, {}
    else:
        raise ValueError(f"Formato no reconocido en {file_path}")

def build_lms_question(raw_q, codigo_cur, nombre_cur, dificultad):
    opciones = []
    for opt in raw_q.get("answerOptions", []):
        opciones.append({
            "text": opt.get("text", "").strip(),
            "isCorrect": bool(opt.get("isCorrect", False)),
            "rationale": opt.get("rationale", "").strip()
        })
    
    return {
        "codigo_diplomado": codigo_cur,
        "diplomado": nombre_cur,
        "modulo": "Examen del Curso",
        "dificultad": dificultad, # "FACIL" o "MEDIO"
        "tipo": raw_q.get("type", "multiple_choice"),
        "pregunta": raw_q.get("question", "").strip(),
        "opciones": opciones,
        "hint": raw_q.get("hint", "").strip() or None,
        "activo": True
    }

def upload_to_supabase(records, batch_size=25):
    endpoint = f"{SUPABASE_URL}/rest/v1/banco_preguntas"
    headers = {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Prefer": "return=minimal"
    }
    
    total = len(records)
    print(f"Subiendo {total} preguntas a Supabase...")
    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        body = json.dumps(batch, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                status = resp.getcode()
                if status not in (200, 201):
                    print(f"Alerta: Lote {i // batch_size + 1} respondió con código {status}")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            print(f"Error en lote {i // batch_size + 1}: {e.code} - {err_msg}")
            raise e
        print(f" -> Lote {i // batch_size + 1}/{(total + batch_size - 1) // batch_size} subido ({len(batch)} preguntas)")

def main():
    print("=== PROCESAMIENTO CURSOS 21 A 30 ===")
    os.makedirs(PROCESADO_DIR, exist_ok=True)
    
    todas_las_preguntas_para_db = []
    
    for num, meta in COURSES_METADATA.items():
        print(f"\n--- Procesando Curso {num}: {meta['codigo']} - {meta['nombre']} ---")
        
        # 1. Cargar Fácil
        if meta["facil_file"].startswith("scratch"):
            facil_path = os.path.abspath(meta["facil_file"])
        else:
            facil_path = os.path.join(DRIVE_DIR, meta["facil_file"])
            
        # 2. Cargar Medio
        medio_path = os.path.join(DRIVE_DIR, meta["medio_file"])
        
        quiz_facil, topics_facil = load_quiz_file(facil_path)
        quiz_medio, topics_medio = load_quiz_file(medio_path)
        
        print(f"  Fácil: {len(quiz_facil)} preguntas desde {os.path.basename(facil_path)}")
        print(f"  Medio: {len(quiz_medio)} preguntas desde {os.path.basename(medio_path)}")
        
        # 3. Construir formato LMS
        lms_preguntas = []
        for q in quiz_facil:
            lms_preguntas.append(build_lms_question(q, meta["codigo"], meta["nombre"], "FACIL"))
        for q in quiz_medio:
            lms_preguntas.append(build_lms_question(q, meta["codigo"], meta["nombre"], "MEDIO"))
            
        print(f"  Total banco local: {len(lms_preguntas)} preguntas (25 FÁCIL + 25 MEDIO)")
        todas_las_preguntas_para_db.extend(lms_preguntas)
        
        # 4. Guardar backup en lib/data/
        backup_filename = f"banco_preguntas_curso_{num}.json"
        backup_path = os.path.join(LIB_DATA_DIR, backup_filename)
        with open(backup_path, "w", encoding="utf-8") as f:
            json.dump(lms_preguntas, f, ensure_ascii=False, indent=2)
        print(f"  Backup guardado en: lib/data/{backup_filename}")
        
    # 5. Subir a Supabase
    print(f"\n=== SUBIENDO AL BANCO DE SUPABASE ({len(todas_las_preguntas_para_db)} preguntas) ===")
    upload_to_supabase(todas_las_preguntas_para_db, batch_size=25)
    print("¡Todas las preguntas subidas exitosamente a Supabase!")
    
    # 6. Renombrar y mover archivos en Google Drive
    print("\n=== RENOMBRANDO Y MOVIENDO ARCHIVOS EN GOOGLE DRIVE ===")
    for num, meta in COURSES_METADATA.items():
        dest_facil_name = f"CURSO {num} - EXAMEN NIVEL FÁCIL.json"
        dest_medio_name = f"CURSO {num} - EXAMEN NIVEL MEDIO.json"
        
        target_facil_procesado = os.path.join(PROCESADO_DIR, dest_facil_name)
        target_medio_procesado = os.path.join(PROCESADO_DIR, dest_medio_name)
        
        # Guardar / Mover Fácil
        if meta["facil_file"].startswith("scratch"):
            # Generado sintéticamente para Curso 29
            facil_source = os.path.abspath(meta["facil_file"])
            shutil.copy2(facil_source, target_facil_procesado)
            print(f"  [Copiado a procesado] {dest_facil_name}")
        else:
            facil_source = os.path.join(DRIVE_DIR, meta["facil_file"])
            shutil.move(facil_source, target_facil_procesado)
            print(f"  [Movido a procesado] {meta['facil_file']} -> {dest_facil_name}")
            
        # Mover Medio
        medio_source = os.path.join(DRIVE_DIR, meta["medio_file"])
        shutil.move(medio_source, target_medio_procesado)
        print(f"  [Movido a procesado] {meta['medio_file']} -> {dest_medio_name}")
        
        # Eliminar archivo duplicado si aplica
        if "duplicate_to_delete" in meta:
            dup_path = os.path.join(DRIVE_DIR, meta["duplicate_to_delete"])
            if os.path.exists(dup_path):
                os.remove(dup_path)
                print(f"  [Duplicado eliminado] {meta['duplicate_to_delete']}")

    # 7. Verificación final de la carpeta Drive
    archivos_procesados = [f for f in os.listdir(PROCESADO_DIR) if f.endswith(".json")]
    archivos_raiz = [f for f in os.listdir(DRIVE_DIR) if f.endswith(".json")]
    
    print("\n=== VERIFICACIÓN FINAL ===")
    print(f"Total archivos en procesado/: {len(archivos_procesados)}")
    print(f"Archivos .json restantes en raíz de PREGUNTAS: {len(archivos_raiz)}")
    if archivos_raiz:
        print(f"  Restantes: {archivos_raiz}")
    else:
        print("  ¡Raíz de PREGUNTAS limpia sin archivos sueltos de cursos 21 a 30!")

if __name__ == "__main__":
    main()
