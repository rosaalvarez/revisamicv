# RevisaMiCV.lat

SaaS para cruzar un CV real contra una vacante específica, calcular compatibilidad y generar un CV adaptado ATS-friendly en inglés o español sin inventar experiencia.

## Stack

- Next.js App Router
- Supabase
- Stripe Checkout + webhook
- OpenAI
- PDF/DOCX/TXT parsing
- PDF generation

## Comandos principales

```bash
npm install
npm run dev
npm test
npm run build
```

## Smoke tests

Con servidor local encendido:

```bash
npm run dev
```

En otra terminal:

```bash
APP_URL=http://localhost:3000 npm run smoke -- --skip-paid-apis
```

Producción básico:

```bash
APP_URL=https://revisamicv.lat npm run smoke -- --skip-paid-apis
```

Producción completo después de configurar Supabase/OpenAI/Stripe:

```bash
APP_URL=https://revisamicv.lat \
SMOKE_EMAIL=prueba@revisamicv.lat \
npm run smoke -- --cv "/ruta/a/cv.pdf" --job "/ruta/a/vacante.txt"
```

## Variables de entorno

Ver documento completo:

```txt
docs/final-production-config.md
```

Variables requeridas:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Nunca commitear `.env.local` ni secrets.

## Base de datos

Ejecutar en Supabase SQL Editor:

```txt
supabase-schema.sql
```

## Funciones principales

- `/signup`: formulario de CV + vacante + idioma.
- `/dashboard`: tokens, historial y descargas.
- `/api/process-cv`: extracción, scoring, generación y consumo de crédito.
- `/api/generate-pdf`: descarga del CV adaptado.
- `/api/history`: historial por email.
- `/api/user`: estado de tokens/free CV.
- `/api/stripe/checkout`: crear pago.
- `/api/stripe/webhook`: acreditar tokens.
