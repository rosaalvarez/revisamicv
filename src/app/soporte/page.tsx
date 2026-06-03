import { SUPPORT_EMAIL, SUPPORT_EMAIL_URL, LegalSection, LegalShell } from '@/components/LegalShell'

export default function SupportPage() {
  return (
    <LegalShell
      eyebrow="Soporte"
      title="Si pagaste, subiste un CV o algo falló, aquí está el camino claro."
      intro="La prioridad es que no pierdas créditos ni tiempo. Escríbenos con el email correcto y revisamos tu caso."
    >
      <LegalSection title="Canal principal">
        <p>Por ahora el soporte se atiende por email. Escríbenos a {SUPPORT_EMAIL}. Incluye el email usado en RevisaMiCV y, si compraste créditos, el mismo email usado en Stripe.</p>
        <p><a href={SUPPORT_EMAIL_URL} className="inline-flex rounded-full bg-[#b24aed] px-5 py-3 text-sm font-semibold text-white">Enviar email a soporte</a></p>
      </LegalSection>
      <LegalSection title="Si pagaste y no ves créditos">
        <p>Primero entra al dashboard y escribe exactamente el mismo email usado al pagar en Stripe. Si los créditos siguen sin aparecer, envíanos ese email y revisamos la acreditación manualmente.</p>
      </LegalSection>
      <LegalSection title="Si el análisis falla">
        <p>Indica qué archivo usaste, qué vacante pegaste y qué mensaje de error viste. Si fue un error técnico verificable, revisamos que no pierdas el crédito.</p>
      </LegalSection>
      <LegalSection title="Si quieres eliminar tus datos">
        <p>Escríbenos con el email usado en RevisaMiCV y solicita eliminación de historial/datos. Te confirmaremos cuando se complete.</p>
      </LegalSection>
    </LegalShell>
  )
}
