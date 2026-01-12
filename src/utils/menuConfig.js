// src/utils/menuConfig.js
import { PERMISOS } from './permisosMap';

export const menuConfig = [
  // --- SECCIÓN USUARIOS ---
  {
    label: 'Usuarios',
    path: '/usuarios',
    permiso: PERMISOS.USUARIO_LEER,
  },
  {
    label: 'Permisos',
    path: '/usuarios/permisos',
    permiso: PERMISOS.PERMISO_LEER,
  },
  {
    label: 'Asignación de Permisos',
    path: '/usuarios/asignacion',
    permiso: PERMISOS.PERMISOS_ASIGNAR,
  },

  // --- SECCIÓN RECORRIDOS ---
  {
    label: 'Consumibles',
    path: '/recorridos/consumibles',
    permiso: PERMISOS.CONSUMIBLE_LEER,
  },
  {
    label: 'Consumos',
    path: '/recorridos/consumos',
    permiso: PERMISOS.CONSUMO_LEER,
  },
  {
    label: 'Parámetros de Ambiente',
    path: '/recorridos/parametros',
    permiso: PERMISOS.PARAMETROAMBIENTE_LEER,
  },

  // --- SECCIÓN INFRAESTRUCTURA ---
  {
    label: 'Categorías',
    path: '/infraestructura/categorias',
    permiso: PERMISOS.CATEGORIA_LEER,
  },
  {
    label: 'Marcas',
    path: '/infraestructura/marcas',
    permiso: PERMISOS.MARCA_LEER,
  },
  {
    label: 'Modelos',
    path: '/infraestructura/modelos',
    permiso: PERMISOS.MODELO_LEER,
  },
  {
    label: 'Tipos',
    path: '/infraestructura/tipos',
    permiso: PERMISOS.TIPO_LEER,
  },
  {
    label: 'Sitios',
    path: '/infraestructura/sitios',
    permiso: PERMISOS.SITIO_LEER,
  },
  {
    label: 'Ubicaciones',
    path: '/infraestructura/ubicaciones',
    permiso: PERMISOS.UBICACION_LEER,
  },
  {
    label: 'Proveedores',
    path: '/infraestructura/proveedores',
    permiso: PERMISOS.PROVEEDOR_LEER,
  },
  {
    label: 'Contratos',
    path: '/infraestructura/contratos',
    permiso: PERMISOS.CONTRATO_LEER,
  },
  {
    label: 'Dispositivos',
    path: '/infraestructura/dispositivos',
    permiso: PERMISOS.DISPOSITIVO_LEER,
  },
  {
    label: 'Otros Dispositivos',
    path: '/infraestructura/otrosdispositivo',
    permiso: PERMISOS.OTROSDISPOSITIVO_LEER,
  },

  // --- SECCIÓN INCIDENCIAS ---
  {
    label: 'Incidencias',
    path: '/incidencia/incidencias',
    permiso: PERMISOS.INCIDENCIA_LEER,
  },
  {
    label: 'Resoluciones',
    path: '/incidencia/resoluciones',
    permiso: PERMISOS.RESOLUCION_LEER,
  },
  {
    label: 'Estado Dispositivo',
    path: '/incidencia/estadodispositivo',
    permiso: PERMISOS.ESTADODISPOSITIVO_LEER,
  },


  // --- OTROS MÓDULOS ---
  {
    label: 'Auditoría',
    path: '/auditoria',
    permiso: PERMISOS.AUDITORIA_VER,
  },
  {
    label: 'Reportes',
    path: '/reportes',
    permiso: PERMISOS.USUARIO_LEER,
  },
  { label: 'Dashboard', path: '/home', permiso: 'USUARIO_LEER' },

];
