# Intervención de Rosita — Lanzamiento RevisaMiCV.lat

Esta guía es para el momento en que Rosita interviene. La regla es: **una acción a la vez**. No pedir múltiples claves juntas.

## Objetivo

Dejar producción funcionando con:

- Supabase DB lista.
- Variables Vercel correctas.
- Webhook Stripe activo.
- Redeploy hecho.
- Smoke test pasando.
- Prueba manual real completada.

## Antes de empezar

No tocar:

- `SellerWhatsapp/LupitaBot`.
- Railway del bot vendedor.
- Supabase de otros proyectos.
- Stripe keys que no pertenezcan a RevisaMiCV.

Proyecto correcto:

```txt
RevisaMiCV.lat
GitHub: rosaalvarez/revisamicv
Dominio: https://revisamicv.lat
```

## Orden operativo

### Paso 1 — Supabase SQL

Pedir a Rosita:

```txt
Rosita, abre Supabase del proyecto RevisaMiCV y ve a SQL Editor.
Pega completo el archivo supabase-schema.sql y ejecútalo.
Cuando termine sin errores, dime: SQL listo.
```

Si hay error `permission denied for table users`, pedir ejecutar de nuevo el bloque completo.

Resultado esperado:

- tabla `users` existe.
- tabla `cv_history` existe.
- columna `free_used` existe.
- grants/policies aplicadas.

### Paso 2 — Variables Vercel

Pedir a Rosita abrir:

```txt
Vercel → revisamicv → Settings → Environment Variables → Production
```

Revisar una por una, no pedir todas juntas si Rosita está copiando desde UI.

Variables esperadas:

```txt
NEXT_PUBLIC_APP_URL=https://revisamicv.lat
NEXT_PUBLIC_SUPABASE_URL=[REDACTED]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
OPENAI_API_KEY=[REDACTED]
STRIPE_SECRET_KEY=[REDACTED]
STRIPE_WEBHOOK_SECRET=[REDACTED]
```

Notas:

- `STRIPE_SECRET_KEY` de producción debe empezar con `sk_live_`.
- `STRIPE_WEBHOOK_SECRET` debe empezar con `whsec_`.
- `SUPABASE_SERVICE_ROLE_KEY` nunca va al frontend.
- `NEXT_PUBLIC_*` sí pueden ser públicas.

### Paso 3 — Stripe webhook

Pedir a Rosita:

```txt
Abre Stripe → Developers → Webhooks → Add endpoint.
URL: https://revisamicv.lat/api/stripe/webhook
Evento: checkout.session.completed
Guarda y copia el Signing secret que empieza por whsec_.
```

Luego agregar en Vercel:

```txt
STRIPE_WEBHOOK_SECRET=[REDACTED]
```

### Paso 4 — Redeploy Vercel

Pedir:

```txt
Vercel → Deployments → Redeploy → Use existing Build Cache: OFF
```

Esperar producción lista.

### Paso 5 — Smoke test básico

Ejecutar desde la máquina de desarrollo:

```bash
APP_URL=https://revisamicv.lat npm run smoke -- --skip-paid-apis
```

Debe pasar:

- Landing 200.
- Signup 200.
- Dashboard 200.
- PDF endpoint 200.

### Paso 6 — Smoke test completo

Usar CV y vacante reales locales:

```bash
APP_URL=https://revisamicv.lat \
SMOKE_EMAIL=prueba@revisamicv.lat \
npm run smoke -- --cv "/ruta/a/cv.pdf" --job "/ruta/a/vacante.txt"
```

Resultado esperado:

- `/api/user` 200.
- `/api/history` 200.
- `/api/process-cv` 200 si el email tiene gratis/tokens.
- Puede responder 402 si el email ya usó gratis y no tiene tokens; eso no es bug.

### Paso 7 — Prueba manual del usuario

Abrir:

```txt
https://revisamicv.lat/signup
```

Flujo:

1. Email de prueba.
2. Subir CV PDF real.
3. Pegar vacante completa.
4. Elegir idioma.
5. Generar.
6. Confirmar score.
7. Descargar PDF.
8. Ir a dashboard.
9. Confirmar historial.
10. Descargar PDF desde historial.

### Paso 8 — Prueba pago

Abrir:

```txt
https://revisamicv.lat/#pricing
```

Elegir pack básico.

Debe ir a:

```txt
/dashboard?pack=basic
```

Luego:

1. Escribir email.
2. Click en Básico.
3. Completar checkout Stripe.
4. Volver a dashboard.
5. Confirmar tokens suben.

Si tokens no suben:

- Revisar webhook en Stripe.
- Revisar `STRIPE_WEBHOOK_SECRET`.
- Revisar logs de Vercel en `/api/stripe/webhook`.

## Qué pedirle a Rosita de vuelta

Pedir solo estados simples:

- `SQL listo`
- `Variables listas`
- `Webhook listo`
- `Redeploy listo`
- `Smoke básico listo`
- `Prueba manual lista`
- `Pago probado`

## Mensajes de error comunes

### `No pude validar tus tokens`

Causa probable:

- `SUPABASE_SERVICE_ROLE_KEY` incorrecta.
- SQL grants/RLS incompletos.
- Supabase URL incorrecta.

### `Webhook signature verification failed`

Causa probable:

- `STRIPE_WEBHOOK_SECRET` no corresponde a ese endpoint.
- Se usó secret de test con key live o viceversa.

### `No tienes CVs disponibles`

No es bug si:

- email ya usó el primer CV gratis.
- no tiene tokens.

### PDF escaneado no lee

Pedir:

- exportar CV como PDF de texto; o
- subir `.docx`.

## Criterio de listo para vender

RevisaMiCV está listo para tráfico cuando:

- Smoke básico producción pasa.
- Una generación real pasa.
- PDF descarga bien.
- Historial guarda bien.
- Compra básica acredita tokens.
- Segundo análisis consume 1 token.
