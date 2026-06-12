export type FlowCaseKey = 'near' | 'mid' | 'far'
export type QuestionType = 'acts' | 'acts+dur' | 'level' | 'binary'

export type FlowQuestion = {
  name: string
  q: string
  lift: number
  type: QuestionType
  whatis: string
  acts?: string[]
  line?: string
  noNote?: string
}

export type FlowScenario = {
  cv: string
  vac: string
  reqs: number
  from: number
  to: number
  t1Title: string
  t1Sub: string
  verdict: string
  gaps: FlowQuestion[]
}

export const LEVELS = ['B1 (igual que hoy)', 'B2', 'C1'] as const
export const CERTS = ['Con certificado', 'Autoevaluado — honesto'] as const
export const SRC_FRAG: Record<string, string> = {
  'Proyectos personales': 'en proyectos personales',
  Freelance: 'como freelance',
  'Empleo anterior': 'en un empleo anterior',
  'Estudios o cursos': 'en estudios y cursos prácticos',
  Voluntariado: 'en voluntariado',
}
export const DUR_FRAG: Record<string, string> = {
  'Menos de 1 año': 'desde hace menos de un año',
  '1–3 años': 'desde hace 1–3 años',
  '3+ años': 'desde hace más de 3 años',
}

export const SCENARIOS: Record<FlowCaseKey, FlowScenario> = {
  near: {
    cv: 'Maria_Fernandez_CV.pdf',
    vac: 'Buscamos especialista en marketing digital para liderar campañas pagadas en Meta Ads y Google Ads: planificar, ejecutar, analizar métricas y reportar ROI. Deseable inglés intermedio-alto.',
    reqs: 6,
    from: 62,
    to: 74,
    t1Title: 'Tu CV ya conecta con esta vacante.',
    t1Sub: 'Lo principal está. Estas preguntas pueden subirlo más — todas opcionales.',
    verdict: 'Tu experiencia <b>sí conecta con lo principal</b>. Reescribimos tu CV en el lenguaje de la vacante y reforzamos tus logros reales. Lo que confirmes abajo, lo suma.',
    gaps: [
      { name: 'Campañas de Meta Ads', q: 'Obligatorio en la vacante. Tu CV no lo muestra todavía.', lift: 7, type: 'acts', whatis: 'Cuenta cualquier campaña real que hayas creado u operado — propia, de un cliente o de un empleo. No cuenta solo haber visto tutoriales.', acts: ['Creé y configuré campañas', 'Segmenté audiencias', 'Optimicé presupuesto', 'Hice A/B testing de creativos', 'Usé el Pixel / eventos', 'Leí y reporté resultados'] },
      { name: 'Reportes de ROI', q: 'Aparece como deseable en la vacante.', lift: 5, type: 'acts', whatis: 'Cuenta si calculaste retorno o presentaste resultados con números reales, aunque fuera en algo pequeño.', acts: ['Calculé ROI / ROAS', 'Armé reportes periódicos', 'Presenté resultados al equipo', 'Propuse mejoras con base en datos'] },
      { name: 'Nivel de inglés', q: 'Tu CV dice B1. La vacante pide intermedio-alto. ¿Tu nivel real hoy es otro?', lift: 4, type: 'level', whatis: 'Tu nivel real de hoy, el que defenderías en una llamada. Con certificado mejor; sin certificado lo marcamos como autoevaluado. Lo que no hacemos es inventarlo.' },
    ],
  },
  mid: {
    cv: 'Maria_Fernandez_CV.pdf',
    vac: 'Buscamos especialista en marketing digital con dominio de Meta Ads, análisis de métricas de campañas y reportes de ROI mensuales. Inglés B2 deseable.',
    reqs: 5,
    from: 44,
    to: 58,
    t1Title: 'Hay base real. Y margen para subir.',
    t1Sub: 'Tus skills blandas pesan a tu favor. Estas 3 preguntas pueden cambiar el número.',
    verdict: 'Reforzamos <b>todo lo real que conecta</b>. La vacante pide 3 cosas que tu CV no muestra todavía — si las viviste, confírmalas abajo. Si no, tu CV queda honesto igual.',
    gaps: [
      { name: 'Campañas de Meta Ads', q: 'Obligatorio en la vacante. Tu CV no lo muestra.', lift: 6, type: 'acts', whatis: 'Cuenta cualquier campaña real que hayas creado u operado.', acts: ['Creé y configuré campañas', 'Segmenté audiencias', 'Optimicé presupuesto', 'Hice A/B testing de creativos', 'Usé el Pixel / eventos'] },
      { name: 'Análisis de métricas de campañas', q: 'Tu CV lo muestra parcialmente.', lift: 5, type: 'acts', whatis: 'Cuenta si seguiste números de campañas reales y decidiste con ellos.', acts: ['Analicé ROAS / CPC / CPA', 'Monitoreé campañas activas', 'Optimicé con base en datos', 'Documenté aprendizajes'] },
      { name: 'Nivel de inglés', q: 'Tu CV dice B1. La vacante pide B2. ¿Tu nivel real hoy es otro?', lift: 4, type: 'level', whatis: 'Tu nivel real de hoy. Con certificado mejor; sin certificado lo marcamos como autoevaluado.' },
    ],
  },
  far: {
    cv: 'Rosa_Alvarez_CV.pdf',
    vac: 'About the job: We are seeking an AI Conversational Agents Specialist to lead the design, implementation, and integration of AI-powered solutions leveraging LLMs. Requirements: 3–5 years developing conversational AI, chatbots, NLP and LLM-based agents. Fluent English (B2+ or C1). Valid U.S. visa required.',
    reqs: 7,
    from: 21,
    to: 27,
    t1Title: 'Hay distancia con esta vacante. Preguntemos antes de sentenciar.',
    t1Sub: 'Reforzamos todo lo real. Y estas 5 preguntas pueden cambiar el número — hasta +32.',
    verdict: 'Tu gestión de productos, tu research y tus resultados <b>ya están reforzados</b>. La vacante pide varias cosas que tu CV todavía no muestra — pero <b>nada se da por perdido sin preguntar</b>. Lo que sí viviste, sube. Lo que no, te lo decimos derecho y sin drama.',
    gaps: [
      { name: 'Visa de EE. UU. vigente', q: 'La vacante la exige. ¿La tienes?', lift: 8, type: 'binary', whatis: 'Solo cuenta una visa vigente que te autorice a trabajar en EE. UU. Es un requisito legal — por eso preguntamos directo.', line: 'Autorización de trabajo: visa de EE. UU. vigente.', noNote: '<b>Gracias por la honestidad.</b> Esta vacante lo exige por ley — ningún CV lo arregla, y no es un defecto tuyo. Tu crédito rinde más en vacantes sin este requisito.' },
      { name: 'Experiencia construyendo con IA', q: 'La vacante pide años construyendo soluciones con IA. ¿Lo has hecho — aunque sea en proyectos propios que no están en tu CV?', lift: 9, type: 'acts+dur', whatis: 'Cuenta lo real aunque nunca haya sido un empleo: chatbots que armaste, agentes que configuraste, automatizaciones con LLMs. Los proyectos propios son experiencia.', acts: ['Construí chatbots / agentes con LLMs', 'Diseñé prompts y flujos conversacionales', 'Automaticé procesos con herramientas de IA', 'Integré modelos (OpenAI, Claude, etc.) en productos', 'Lancé un producto con IA a usuarios reales'] },
      { name: 'Nivel de inglés', q: 'Tu CV dice B1. La vacante exige B2+ o C1. ¿Tu nivel real hoy es otro?', lift: 6, type: 'level', whatis: 'El nivel que defenderías en una entrevista en inglés. Si sigue en B1, dejarlo así también te protege.' },
      { name: 'Integraciones con APIs', q: 'La vacante lo pide. ¿Has conectado sistemas de verdad?', lift: 4, type: 'acts', whatis: 'Cuenta si conectaste herramientas o automatizaste flujos reales, en cualquier contexto.', acts: ['Conecté herramientas vía API', 'Configuré webhooks / integraciones', 'Automaticé flujos entre apps', 'Documenté integraciones'] },
      { name: 'Herramientas de IA que dominas', q: 'La vacante valora el stack. ¿Cuáles usas de verdad?', lift: 5, type: 'acts', whatis: 'Marca solo las que podrías abrir hoy y usar sin tutorial.', acts: ['APIs de OpenAI / Anthropic', 'Plataformas de agentes (n8n, Make, etc.)', 'Bases vectoriales / RAG básico', 'Prompting avanzado', 'Modelos open-source locales'] },
    ],
  },
}

export function getScenarioKey(value: string | string[] | undefined): FlowCaseKey {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'near' || raw === 'mid' || raw === 'far' ? raw : 'far'
}
