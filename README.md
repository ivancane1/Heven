# Textile Visualizer

App web para que tus clientes visualicen tus productos de textiles en su propio espacio usando IA.

## Funcionalidades
- Subida de foto del espacio del cliente
- Selección de hasta 4 productos del catálogo
- Análisis con IA (Claude) de cómo quedarían los productos
- Una prueba gratuita sin registro
- Login con Magic Link (sin contraseña)
- Guardado de visualizaciones en Supabase
- Botón de contacto directo por WhatsApp

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
Copiá `.env.local.example` como `.env.local` y completá:
```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ANTHROPIC_KEY=sk-ant-...
```

### 3. Base de datos (Supabase)
Ejecutá este SQL en el SQL Editor de Supabase:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamp default now()
);

create table visualizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_id text,
  selected_products jsonb,
  ai_result jsonb,
  created_at timestamp default now()
);

create table anonymous_usage (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  used_at timestamp default now()
);
```

### 4. Correr en local
```bash
npm run dev
```

### 5. Build para producción
```bash
npm run build
```

## Agregar tus productos
1. Poné las fotos PNG en `public/products/almohadones/`, `/cubrecamas/` o `/sabanas/`
2. En `src/products.js`, descomentá la línea `image:` de cada producto y actualizá el nombre del archivo

## Deploy en Vercel
1. Conectá este repo en vercel.com
2. Agregá las variables de entorno en Settings > Environment Variables
3. Deploy automático con cada `git push`
