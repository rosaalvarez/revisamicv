import { SUPPORT_WHATSAPP_URL, LegalSection, LegalShell } from '@/components/LegalShell'

export default function SupportPage() {
  return (
    <LegalShell
      eyebrow="Soporte"
      title="Si pagaste, subiste un CV o algo falló, aquí está el camino claro."
      intro="La prioridad es que no pierdas tokens ni tiempo. Escríbenos con el email correcto y revisamos tu caso."
    >
      <LegalSection title="Canal principal">
        <p>Por ahora el soporte se atiende por WhatsApp. Incluye el email usado en RevisaMiCV y, si compraste tokens, el mismo email usado en Stripe.</p>
        <p><a href={SUPPORT_WHATSAPP_URL} className="inline-flex rounded-full bg-[#b24aed] px-5 py-3 text-sm font-semibold text-white">Abrir soporte por WhatsApp</a></p>
      </LegalSection>
      <LegalSection title="Si pagaste y no ves tokens">
        <p>Primero entra al dashboard y escribe exactamente el mismo email usado al pagar en Stripe. Si los tokens siguen sin aparecer, envíanos ese email y revisamos la acreditación manualmente.</p>
      </LegalSection>
      <LegalSection title="Si el análisis falla">
        <p>Indica qué archivo usaste, qué vacante pegaste y qué mensaje de error viste. Si fue un error técnico verificable, revisamos que no pierdas el token.</p>
      </LegalSection>
      <LegalSection title="Si quieres eliminar tus datos">
        <p>Escríbenos con el email usado en RevisaMiCV y solicita eliminación de historial/datos. Te confirmaremos cuando se complete.</p>
      </LegalSection>
    </LegalShell>
  )
}
