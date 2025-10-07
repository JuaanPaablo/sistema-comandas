# 🍽️ Comandas Meseros - App Móvil

Aplicación móvil para meseros del sistema de comandas de restaurante.

## 🚀 Características

- **📱 App nativa** para iOS y Android
- **🔐 Autenticación** segura de meseros
- **🍽️ Menú interactivo** con categorías
- **📋 Gestión de órdenes** en tiempo real
- **🔄 Sincronización** con base de datos
- **⚡ Tiempo real** con Supabase

## 🛠️ Tecnologías

- **React Native** + **Expo**
- **TypeScript** para tipado fuerte
- **Zustand** para estado global
- **Supabase** para backend
- **React Navigation** para navegación

## 📦 Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea `.env` en `meseros-app/` con la configuración de Supabase (nube):
   ```
   EXPO_PUBLIC_SUPABASE_URL= https://<tu-proyecto>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY= <tu_anon_key>
   ```
   - Estas variables se exponen vía `app.config.js` → `expo.extra`.
   - Ya no usamos Supabase local.

3. **Ejecutar la aplicación:**
   ```bash
   # Para desarrollo
   npm start
   
   # Para Android
   npm run android
   
   # Para iOS
   npm run ios
   
   # Para web
   npm run web
   ```

### Notas de compatibilidad Expo
- Si ves error con íconos: instala alineado a Expo
  ```bash
  npx expo install @expo/vector-icons react-native-svg
  ```
- Si hay conflictos de dependencias (ERESOLVE), usa:
  ```bash
  npm i --legacy-peer-deps
  ```

## 📱 Pantallas

### 🔐 Login
- Autenticación de meseros
- Validación de credenciales
- Verificación de rol

### 🏠 Dashboard
- Vista de mesas disponibles/ocupadas
- Órdenes activas
- Estadísticas del día

### 🍽️ Menú
- Categorías de platillos
- Búsqueda de platillos
- Agregar items a la orden

### 📋 Órdenes
- Lista de platillos ordenados
- Estado de cada platillo
- Envío a cocina

## 🔧 Configuración

### Base de Datos
La app se conecta a la misma base de datos que el sistema web:
- `employees` - Empleados/meseros
- `dishes` - Platillos del menú
- `categories` - Categorías
- `orders` - Órdenes
- `order_items` - Items de cada orden

### Permisos
- **Cámara** - Para códigos QR (futuro)
- **Notificaciones** - Para alertas de cocina
- **Almacenamiento** - Para datos offline

## 🚀 Desarrollo

### Estructura del Proyecto
```
src/
├── screens/          # Pantallas principales
├── components/       # Componentes reutilizables
├── services/         # API y servicios
├── store/           # Estado global (Zustand)
├── types/           # Tipos TypeScript
└── utils/           # Utilidades
```

### Flujo de Trabajo
1. **Mesero inicia sesión**
2. **Selecciona mesa** disponible
3. **Ve menú** y agrega platillos
4. **Envía orden** a cocina
5. **Sigue estado** de preparación
6. **Marca como servido** cuando esté listo

## 📊 Estado Global

### AuthStore
- Autenticación de meseros
- Sesión activa
- Datos del empleado

### MenuStore
- Carga del menú
- Categorías
- Búsqueda y filtros

### OrdersStore
- Gestión de órdenes
- Items de cada orden
- Estados y actualizaciones

## 🔒 Seguridad

- **Autenticación** con Supabase Auth
- **Validación** de roles (solo meseros)
- **Tokens JWT** para sesiones
- **Encriptación** de datos sensibles

## 📱 Próximas Funcionalidades

- [ ] **Códigos QR** para mesas
- [ ] **Notificaciones push** de cocina
- [ ] **Modo offline** completo
- [ ] **Pagos integrados**
- [ ] **Reportes** de mesero
- [ ] **Cámara** para fotos de platillos

## 🐛 Solución de Problemas

### Error de conexión
- Verificar variables de entorno
- Comprobar conexión a internet
- Revisar credenciales de Supabase

### App no carga
- Limpiar cache: `expo start -c`
- Reinstalar dependencias: `rm -rf node_modules && npm install`

### Problemas de navegación
- Verificar que todas las pantallas estén registradas
- Comprobar parámetros de navegación

## 📞 Soporte

Para problemas o dudas:
- Revisar logs en consola
- Verificar configuración de Supabase
- Comprobar permisos de la app

---

**Desarrollado para el Sistema de Comandas v1.0** 🍽️
