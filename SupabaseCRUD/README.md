# Catálogo CRUD · React Native + Supabase

Aplicación móvil para administrar un catálogo de productos con operaciones **CREATE, READ, UPDATE y DELETE** conectadas a Supabase. La interfaz está hecha con Expo y React Native, y presenta inventario, valor total, estados de carga, errores y confirmación antes de eliminar.

## Requisitos

- Node.js 24.3+ (SDK 58 requiere Node 24.3 o superior).
- Android Studio con Android SDK para compilar y ejecutar el development build localmente.
- Una cuenta y un proyecto de [Supabase](https://supabase.com/).

## 1. Preparar la base de datos

1. Abre tu proyecto en Supabase y entra a **SQL Editor → New query**.
2. Copia y ejecuta el contenido de [`supabase.sql`](./supabase.sql).
3. El script crea `public.productos` con `id`, `producto`, `descripcion`, `precio` y `created_at`, activa RLS y añade políticas de acceso para la práctica.

> Las políticas abiertas permiten probar la app sin autenticación. Para un despliegue real, reemplázalas por políticas que limiten las operaciones a usuarios autenticados. Nunca pongas una `service_role` key en una app móvil.

## 2. Configurar las credenciales

En Supabase abre **Project Settings → API** y copia la Project URL y la publishable key (o la `anon` key heredada). En esta carpeta crea `.env` a partir de `.env.example` y pega esos valores:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
```

La publishable/anon key puede incluirse en el cliente cuando RLS está correctamente configurado. `.env` está excluido de Git; no compartas secretos ni subas credenciales.

## 3. Instalar y ejecutar en Android

Este proyecto usa **Expo SDK 58**, React Native 0.88 y React 19.3. SDK 58 requiere una versión de Expo Go que todavía no está disponible en las tiendas; para usarlo ahora, crea un development build:

```bash
npm install
npx expo run:android
```

El primer comando compila e instala la app de desarrollo en un emulador Android conectado o en un teléfono con depuración USB habilitada. Después inicia Metro con:

```bash
npm start
```

Abre la app **Catálogo** instalada en el teléfono/emulador. Para volver a Expo Go, espera la versión de Expo Go compatible con SDK 58; no podrás abrir este proyecto SDK 58 desde una Expo Go basada en SDK anterior.

## Uso

- **Crear:** completa nombre y precio, agrega una descripción opcional y pulsa **Agregar producto**.
- **Leer:** el inventario se consulta al abrir la app y se muestra en una lista; **Actualizar** vuelve a consultar Supabase.
- **Actualizar:** pulsa **Editar**, modifica los campos y guarda los cambios.
- **Eliminar:** pulsa **Eliminar** y confirma la acción.

Los precios aceptan punto o coma decimal y deben ser iguales o mayores que cero. La lista muestra el valor total del inventario.

## Estructura

```text
SupabaseCRUD/
├── App.js          # Interfaz y flujo CRUD
├── supabase.js     # Cliente de Supabase
├── supabase.sql   # Tabla, restricciones, RLS y políticas de práctica
├── app.json        # Configuración Expo
├── package.json
└── .env.example    # Plantilla de variables públicas
```

## Tecnologías

React Native · Expo SDK 58 · Supabase JavaScript Client · PostgreSQL · Row Level Security
