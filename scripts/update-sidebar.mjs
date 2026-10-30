import fs from 'fs';
import path from 'path';

const filePath = path.resolve('components/admin/admin-sidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace("'/admin/estudiantes': 'Estudiantes y Secretaría'", "'/admin/estudiantes': 'Estudiantes'");
content = content.replace("label: 'Estudiantes y secretaría'", "label: 'Estudiantes'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('admin-sidebar.tsx actualizado exitosamente');
