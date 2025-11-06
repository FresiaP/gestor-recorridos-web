import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import Home from "./pages/dashboard/Home";
import Usuarios from "./pages/usuarios/Usuarios";
import Configuracion from "./pages/configuracion/Configuracion";
import Login from "./pages/usuarios/Login";
import CategoriasPage from './pages/infraestructura/Categorias/CategoriaPage';
import MarcaPage from './pages/infraestructura/Marcas/MarcaPage';
import ProveedorPage from './pages/infraestructura/Proveedores/ProveedorPage';
import SitioPage from './pages/infraestructura/Sitios/SitioPage';
import ContratoPage from './pages/infraestructura/Contratos/ContratoPage';
import ModeloPage from './pages/infraestructura/Modelos/ModeloPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        {/*--------------------------------------------------------------------------------------------*/}

        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        {/* -------------------------------------------------------------------------------------------*/}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout pageTitle="Inicio" activePath="/home">
                <Home />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <DashboardLayout pageTitle="Inicio" activePath="/home">
                <Home />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute permisoRequerido="GESTION_USUARIOS">
              <DashboardLayout pageTitle="Usuarios" activePath="/usuarios">
                <Usuarios />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <DashboardLayout pageTitle="Configuración" activePath="/configuracion">
                <Configuracion />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* --- MÓDULO INFRAESTRUCTURA --- */}
        {/* ---------------------------------------------------------------------------------------------------*/}

        {/* 1. RUTA PARA CATEGORIAS */}
        {/* ---------------------------------------------------------------------------------------------------*/}
        <Route
          path="/infraestructura/categorias"
          element={
            <ProtectedRoute permisoRequerido="CATEGORIA_LEER">
              <DashboardLayout pageTitle="Categorías" activePath="/infraestructura/categorias">
                <CategoriasPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 2. RUTA PARA MARCAS */}
        {/* ---------------------------------------------------------------------------------------------------*/}
        <Route
          path="/infraestructura/marcas"
          element={
            <ProtectedRoute permisoRequerido="MARCA_LEER">
              <DashboardLayout pageTitle="Marcas" activePath="/infraestructura/marcas">
                <MarcaPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 3. RUTA PARA PROVEEDORES */}
        {/* ---------------------------------------------------------------------------------------------------*/}
        <Route
          path="/infraestructura/proveedores"
          element={
            <ProtectedRoute permisoRequerido="PROVEEDOR_LEER">
              <DashboardLayout pageTitle="Proveedores" activePath="/infraestructura/proveedores">
                <ProveedorPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 4. RUTA PARA SITIOS */}
        {/* ---------------------------------------------------------------------------------------------------*/}
        <Route
          path="/infraestructura/sitios"
          element={
            <ProtectedRoute permisoRequerido="SITIO_LEER">
              <DashboardLayout pageTitle="Sitios" activePath="/infraestructura/sitios">
                <SitioPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 5. RUTA PARA CONTRATOS */}
        {/* ---------------------------------------------------------------------------------------------------*/}
        <Route
          path="/infraestructura/contratos"
          element={
            <ProtectedRoute permisoRequerido="CONTRATO_LEER">
              <DashboardLayout pageTitle="Contratos" activePath="/infraestructura/contratos">
                <ContratoPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* 6. RUTA PARA CONTRATOS */}
        {/* ---------------------------------------------------------------------------------------------------*/}
        <Route
          path="/infraestructura/modelos"
          element={
            <ProtectedRoute permisoRequerido="MODELO_LEER">
              <DashboardLayout pageTitle="Modelos" activePath="/infraestructura/modelos">
                <ModeloPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
