# Configuración de Supabase

## Pasos para configurar la conexión:

### 1. Crear proyecto en Supabase
- Ve a [supabase.com](https://supabase.com)
- Crea una nueva cuenta o inicia sesión
- Crea un nuevo proyecto
- Espera a que se complete la configuración

### 2. Obtener credenciales
- En tu proyecto de Supabase, ve a **Settings** → **API**
- Copia la **URL** del proyecto
- Copia la **anon public** key

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz de tu proyecto con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 4. Probar la conexión
- Ejecuta `npm run dev`
- Abre tu navegador en `http://localhost:3000`
- Haz clic en "Probar Conexión"

## Estructura del proyecto:

```
src/
├── lib/
│   └── supabase.ts          # Configuración del cliente
├── components/
│   └── SupabaseTest.tsx     # Componente de prueba
└── app/
    └── page.tsx             # Página principal
```

## Solución de problemas:

### Error: "Faltan las variables de entorno"
- Verifica que el archivo `.env.local` existe
- Reinicia el servidor de desarrollo
- Asegúrate de que las variables no tengan espacios extra

### Error de conexión
- Verifica que la URL y clave sean correctas
- Confirma que tu proyecto de Supabase esté activo
- Revisa la consola del navegador para más detalles

### Error de CORS
- En Supabase, ve a **Settings** → **API**
- Agrega `http://localhost:3000` a los orígenes permitidos
