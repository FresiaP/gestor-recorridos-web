# Gestor Recorridos Web — Frontend legado con CRA

Última actualización: 2026-03-26

## Descripción general

Este proyecto es el frontend legado del sistema de gestión de infraestructura, recorridos, incidencias, usuarios y reportes. Está construido con React sobre Create React App y se conecta al backend ASP.NET Core mediante una API REST autenticada con JWT.

Su responsabilidad principal es:

- autenticar usuarios;
- cargar permisos desde el token;
- proteger rutas según permisos;
- renderizar módulos CRUD por dominio;
- consumir la API centralizada en `src/services/api.js`;
- mantener una experiencia de navegación con layout de dashboard, menú lateral y cabecera superior.

## Stack técnico

- React 19: librería principal con la que se construyen las vistas, componentes y estados de la aplicación.
- Create React App: herramienta base usada para el bootstrap, compilación y ciclo de desarrollo del frontend legado.
- React Router DOM: maneja la navegación SPA y el sistema de rutas públicas y protegidas.
- Axios: cliente HTTP centralizado para consumir la API, enviar tokens y manejar refresh automático ante `401`.
- Tailwind CSS: framework de utilidades CSS usado para layout, espaciado, colores y composición visual rápida.
- Material UI y componentes auxiliares: conjunto de componentes reutilizables para formularios, tablas, controles visuales e interacción.
- jwt-decode: utilidad que permite leer el JWT en el cliente y extraer usuario, nombre y permisos sin llamar otra vez al backend.

## Instalación de tecnologías y dependencias

### Prerrequisitos

- Node.js 20 o superior
- npm 10 o superior

### Restauración rápida del proyecto

Desde la carpeta `gestor-recorridos-web`:

```bash
npm install
npm start
```

### Instalación explícita de dependencias principales

Si quieres recrear manualmente el stack actual del frontend legado, estos comandos corresponden a las dependencias registradas en `package.json`.

Dependencias de runtime:

```bash
npm install @emotion/react @emotion/styled @heroicons/react @mui/icons-material @mui/material @mui/x-date-pickers @testing-library/dom @testing-library/jest-dom @testing-library/react @testing-library/user-event axios chart.js daisyui date-fns jspdf jspdf-autotable jwt-decode react react-chartjs-2 react-dom react-icons react-router-dom react-scripts react-select recharts web-vitals webpack-dev-server
```

Dependencias de desarrollo:

```bash
npm install -D autoprefixer baseline-browser-mapping postcss tailwindcss
```

## Estructura funcional

- `src/App.js`
  - define todas las rutas públicas y protegidas;
  - envuelve la aplicación con `Router` y `AuthProvider`;
  - monta cada módulo dentro de `DashboardLayout`.

- `src/context/AuthContext.jsx`
  - mantiene el usuario autenticado en memoria;
  - recupera la sesión desde `sessionStorage`;
  - expone `login`, `logout`, `tienePermiso`, `usuario` y `cargando`.

- `src/components/shared/ProtectedRoute.jsx`
  - bloquea acceso si no hay sesión;
  - redirige a `/login` si no existe usuario;
  - redirige a `/unauthorized` si falta el permiso requerido.

- `src/components/layout/DashboardLayout.jsx`
  - compone la estructura general de la aplicación;
  - monta `Sidebar` y `Navbar`;
  - implementa timeout de inactividad con refresh token.

- `src/components/layout/Sidebar.jsx`
  - arma el menú lateral por secciones;
  - filtra opciones según permisos del usuario;
  - permite colapsar/expandir el menú.

- `src/services/api.js`
  - concentra toda la comunicación HTTP;
  - configura interceptores de Axios;
  - agrega automáticamente el token Bearer;
  - refresca el token cuando el backend responde `401`.

- `src/pages/**`
  - organiza los módulos por dominio;
  - el patrón dominante es carpeta por módulo, por ejemplo `infraestructura/Categorias`, `infraestructura/Marcas`, `usuarios`, `incidencias`, `reportes`.

## Flujo del frontend paso a paso

### 1. Arranque de la aplicación

1. El navegador carga `App.js`.
2. `Router` habilita la navegación SPA.
3. `AuthProvider` intenta reconstruir la sesión leyendo `token` desde `sessionStorage`.
4. Si el token existe, `getUsuarioActual()` lo decodifica y extrae:
   - `IdUsuario`
   - `unique_name`
   - `nombre`
   - permisos almacenados como claims de rol.
5. Si el token es inválido, el contexto limpia la sesión y obliga a volver al login.

### 2. Login

1. El usuario entra a `/login` y usa el formulario en `src/pages/usuarios/Login.jsx`.
2. El componente llama a `login()` del `AuthContext`.
3. `AuthContext` delega en `apiLogin()` de `src/services/api.js`.
4. `api.js` hace `POST /api/auth/login` con `login` y `password`.
5. Si el backend responde correctamente, se guardan:
   - `token`
   - `refreshToken`
     en `sessionStorage`.
6. Luego `AuthContext` vuelve a decodificar el token, construye el objeto `usuario` y navega a `/home`.

### 3. Protección de rutas

1. Cada ruta privada se define en `App.js` dentro de `ProtectedRoute`.
2. `ProtectedRoute` revisa tres cosas:
   - si aún está cargando la sesión;
   - si existe usuario autenticado;
   - si el usuario tiene el permiso requerido.
3. Si no hay usuario, redirige a `/login`.
4. Si hay usuario pero no permiso, redirige a `/unauthorized`.
5. Si cumple, renderiza `DashboardLayout` y la página correspondiente.

### 4. Construcción del layout

1. `DashboardLayout` monta el `Sidebar` con el usuario actual.
2. El `Sidebar` toma `menuConfig` y filtra opciones según permisos.
3. Si el usuario tiene `USUARIO_ADMIN`, ve todo el menú.
4. El `Navbar` muestra título de página y controles de sesión.
5. El contenido real del módulo se renderiza dentro del área principal.

### 5. Manejo de sesión e inactividad

1. `DashboardLayout` inicia temporizadores de inactividad.
2. Si no hay interacción en 15 minutos, muestra un modal de advertencia.
3. Si el usuario decide continuar, el frontend llama `POST /api/auth/refresh`.
4. Si el refresh es válido, guarda nuevos tokens y reinicia el temporizador.
5. Si falla, elimina tokens y redirige al login.

### 6. Consumo de API

1. Todas las llamadas pasan por la instancia `api` de Axios.
2. El interceptor de request agrega `Authorization: Bearer <token>`.
3. También agrega `X-Client-Host` para identificación del equipo origen.
4. Si una respuesta viene con `401`, el interceptor intenta refrescar la sesión.
5. Si el refresh funciona, reintenta la petición original.
6. Si no funciona, limpia la sesión y redirige a `/login`.

### 7. Flujo típico de un CRUD en frontend

1. La página monta estado local: lista, filtros, paginación, loading, errores.
2. En `useEffect`, llama la función de carga, por ejemplo `getCategoriasPaginadas()`.
3. `api.js` hace el request al backend y devuelve el objeto paginado.
4. La página actualiza tabla, total de registros y estado visual.
5. Las acciones Crear, Editar, Cambiar Estado y Eliminar llaman endpoints REST específicos.
6. Luego del éxito, la página recarga los datos para reflejar el cambio.

## Flujo concreto de un módulo: Categorías

1. El usuario navega a `/infraestructura/categorias`.
2. `ProtectedRoute` exige `CATEGORIA_LEER`.
3. `CategoriaPage` llama `getCategoriasPaginadas()`.
4. `api.js` arma `/categorias?pagina=...&tamano=...&query=...&estadoFiltro=...`.
5. El backend devuelve una respuesta paginada.
6. El frontend dibuja la tabla.
7. Si el usuario crea o edita, la página llama `POST /api/categorias` o `PUT /api/categorias/{id}`.
8. Si cambia estado, llama `PATCH /api/categorias/{id}/estado`.
9. Si exporta, solicita el archivo Excel y fuerza la descarga desde el navegador.

## Variables y configuración

La URL base del backend se toma desde:

- `REACT_APP_API_URL`

Si no existe, el frontend usa por defecto:

- `/api`

Esto permite trabajar detrás de un proxy o nginx sin cambiar el código.

## Scripts disponibles

En la carpeta del proyecto:

```bash
npm install
npm start
```

Scripts principales:

- `npm start`: inicia el frontend en desarrollo.
- `npm run build`: genera la carpeta `build` para despliegue.
- `npm test`: ejecuta pruebas del entorno CRA.
- `npm run dev`: alias de `npm start`.

## Resumen

Funcionamiento:

1. El frontend arranca, intenta reconstruir la sesión y decodifica el token.
2. El token trae los permisos del usuario como claims.
3. Las rutas privadas se protegen con `ProtectedRoute`.
4. El menú lateral también se filtra con esos permisos.
5. Todas las llamadas HTTP pasan por una sola capa `api.js`.
6. Si el token expira, el sistema intenta refrescarlo automáticamente.
7. Cada módulo CRUD reutiliza el mismo patrón: filtros, tabla, modal/formulario, acciones y recarga.

## Relación con el backend

El frontend no contiene reglas de negocio críticas; las decisiones de seguridad y validación final viven en el backend. El frontend:

- presenta formularios;
- envía datos;
- interpreta respuestas;
- aplica restricciones visuales según permisos del token.

El backend:

- valida autenticación;
- valida permisos reales;
- ejecuta CRUD;
- registra auditoría;
- genera exportaciones.
