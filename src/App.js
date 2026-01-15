import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { AuthProvider } from './context/AuthContext';

import DashboardLayout from "./components/layout/DashboardLayout";
import Unauthorized from "./pages/shared/Unauthorized";

import AuditoriaPage from "./pages/auditoria/AuditoriaPage";
import Configuracion from "./pages/configuracion/Configuracion";
import Home from "./pages/dashboard/Home";
import EstadoDispositivoPage from "./pages/incidencias/EstadoDispositivos/EstadoDispositivoPage";
import IncidenciaPage from "./pages/incidencias/Incidencias/IncidenciaPage";
import ResolucionesPage from "./pages/incidencias/Resoluciones/ResolucionesPage";
import CategoriasPage from './pages/infraestructura/Categorias/CategoriaPage';
import ContratoPage from './pages/infraestructura/Contratos/ContratoPage';
import DispositivoPage from './pages/infraestructura/Dispositivos/DispositivoPage';
import MarcaPage from './pages/infraestructura/Marcas/MarcaPage';
import ModeloPage from './pages/infraestructura/Modelos/ModeloPage';
import OtrosDispositivoPage from './pages/infraestructura/OtrosDispositivos/OtrosDispositivoPage';
import ProveedorPage from './pages/infraestructura/Proveedores/ProveedorPage';
import SitioPage from './pages/infraestructura/Sitios/SitioPage';
import TipoPage from './pages/infraestructura/Tipos/TipoPage';
import UbicacionPage from './pages/infraestructura/Ubicaciones/UbicacionPage';
import ConsumiblePage from "./pages/recorridos/Consumibles/ConsumiblePage";
import ConsumoPage from "./pages/recorridos/Consumos/ConsumoPage";
import ParametroPage from "./pages/recorridos/ParametroAmbiente/ParametroPage";
import ReporteConsumoPage from "./pages/reportes/ReporteConsumoPage";
import ReporteVencimientoContratoPage from "./pages/reportes/ReporteVencimientoContratoPage";
import AsignacionPermisoPage from "./pages/usuarios/AsignacionPermisoPage";
import Login from "./pages/usuarios/Login";
import PermisosPage from "./pages/usuarios/PermisosPage";
import UsuarioPage from "./pages/usuarios/UsuarioPage";

function App() {
  return (
    // CORRECCIÓN CLAVE: El Router debe envolver al AuthProvider para que useNavigate funcione dentro del contexto
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          {/*--------------------------------------------------------------------------------------------*/}

          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas protegidas */}
          {/* -------------------------------------------------------------------------------------------*/}

          {/* RUTAS SIN PERMISOS ESPECÍFICOS (SOLO REQUIEREN LOGIN) */}
          <Route
            path="/"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido={[]}>
                <DashboardLayout pageTitle="Inicio" activePath="/home">
                  <Home />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido={[]}>
                <DashboardLayout pageTitle="Inicio" activePath="/home">
                  <Home />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido={[]}>
                <DashboardLayout pageTitle="Configuración" activePath="/configuracion">
                  <Configuracion />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* --- MÓDULO INFRAESTRUCTURA (CON PERMISOS) --- */}
          {/* ---------------------------------------------------------------------------------------------------*/}

          {/* 1. RUTA PARA CATEGORIAS */}
          <Route
            path="/infraestructura/categorias"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="CATEGORIA_LEER">
                <DashboardLayout pageTitle="Categorías" activePath="/infraestructura/categorias">
                  <CategoriasPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 2. RUTA PARA MARCAS */}
          <Route
            path="/infraestructura/marcas"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="MARCA_LEER">
                <DashboardLayout pageTitle="Marcas" activePath="/infraestructura/marcas">
                  <MarcaPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 3. RUTA PARA PROVEEDORES */}
          <Route
            path="/infraestructura/proveedores"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="PROVEEDOR_LEER">
                <DashboardLayout pageTitle="Proveedores" activePath="/infraestructura/proveedores">
                  <ProveedorPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 4. RUTA PARA SITIOS */}
          <Route
            path="/infraestructura/sitios"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="SITIO_LEER">
                <DashboardLayout pageTitle="Sitios" activePath="/infraestructura/sitios">
                  <SitioPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 5. RUTA PARA CONTRATOS */}
          <Route
            path="/infraestructura/contratos"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="CONTRATO_LEER">
                <DashboardLayout pageTitle="Contratos" activePath="/infraestructura/contratos">
                  <ContratoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* 6. RUTA PARA MODELOS */}
          <Route
            path="/infraestructura/modelos"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="MODELO_LEER">
                <DashboardLayout pageTitle="Modelos" activePath="/infraestructura/modelos">
                  <ModeloPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* 6. RUTA PARA UBICACIONES */}
          <Route
            path="/infraestructura/ubicaciones"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="UBICACION_LEER">
                <DashboardLayout pageTitle="Ubicaciones" activePath="/infraestructura/ubicaciones">
                  <UbicacionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* 7. RUTA PARA DISPOSITIVOS */}
          <Route
            path="/infraestructura/dispositivos"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="DISPOSITIVO_LEER">
                <DashboardLayout pageTitle="Dispositivos" activePath="/infraestructura/dispositivos">
                  <DispositivoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* 7. RUTA PARA OTROS DISPOSITIVOS */}
          <Route
            path="/infraestructura/otrosdispositivo"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="OTROSDISPOSITIVO_LEER">
                <DashboardLayout pageTitle="Otros Dispositivos" activePath="/infraestructura/otrosdispositivo">
                  <OtrosDispositivoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* 8. Ruta de Tipos */}
          <Route
            path="/infraestructura/Tipos"
            element={
              <ProtectedRoute permisoRequerido="TIPO_LEER">
                <DashboardLayout pageTitle="Registrar Tipos" activePath="/infraestructura/Tipos">
                  <TipoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* 9. Ruta de Usuarios */}
          <Route
            path="/usuarios"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="USUARIO_LEER">
                <DashboardLayout pageTitle="Usuarios" activePath="/usuarios">
                  <UsuarioPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 10. Ruta de Permisos */}
          <Route
            path="/usuarios/permisos"
            element={
              // PROPIEDAD CORRECTA: 'permisoRequerido'
              <ProtectedRoute permisoRequerido="PERMISO_LEER">
                <DashboardLayout pageTitle="Permisos" activePath="/usuarios/permisos">
                  <PermisosPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 11. Ruta de Asignación de Permisos */}
          <Route
            path="/usuarios/asignacion"
            element={
              <ProtectedRoute permisoRequerido="PERMISOS_ASIGNAR">
                <DashboardLayout pageTitle="Asignación de Permisos" activePath="/usuarios/asignacion">
                  <AsignacionPermisoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 12. Ruta de Consumibles */}
          <Route
            path="/recorridos/consumibles"
            element={
              <ProtectedRoute permisoRequerido="CONSUMIBLE_LEER">
                <DashboardLayout pageTitle="Registrar Consumibles" activePath="/recorridos/consumibles">
                  <ConsumiblePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 13. Ruta de Consumibles */}
          <Route
            path="/recorridos/consumos"
            element={
              <ProtectedRoute permisoRequerido="CONSUMO_LEER">
                <DashboardLayout pageTitle="Registrar Consumos" activePath="/recorridos/consumos">
                  <ConsumoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 14. Ruta de Parámetros */}
          <Route
            path="/recorridos/parametros"
            element={
              <ProtectedRoute permisoRequerido="PARAMETROAMBIENTE_LEER">
                <DashboardLayout pageTitle="Registrar Parámetros" activePath="/recorridos/parametros">
                  <ParametroPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 15. Ruta de Incidencias */}
          <Route
            path="/incidencia/incidencias"
            element={
              <ProtectedRoute permisoRequerido="INCIDENCIA_LEER">
                <DashboardLayout pageTitle="Registrar Incidencias" activePath="/incidencia/incidencias">
                  <IncidenciaPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 16. Ruta de Incidencias */}
          <Route
            path="/incidencia/resoluciones"
            element={
              <ProtectedRoute permisoRequerido="RESOLUCION_LEER">
                <DashboardLayout pageTitle="Registrar Resoluciones" activePath="/incidencia/resoluciones">
                  <ResolucionesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 17. Ruta de Incidencias */}
          <Route
            path="/incidencia/estadodispositivo"
            element={
              <ProtectedRoute permisoRequerido="ESTADODISPOSITIVO_LEER">
                <DashboardLayout pageTitle="Registrar Estado de otros Dispositivos" activePath="/incidencia/estadodispositivo">
                  <EstadoDispositivoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 18. Ruta de Auditoria */}
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute permisoRequerido="AUDITORIA_VER">
                <DashboardLayout pageTitle="Auditorias" activePath="/auditoria">
                  <AuditoriaPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 19. Reporte Consumo */}
          <Route
            path="/reportes/reporteconsumo"
            element={
              <ProtectedRoute permisoRequerido="CONSUMO_LEER">
                <DashboardLayout pageTitle="Reportes de Consumo" activePath="/reportes/reporteconsumo">
                  <ReporteConsumoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 20. Reporte Vencimiento Contrato */}
          <Route
            path="/reportes/vencimientocontratos"
            element={
              <ProtectedRoute permisoRequerido="CONTRATO_LEER">
                <DashboardLayout pageTitle="Reportes de Vencimiento" activePath="/reportes/vencimientocontratos">
                  <ReporteVencimientoContratoPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />


        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;