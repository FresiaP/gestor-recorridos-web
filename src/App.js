import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const AuditoriaPage = lazy(() => import("./pages/auditoria/AuditoriaPage"));
const Configuracion = lazy(() => import("./pages/configuracion/Configuracion"));
const Home = lazy(() => import("./pages/dashboard/Home"));
const IncidenciaPage = lazy(
  () => import("./pages/incidencias/Incidencias/IncidenciaPage"),
);
const ResolucionesPage = lazy(
  () => import("./pages/incidencias/Resoluciones/ResolucionesPage"),
);
const ActivoPage = lazy(
  () => import("./pages/infraestructura/Activos/ActivoPage"),
);
const CategoriasPage = lazy(
  () => import("./pages/infraestructura/Categorias/CategoriaPage"),
);
const ContratoPage = lazy(
  () => import("./pages/infraestructura/Contratos/ContratoPage"),
);
const DispositivoPage = lazy(
  () => import("./pages/infraestructura/Dispositivos/DispositivoPage"),
);
const MarcaPage = lazy(
  () => import("./pages/infraestructura/Marcas/MarcaPage"),
);
const ModeloPage = lazy(
  () => import("./pages/infraestructura/Modelos/ModeloPage"),
);
const OtrosDispositivoPage = lazy(
  () =>
    import("./pages/infraestructura/OtrosDispositivos/OtrosDispositivoPage"),
);
const ProveedorPage = lazy(
  () => import("./pages/infraestructura/Proveedores/ProveedorPage"),
);
const ServicioPage = lazy(
  () => import("./pages/infraestructura/Servicios/ServicioPage"),
);
const SitioPage = lazy(
  () => import("./pages/infraestructura/Sitios/SitioPage"),
);
const TipoPage = lazy(() => import("./pages/infraestructura/Tipos/TipoPage"));
const UbicacionPage = lazy(
  () => import("./pages/infraestructura/Ubicaciones/UbicacionPage"),
);
const ConsumiblePage = lazy(
  () => import("./pages/recorridos/Consumibles/ConsumiblePage"),
);
const ConsumoMensualPage = lazy(
  () => import("./pages/recorridos/ConsumoMensual/ConsumoMensualPage"),
);
const ConsumoPage = lazy(
  () => import("./pages/recorridos/Consumos/ConsumoPage"),
);
const ParametroPage = lazy(
  () => import("./pages/recorridos/ParametroAmbiente/ParametroPage"),
);
const ReporteVencimientoContratoPage = lazy(
  () => import("./pages/reportes/ReporteVencimientoContratoPage"),
);
const Unauthorized = lazy(() => import("./pages/shared/Unauthorized"));
const AsignacionPermisoPage = lazy(
  () => import("./pages/usuarios/AsignacionPermisoPage"),
);
const Login = lazy(() => import("./pages/usuarios/Login"));
const PermisosPage = lazy(() => import("./pages/usuarios/PermisosPage"));
const UsuarioPage = lazy(() => import("./pages/usuarios/UsuarioPage"));

const publicRoutes = [
  { path: "/login", Component: Login },
  { path: "/unauthorized", Component: Unauthorized },
];

const protectedRoutes = [
  {
    path: "/home",
    pageTitle: "Inicio",
    activePath: "/home",
    permisoRequerido: [],
    Component: Home,
  },
  {
    path: "/configuracion",
    pageTitle: "Configuración",
    activePath: "/configuracion",
    permisoRequerido: [],
    Component: Configuracion,
  },
  {
    path: "/infraestructura/categorias",
    pageTitle: "Categorías",
    activePath: "/infraestructura/categorias",
    permisoRequerido: "CATEGORIA_LEER",
    Component: CategoriasPage,
  },
  {
    path: "/infraestructura/marcas",
    pageTitle: "Marcas",
    activePath: "/infraestructura/marcas",
    permisoRequerido: "MARCA_LEER",
    Component: MarcaPage,
  },
  {
    path: "/infraestructura/proveedores",
    pageTitle: "Proveedores",
    activePath: "/infraestructura/proveedores",
    permisoRequerido: "PROVEEDOR_LEER",
    Component: ProveedorPage,
  },
  {
    path: "/infraestructura/sitios",
    pageTitle: "Sitios",
    activePath: "/infraestructura/sitios",
    permisoRequerido: "SITIO_LEER",
    Component: SitioPage,
  },
  {
    path: "/infraestructura/contratos",
    pageTitle: "Contratos",
    activePath: "/infraestructura/contratos",
    permisoRequerido: "CONTRATO_LEER",
    Component: ContratoPage,
  },
  {
    path: "/infraestructura/modelos",
    pageTitle: "Modelos",
    activePath: "/infraestructura/modelos",
    permisoRequerido: "MODELO_LEER",
    Component: ModeloPage,
  },
  {
    path: "/infraestructura/ubicaciones",
    pageTitle: "Ubicaciones",
    activePath: "/infraestructura/ubicaciones",
    permisoRequerido: "UBICACION_LEER",
    Component: UbicacionPage,
  },
  {
    path: "/infraestructura/activos",
    pageTitle: "Activos",
    activePath: "/infraestructura/activos",
    permisoRequerido: "ACTIVO_LEER",
    Component: ActivoPage,
  },
  {
    path: "/infraestructura/servicios",
    pageTitle: "Servicios",
    activePath: "/infraestructura/servicios",
    permisoRequerido: "SERVICIO_LEER",
    Component: ServicioPage,
  },
  {
    path: "/infraestructura/dispositivos",
    pageTitle: "Dispositivos",
    activePath: "/infraestructura/dispositivos",
    permisoRequerido: "DISPOSITIVO_LEER",
    Component: DispositivoPage,
  },
  {
    path: "/infraestructura/otrosdispositivo",
    pageTitle: "Otros Dispositivos",
    activePath: "/infraestructura/otrosdispositivo",
    permisoRequerido: "OTROSDISPOSITIVO_LEER",
    Component: OtrosDispositivoPage,
  },
  {
    path: "/infraestructura/tipos",
    pageTitle: "Registrar Tipos",
    activePath: "/infraestructura/tipos",
    permisoRequerido: "TIPO_LEER",
    Component: TipoPage,
  },
  {
    path: "/usuarios",
    pageTitle: "Usuarios",
    activePath: "/usuarios",
    permisoRequerido: "USUARIO_LEER",
    Component: UsuarioPage,
  },
  {
    path: "/usuarios/permisos",
    pageTitle: "Permisos",
    activePath: "/usuarios/permisos",
    permisoRequerido: "PERMISO_LEER",
    Component: PermisosPage,
  },
  {
    path: "/usuarios/asignacion",
    pageTitle: "Asignación de Permisos",
    activePath: "/usuarios/asignacion",
    permisoRequerido: "PERMISOS_ASIGNAR",
    Component: AsignacionPermisoPage,
  },
  {
    path: "/recorridos/consumibles",
    pageTitle: "Registrar Consumibles",
    activePath: "/recorridos/consumibles",
    permisoRequerido: "CONSUMIBLE_LEER",
    Component: ConsumiblePage,
  },
  {
    path: "/recorridos/consumos",
    pageTitle: "Registrar Consumos",
    activePath: "/recorridos/consumos",
    permisoRequerido: "CONSUMO_LEER",
    Component: ConsumoPage,
  },
  {
    path: "/recorridos/consumosMensuales",
    pageTitle: "Generar Consumos Mensuales",
    activePath: "/recorridos/consumosMensuales",
    permisoRequerido: "CONSUMO_LEER",
    Component: ConsumoMensualPage,
  },
  {
    path: "/recorridos/parametros",
    pageTitle: "Registrar Parámetros",
    activePath: "/recorridos/parametros",
    permisoRequerido: "PARAMETROAMBIENTE_LEER",
    Component: ParametroPage,
  },
  {
    path: "/incidencia/incidencias",
    pageTitle: "Registrar Incidencias",
    activePath: "/incidencia/incidencias",
    permisoRequerido: "INCIDENCIA_LEER",
    Component: IncidenciaPage,
  },
  {
    path: "/incidencia/resoluciones",
    pageTitle: "Registrar Resoluciones",
    activePath: "/incidencia/resoluciones",
    permisoRequerido: "RESOLUCION_LEER",
    Component: ResolucionesPage,
  },
  {
    path: "/auditoria",
    pageTitle: "Auditorias",
    activePath: "/auditoria",
    permisoRequerido: "AUDITORIA_VER",
    Component: AuditoriaPage,
  },
  {
    path: "/reportes/vencimientocontratos",
    pageTitle: "Reportes de Vencimiento",
    activePath: "/reportes/vencimientocontratos",
    permisoRequerido: "CONTRATO_LEER",
    Component: ReporteVencimientoContratoPage,
  },
];

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-gray-100">
      <p className="text-gray-600">Cargando módulo...</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            {publicRoutes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            {protectedRoutes.map(
              ({
                path,
                pageTitle,
                activePath,
                permisoRequerido,
                Component,
              }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute permisoRequerido={permisoRequerido}>
                      <DashboardLayout
                        pageTitle={pageTitle}
                        activePath={activePath}
                      >
                        <Component />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
              ),
            )}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
