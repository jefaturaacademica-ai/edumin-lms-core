import { getDiplomadoByTitleOrSlug, ALL_DIPLOMADOS } from '../lib/data/diplomadosData.ts';

console.log('--- TEST GEOMETALURGIA ---');
const dip = getDiplomadoByTitleOrSlug('GEOMETALURGIA');
console.log('Resultado para GEOMETALURGIA:', dip?.titulo, 'slug:', dip?.slug);

console.log('\nTodos los diplomados disponibles:');
ALL_DIPLOMADOS.forEach(d => console.log(`- ${d.numId}: ${d.slug} -> ${d.titulo}`));
