import { LegalSection, LegalShell } from '@/components/LegalShell'

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Privacidad"
      title="Tu CV contiene datos sensibles. Lo tratamos con cuidado."
      intro="Esta política explica, en lenguaje simple, qué datos usa RevisaMiCV para analizar una vacante, generar tu CV adaptado y recuperar tus tokens/resultados."
    >
      <LegalSection title="Qué información usamos">
        <p>Para prestar el servicio podemos procesar: tu email, el CV que subes o pegas, la vacante que quieres analizar, el idioma elegido, el resultado generado, historial de análisis y datos mínimos de pago enviados por Stripe para acreditar tokens.</p>
      </LegalSection>
      <LegalSection title="Para qué usamos tus datos">
        <p>Usamos la información para comparar tu CV contra una vacante específica, generar un diagnóstico, crear un CV adaptado descargable, guardar tu historial y asociar tokens/compras a tu email.</p>
        <p>No usamos tu CV para vender bases de datos, contactar reclutadores en tu nombre ni inventar experiencia profesional.</p>
      </LegalSection>
      <LegalSection title="Archivos, resultados e historial">
        <p>RevisaMiCV puede guardar el resultado del análisis y datos necesarios para que recuperes tus descargas desde el dashboard. Evitamos guardar más de lo necesario para operar el producto.</p>
        <p>Si quieres eliminar tus datos o historial, puedes solicitarlo por soporte indicando el email usado.</p>
      </LegalSection>
      <LegalSection title="Pagos y tokens">
        <p>Los pagos se procesan mediante Stripe. RevisaMiCV no guarda los datos completos de tu tarjeta. Usamos la confirmación de Stripe para acreditar tokens al email de compra.</p>
      </LegalSection>
      <LegalSection title="Proveedores de IA">
        <p>Para generar el análisis y el CV adaptado, el contenido puede enviarse a proveedores de modelos de IA configurados por RevisaMiCV. El objetivo es únicamente producir tu diagnóstico y documento. No prometemos control absoluto sobre políticas internas de terceros, por eso recomendamos no subir información que no quieras procesar en una herramienta externa.</p>
      </LegalSection>
      <LegalSection title="Tus derechos">
        <p>Puedes pedir acceso, corrección o eliminación de tus datos escribiendo a soporte con el email usado en la plataforma. Si pagaste y no ves tokens, usa ese mismo email para conciliación manual.</p>
      </LegalSection>
      <LegalSection title="Actualizaciones">
        <p>Esta política puede cambiar a medida que el producto evolucione. Mantendremos una versión clara y visible desde la landing y el dashboard.</p>
      </LegalSection>
    </LegalShell>
  )
}
