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
        <p><a href={SUPPORT_EMAIL_URL} className="inline-flex rounded-[11px] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] shadow-[var(--shadow-cta)] hover:bg-[var(--color-primary-deep)] hover:text-white">Enviar email a soporte</a></p>
      </LegalSection>
      <LegalSection title="Preguntas frecuentes">
        <details open><summary>¿Cuánto tardan en responder?</summary><p>En horario hábil solemos responder dentro de 24 a 48 horas. Si es sobre un pago o acceso, intentamos priorizarlo.</p></details>
        <details><summary>¿Cómo pido que eliminen mi CV y mis datos?</summary><p>Escríbenos desde el mismo correo usado en la plataforma y solicita eliminación de datos/historial.</p></details>
        <details><summary>¿Hacen reembolsos?</summary><p>Los créditos son de pago único y no vencen. Si hubo cobro incorrecto o fallo técnico verificable, revisamos cada caso.</p></details>
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
