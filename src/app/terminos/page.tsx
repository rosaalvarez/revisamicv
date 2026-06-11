import type { Metadata } from 'next'
import { LegalSection, LegalShell } from '@/components/LegalShell'

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Términos de uso de RevisaMiCV: análisis por vacante, créditos, descargas, pagos, soporte y regla anti-invención.',
  alternates: { canonical: '/terminos' },
}

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Términos de uso"
      title="RevisaMiCV ayuda a aplicar mejor. No promete empleo."
      intro="Estos términos definen el uso básico del producto: análisis CV + vacante, créditos, descargas y límites honestos de la herramienta."
    >
      <LegalSection title="Qué hace RevisaMiCV">
        <p>RevisaMiCV analiza un CV frente a una vacante específica y genera recomendaciones, score de compatibilidad, brechas, keywords y un CV adaptado descargable en PDF, DOCX o TXT.</p>
      </LegalSection>
      <LegalSection title="Qué no prometemos">
        <p>No garantizamos entrevistas, contratación, aprobación por ATS ni resultados laborales. El score es una ayuda de decisión basada en el texto del CV y la vacante, no una predicción exacta del proceso interno de cada empresa.</p>
      </LegalSection>
      <LegalSection title="Regla anti-invención">
        <p>El producto está diseñado para mejorar la forma de contar tu experiencia real. No debe usarse para fabricar empleadores, cargos, estudios, certificaciones, años de experiencia, herramientas o métricas falsas.</p>
      </LegalSection>
      <LegalSection title="Créditos y pagos">
        <p>Cada crédito equivale a un análisis de CV contra una vacante. Los créditos no son suscripción mensual y quedan asociados al email usado en Stripe/RevisaMiCV.</p>
        <p>Si Stripe confirma el pago pero los créditos no aparecen, debes usar el mismo email de compra en el dashboard o contactar soporte para conciliación manual.</p>
      </LegalSection>
      <LegalSection title="Errores y reembolsos">
        <p>Si un pago se duplica, no se acredita correctamente o ocurre un error técnico verificable, revisaremos el caso manualmente. Podemos acreditar créditos pendientes o evaluar reembolso según el caso y la evidencia de pago.</p>
      </LegalSection>
      <LegalSection title="Uso responsable">
        <p>No uses RevisaMiCV para fraude, spam, suplantación, documentos falsos o automatización abusiva. Podemos limitar acceso si detectamos uso indebido del sistema o abuso del análisis gratuito.</p>
      </LegalSection>
      <LegalSection title="Soporte">
        <p>Para soporte, escribe con el email usado en la plataforma y, si aplica, el email de pago de Stripe. Esto nos permite ubicar tus créditos e historial sin pedir datos innecesarios.</p>
      </LegalSection>
    </LegalShell>
  )
}
