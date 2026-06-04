export type BlogPost = {
  slug: string
  title: string
  description: string
  category: string
  date: string
  readingMinutes: number
  keywords: string[]
  intro: string
  sections: Array<{ heading: string; paragraphs: string[] }>
  checklist?: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'por-que-tu-cv-no-recibe-respuestas',
    title: 'Por qué tu CV no recibe respuestas aunque sí tengas experiencia',
    description: 'Razones comunes por las que un CV no recibe respuestas: CV genérico, falta de keywords, logros poco claros y poca alineación con la vacante.',
    category: 'Búsqueda laboral',
    date: '2026-06-04',
    readingMinutes: 5,
    keywords: ['por qué mi CV no recibe respuestas', 'CV sin respuestas', 'mejorar CV', 'aplicar a vacantes'],
    intro: 'Mandar muchas aplicaciones y no recibir respuesta no siempre significa que no sirvas para el cargo. Muchas veces el problema es que tu CV no está hablando en el idioma de esa vacante específica.',
    sections: [
      { heading: 'Tu CV puede estar bien, pero demasiado genérico', paragraphs: ['Un CV genérico intenta cubrir todos tus roles posibles. El resultado es que no muestra con fuerza por qué encajas en una vacante concreta. Si una empresa busca operaciones, producto o soporte técnico, necesita ver evidencia relacionada rápido.'] },
      { heading: 'La vacante usa palabras que tu CV no usa', paragraphs: ['Los sistemas ATS y los reclutadores buscan señales: herramientas, responsabilidades, industrias, seniority y resultados. Si tienes esa experiencia pero la describes con otras palabras, puedes quedar invisible.'] },
      { heading: 'Tus logros no muestran contexto ni resultado', paragraphs: ['“Responsable de coordinar proyectos” es menos fuerte que explicar qué coordinaste, con quién, usando qué herramientas y qué resultado verificable produjo. No necesitas inventar métricas; sí necesitas claridad.'] },
    ],
    checklist: ['Compara tu CV contra una vacante real', 'Marca keywords que sí tienes', 'Reescribe 3 logros importantes', 'Quita ruido que no ayuda a esa aplicación', 'Guarda una versión específica por vacante'],
  },
  {
    slug: 'como-usar-keywords-ats-sin-mentir',
    title: 'Cómo usar keywords ATS en tu CV sin mentir ni sonar robótico',
    description: 'Aprende a incluir keywords ATS reales en tu CV conectándolas con evidencia, proyectos y experiencia verificable.',
    category: 'ATS',
    date: '2026-06-04',
    readingMinutes: 6,
    keywords: ['keywords ATS', 'ATS curriculum', 'optimizar CV ATS', 'palabras clave CV'],
    intro: 'Las keywords ATS no son una lista para copiar y pegar. Son señales que conectan tu experiencia real con lo que la vacante está pidiendo.',
    sections: [
      { heading: 'Primero entiende qué pide la vacante', paragraphs: ['Separa herramientas, responsabilidades, resultados y requisitos. No todo tiene el mismo peso: una tecnología obligatoria vale más que una frase genérica como “trabajo en equipo”.'] },
      { heading: 'Incluye solo keywords que puedas defender', paragraphs: ['Si puedes hablar de esa herramienta o responsabilidad en una entrevista, puedes incluirla. Si no puedes explicarla, no la pongas. Un CV optimizado que no puedes sostener se vuelve un problema.'] },
      { heading: 'Pon las keywords dentro de logros', paragraphs: ['En vez de una sección llena de palabras sueltas, conecta keywords con bullets: qué hiciste, dónde, con qué herramienta y para qué resultado.'] },
    ],
    checklist: ['Extrae 8–12 keywords de la vacante', 'Elimina las que no puedes defender', 'Conecta cada keyword fuerte con un logro', 'Mantén formato simple y legible', 'Evita keyword stuffing'],
  },
  {
    slug: 'adaptar-cv-para-cada-vacante-rapido',
    title: 'Cómo adaptar tu CV para cada vacante sin perder 30 minutos cada vez',
    description: 'Proceso rápido para adaptar tu CV a una vacante: detectar prioridades, reordenar logros y preparar una versión lista para enviar.',
    category: 'Productividad',
    date: '2026-06-04',
    readingMinutes: 5,
    keywords: ['adaptar CV rápido', 'CV para cada vacante', 'personalizar CV', 'CV específico'],
    intro: 'Adaptar el CV a mano puede volverse agotador. La clave es tener un proceso: leer la vacante, elegir evidencia relevante y generar una versión específica sin reinventar todo.',
    sections: [
      { heading: 'No reescribas todo desde cero', paragraphs: ['Mantén una versión base fuerte y adapta las secciones con más impacto: resumen, logros recientes, skills y proyectos relevantes.'] },
      { heading: 'Prioriza lo que la vacante repite', paragraphs: ['Si la vacante repite análisis de datos, stakeholders y automatización, esos temas deben aparecer arriba si son parte real de tu experiencia.'] },
      { heading: 'Cierra con una versión descargable', paragraphs: ['Después de adaptar, guarda un archivo con nombre claro. Así sabes qué enviaste a cada empresa y puedes prepararte mejor para entrevista.'] },
    ],
    checklist: ['Lee la vacante completa', 'Detecta 3 prioridades', 'Reordena logros', 'Ajusta resumen profesional', 'Exporta PDF/DOCX/TXT'],
  },
  {
    slug: 'cv-en-ingles-errores-comunes',
    title: 'Errores comunes al hacer un CV en inglés para trabajos remotos',
    description: 'Errores frecuentes al traducir un CV al inglés: traducción literal, verbos débiles, cargos confusos y falta de contexto global.',
    category: 'Remoto global',
    date: '2026-06-04',
    readingMinutes: 6,
    keywords: ['CV en inglés', 'errores CV inglés', 'CV remoto', 'curriculum inglés'],
    intro: 'Un CV en inglés no debería sonar como una traducción palabra por palabra. Debe sonar profesional, claro y natural para alguien que contrata en mercados globales.',
    sections: [
      { heading: 'Traducir literalmente cargos y responsabilidades', paragraphs: ['Algunos cargos locales no tienen equivalente exacto. Es mejor explicar responsabilidades reales con lenguaje claro que usar una traducción rara.'] },
      { heading: 'Usar verbos demasiado débiles', paragraphs: ['“Helped” o “was responsible for” pueden funcionar, pero muchas veces conviene ser más específico: coordinated, implemented, analyzed, improved, managed, supported.'] },
      { heading: 'No adaptar al tipo de vacante remota', paragraphs: ['Una vacante remota suele valorar comunicación escrita, autonomía, documentación y colaboración asíncrona. Si tienes evidencia real de eso, muéstrala.'] },
    ],
    checklist: ['Evita traducción literal', 'Usa verbos de acción reales', 'Conserva evidencia verificable', 'Alinea con la vacante remota', 'Revisa tono profesional'],
  },
  {
    slug: 'score-cv-vacante-como-interpretarlo',
    title: 'Qué significa un score CV vs vacante y cómo interpretarlo',
    description: 'Cómo entender un score de compatibilidad entre CV y vacante: keywords, experiencia relevante, brechas y decisión de aplicar.',
    category: 'Diagnóstico CV',
    date: '2026-06-04',
    readingMinutes: 5,
    keywords: ['score CV vacante', 'compatibilidad CV', 'analizador de CV', 'diagnóstico CV'],
    intro: 'Un score CV vs vacante no predice si te contratarán. Sirve para decidir si vale la pena aplicar, qué ajustar y qué brechas debes tener claras.',
    sections: [
      { heading: 'Score alto no garantiza entrevista', paragraphs: ['El mercado, otros candidatos, timing y decisiones internas siguen importando. Un score alto solo indica que tu CV comunica mejor encaje con esa vacante.'] },
      { heading: 'Score bajo no significa que no valgas', paragraphs: ['Puede significar que la vacante pide otro enfoque, que tu CV oculta experiencia relevante o que esa aplicación no es la mejor prioridad.'] },
      { heading: 'Úsalo para decidir estrategia', paragraphs: ['Si el score sube al adaptar el CV con evidencia real, aplica. Si las brechas siguen siendo críticas, quizás conviene buscar otra vacante o prepararte para explicar esas brechas.'] },
    ],
    checklist: ['Revisa score y brechas', 'No inventes experiencia para subirlo', 'Adapta lenguaje real', 'Compara varias vacantes', 'Prioriza donde el encaje sea más fuerte'],
  },
  {
    slug: 'chatgpt-vs-herramienta-cv',
    title: 'ChatGPT vs una herramienta para adaptar CV: cuándo usar cada opción',
    description: 'Comparación práctica entre usar ChatGPT para mejorar tu CV y usar una herramienta guiada con score, keywords y descargas.',
    category: 'Comparación',
    date: '2026-06-04',
    readingMinutes: 6,
    keywords: ['ChatGPT para CV', 'herramienta CV', 'mejorar CV con IA', 'adaptar CV con IA'],
    intro: 'ChatGPT puede ayudarte a mejorar tu CV. Pero si no tienes un buen prompt, formato, criterios y cuidado anti-invención, el proceso puede volverse lento o riesgoso.',
    sections: [
      { heading: 'ChatGPT sirve si sabes dirigirlo', paragraphs: ['Puedes pedirle reescrituras, traducciones o ideas. Pero tú tienes que controlar que no invente experiencia, que use la vacante correcta y que el resultado quede listo para enviar.'] },
      { heading: 'Una herramienta guiada reduce fricción', paragraphs: ['Un flujo cerrado puede leer CV y vacante, dar score, detectar brechas, sugerir keywords y exportar el resultado. Pagas por ahorrar tiempo y evitar prompts repetidos.'] },
      { heading: 'La regla central sigue igual', paragraphs: ['Uses lo que uses, no inventes cargos, empresas, certificaciones ni métricas. El mejor CV es claro y defendible en entrevista.'] },
    ],
    checklist: ['Usa ChatGPT para explorar', 'Usa herramienta guiada para flujo repetible', 'Verifica cada cambio', 'Exporta una versión ATS', 'Guarda el CV por vacante'],
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
