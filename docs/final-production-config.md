# Configuración final — RevisaMiCV.lat

Este documento es el bloque único de configuración para dejar RevisaMiCV listo para producción.

> Regla de seguridad: nunca pegar secretos en GitHub, README público o tickets. Si se comparten por chat para configurar, reemplazarlos luego/rotarlos si quedaron expuestos.

## Estado de código antes de configurar

Ya debe estar pasando:

```bash
npm test
npm run build
```

Y el repo debe estar pusheado a `main`.

## Variables de entorno necesarias

Configurar estas variables en Vercel → Project → Settings → Environment Variables → Production.

- `NEXT_PUBLIC_APP_URL`
  - Valor esperado: `https://revisamicv.lat`
  - Público: sí.
  - Para qué sirve: armar URLs correctas de checkout, metadata y redirects.

- `NEXT_PUBLIC_SUPABASE_URL`
  - Sale de Supabase → Settings → API → Project URL.
  - Público: sí.
  - Para qué sirve: conectar frontend/backend con Supabase.

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Sale de Supabase → Settings → API → anon/public key.
  - Público: sí.
  - Para qué sirve: operaciones públicas permitidas por RLS.

- `SUPABASE_SERVICE_ROLE_KEY`
  - Sale de Supabase → Settings → API → service_role key.
  - Público: NO.
  - Para qué sirve: endpoints server-side de tokens, historial y pagos.

- `OPENAI_API_KEY`
  - Sale de platform.openai.com → API Keys.
  - Público: NO.
  - Para qué sirve: analizar CV, calcular score y generar CV adaptado.

- `STRIPE_SECRET_KEY`
  - Sale de Stripe → Developers → API keys → Secret key.
  - Debe empezar con `sk_live_` en producción.
  - Público: NO.
  - Para qué sirve: crear sesiones de pago.

- `STRIPE_WEBHOOK_SECRET`
  - Sale de Stripe → Developers → Webhooks → endpoint signing secret.
  - Debe empezar con `whsec_`.
  - Público: NO.
  - Para qué sirve: confirmar pagos reales y acreditar tokens.

## Supabase — SQL exacto

1. Abrir Supabase.
2. Ir a SQL Editor.
3. Pegar y ejecutar el archivo completo:

```txt
supabase-schema.sql
```

Ese script crea/actualiza:

- `public.users`
- `public.cv_history`
- `free_used`
- índices
- permisos para `anon`, `authenticated`, `service_role`
- RLS/policies MVP
- smoke tests SQL al final

### Error crítico conocido

Si aparece:

```txt
permission denied for table users
code 42501
```

Solución: volver a ejecutar `supabase-schema.sql`, especialmente los bloques `GRANT` y `POLICY`.

## Stripe — productos y webhook

### Packs esperados por código

El código usa estos packs:

- `basic`: 5 CVs — USD 5
- `pro`: 15 CVs — USD 12
- `premium`: 30 CVs — USD 20

Los pagos se crean dinámicamente desde Stripe Checkout, no dependen de Price IDs fijos.

### Webhook

Crear endpoint en Stripe:

```txt
https://revisamicv.lat/api/stripe/webhook
```

Evento requerido:

```txt
checkout.session.completed
```

Después copiar el signing secret `whsec_...` a Vercel como:

```txt
STRIPE_WEBHOOK_SECRET
```

## Vercel — después de guardar variables

Después de editar variables de entorno, redeploy:

```bash
vercel --prod
```

O desde Vercel UI:

```txt
Deployments → Redeploy → Use existing Build Cache: off
```

## Smoke tests

### Local con servidor dev

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
APP_URL=http://localhost:3000 npm run smoke -- --skip-paid-apis
```

Esto prueba páginas y PDF sin tocar Stripe/OpenAI/Supabase.

### Producción básico

```bash
APP_URL=https://revisamicv.lat npm run smoke -- --skip-paid-apis
```

### Producción completo

Cuando Supabase/OpenAI/Stripe estén configurados:

```bash
APP_URL=https://revisamicv.lat \
SMOKE_EMAIL=prueba@revisamicv.lat \
npm run smoke -- --cv "/ruta/a/cv.pdf" --job "/ruta/a/vacante.txt"
```

Resultados esperados:

- Landing carga.
- Signup carga.
- Dashboard carga.
- PDF endpoint devuelve `%PDF`.
- `/api/user` responde 200.
- `/api/history` responde 200.
- `/api/process-cv` responde 200 si hay CV gratis/tokens, o 402 si no hay tokens.

## Prueba manual final de negocio

1. Abrir `https://revisamicv.lat/signup`.
2. Escribir email real de prueba.
3. Subir CV PDF real.
4. Pegar vacante completa.
5. Elegir inglés o español.
6. Generar.
7. Verificar score, brechas y CV adaptado.
8. Descargar PDF.
9. Ir a dashboard.
10. Confirmar que aparece historial.
11. Descargar PDF desde historial.
12. Comprar pack básico con tarjeta de prueba/real según modo Stripe.
13. Confirmar que los tokens suben después del webhook.

## Errores esperados y respuesta rápida

- `No pude validar tus tokens`
  - Revisar Supabase vars, service role y SQL grants.

- `No tienes CVs disponibles`
  - Flujo correcto si ya usó gratis y no tiene tokens.

- `Webhook signature verification failed`
  - `STRIPE_WEBHOOK_SECRET` incorrecto o webhook creado para otra URL.

- `Not a valid URL`
  - Revisar `NEXT_PUBLIC_APP_URL`; debe ser `https://revisamicv.lat` sin espacios ni saltos de línea.

- `No pude leer el archivo`
  - PDF escaneado/imagen. Pedir exportar como PDF de texto o Word `.docx`.

## Orden recomendado para Rosita

Cuando sea momento de intervenir:

1. Ejecutar SQL Supabase.
2. Confirmar variables Vercel ya cargadas.
3. Crear webhook Stripe y pegar `STRIPE_WEBHOOK_SECRET`.
4. Redeploy producción.
5. Ejecutar smoke test.
6. Hacer prueba manual real.

No hacer cambios de diseño durante este bloque. Solo estabilizar producción.
