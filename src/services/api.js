// src/services/api.js
import { queries } from '@testing-library/dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// URL base de tu backend C#
const BASE_URL = 'http://localhost:5010/api';

// =======================================================================
// UTILERÍAS DE TOKEN
// =======================================================================
const getToken = () => sessionStorage.getItem('token');

export const guardarToken = (token) => {
    sessionStorage.setItem('token', token.replace(/"/g, ''));
};

export const eliminarToken = () => {
    sessionStorage.removeItem('token');
};

// =======================================================================
// CONFIGURACIÓN AXIOS
// =======================================================================
const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// =======================================================================
// FUNCIÓN CENTRAL DE EXTRACCIÓN DE ERRORES
// =======================================================================
const extractErrorMessage = (error, defaultMessage = 'Error de conexión o servidor.') => {
    if (error.response && error.response.data) {
        // 1. Captura el mensaje de error de unicidad enviado por C# (ej: { error: "Ya existe..." })
        if (error.response.data.error) {
            return error.response.data.error;
        }
        // 2. Captura el mensaje genérico (ej: de un NotFound o un error de lógica)
        if (error.response.data.message) {
            return error.response.data.message;
        }
        // 3. Fallback para errores de validación de modelo de ASP.NET Core (ej: { title: "One or more validation errors occurred." })
        if (error.response.data.title && error.response.status === 400) {
            return error.response.data.title;
        }
    }
    // 4. Fallback al mensaje de la librería o el predeterminado
    return error.message || defaultMessage;
};


// ========================================================================
// FUNCIONES GENÉRICAS 
// ========================================================================
export const apiGet = async (endpoint) => {
    try {
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener datos.'));
    }
};

// ==========================================================================
// USUARIOS Y AUTENTICACIÓN 
// ==========================================================================
export const login = async (login, password) => {
    try {
        const response = await api.post('/usuarios/login', { login, password });
        const token = response.data.token;
        if (!token) throw new Error("El servidor no proporcionó un token.");
        guardarToken(token);
        return true;
    } catch (error) {
        // Usando la función central
        const errorMessage = extractErrorMessage(error, 'Credenciales inválidas o error de conexión.');
        console.error("Error de login:", error.response || error);
        throw new Error(errorMessage);
    }
};

export const registrarUsuario = async (usuarioData) => {
    try {
        const response = await api.post('/usuarios', usuarioData);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al registrar usuario.'));
    }
};

export const getUsuarioActual = () => {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = jwtDecode(token);
        const permisosClaim = payload.permisos;
        let permisosArray = [];

        if (permisosClaim) {
            try {
                const parsed = JSON.parse(permisosClaim);
                permisosArray = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                permisosArray = [permisosClaim];
            }
        }

        const now = Date.now().valueOf() / 1000;
        if (payload.exp < now) {
            eliminarToken();
            return null;
        }

        return {
            id: payload.nameid,
            nombre: payload.nombre,
            login: payload.unique_name,
            rol: payload.role,
            permisos: permisosArray,
        };
    } catch (err) {
        eliminarToken();
        return null;
    }
};

// ==============================================================================
// CATEGORÍAS 
// ==============================================================================
export const getCategoriasPaginadas = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('tamano', tamano);
        if (query?.trim()) params.append('query', query.trim());
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `/categorias?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("Error al obtener categorías paginadas:", error);
        throw error;
    }
};

export const exportarCategorias = async ({ query = '', estadoFiltro = '' }) => {
    try {
        const params = {
            ...(query.trim() && { query: query.trim() }),
            ...(estadoFiltro && { estadoFiltro })
        };

        const response = await api.get(`${BASE_URL}/categorias/exportar`, {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'categorias_export.xlsx';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?$/);
            if (match[1]) {
                fileName = match[1];
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();

        return true;
    } catch (error) {
        console.error("Error al exportar categorías:", error);
        throw error;
    }
};

export const getCategorias = () => apiGet('/categorias');

export const getCategoriaById = (id) => apiGet(`/categorias/${id}`);

export const createCategoria = async (data) => {
    try {
        const response = await api.post('/categorias', data);
        return response.data;
    } catch (error) {
        // Usando la función central (para unicidad)
        throw new Error(extractErrorMessage(error, 'Error al crear categoría.'));
    }
};
export const updateCategoria = async (id, data) => {
    try {
        const response = await api.put(`/categorias/${id}`, data);
        return response.data;
    } catch (error) {
        // Usando la función central (para unicidad)
        throw new Error(extractErrorMessage(error, 'Error al actualizar categoría.'));
    }
};
export const toggleCategoriaEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/categorias/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de categoría.'));
    }
};
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`).then(res => res.data);

// ==============================================================================
// MARCAS
// ==============================================================================
export const getMarcasPaginadas = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();

        // Agregar parámetros de paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Agregar filtro de búsqueda por nombre
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Agregar filtro de estado (el nuevo parámetro)
        // Lo enviamos solo si tiene un valor que no sea vacío.
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `/marcas?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener marcas paginadas.'));
    }
};

export const exportarMarcas = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `${BASE_URL}/marcas/exportar?${params.toString()}`;

        const response = await axios.get(
            url,
            {
                responseType: "blob",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.setAttribute("download", "Marcas_Exportadas.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al exportar marcas."));
    }
};
export const getMarcas = () => apiGet('/marcas');

export const getMarcaById = (id) => apiGet(`/marcas/${id}`);

export const createMarca = async (data) => {
    try {
        const response = await api.post('/marcas', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear marca.'));
    }
};
export const updateMarca = async (id, data) => {
    try {
        const response = await api.put(`/marcas/${id}`, data);
        return response.data; // Asumiendo que el controlador de C# devuelve la marca actualizada
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar marca.'));
    }
};
export const toggleMarcaEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/marcas/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de marca.'));
    }
};
export const deleteMarca = (id) => api.delete(`/marcas/${id}`).then(res => res.data);

// ==============================================================================
// PROVEEDORES
// ==============================================================================
export const getProveedoresPaginadas = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();

        // Agregar parámetros de paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Agregar filtro de búsqueda por nombre
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Agregar filtro por estado (el nuevo parámetro)
        // Lo enviamos solo si tiene un valor que no sea vacío.
        if (estadoFiltro?.trim() && estadoFiltro.toLocaleLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `/proveedor/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener proveedores paginados.'));
    }
};
export const exportarProveedores = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLocaleLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }
        const url = `${BASE_URL}/proveedor/exportar?${params.toString()}`;

        const response = await axios.get(
            url,
            {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        // Crear un enlace temporal para descargar el archivo
        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', 'Proveedores_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar proveedores.'));
    }
};
export const getProveedores = () => apiGet('/proveedor');

export const getProveedorById = (id) => apiGet(`/proveedor/${id}`);

export const createProveedor = async (data) => {
    try {
        const response = await api.post('/proveedor', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear proveedor.'));
    }
};
export const updateProveedor = async (id, data) => {
    try {
        const response = await api.put(`/proveedor/${id}`, data);
        return response.data; // El controlador de C# devuelve el proveedor actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar proveedor.'));
    }
};
export const toggleProveedorEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/proveedor/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de proveedor.'));
    }
};
export const deleteProveedor = (id) => api.delete(`/proveedor/${id}`).then(res => res.data);

// ==============================================================================
// SITIOS
// ==============================================================================
export const getSitiosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();

        // Agregar parámetros de paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Agregar filtro de búsqueda por nombre
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Agregar filtro de estado (el nuevo parámetro)
        // Lo enviamos solo si tiene un valor que no sea vacío.
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `/sitios?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener sitios paginados.'));
    }
};

export const exportarSitios = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `${BASE_URL}/sitios/exportar?${params.toString()}`;

        const response = await axios.get(
            url,
            {
                responseType: "blob",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.setAttribute("download", "Sitios_Exportadas.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al exportar sitios."));
    }
};
export const getSitios = () => apiGet('/sitios');

export const getSitioById = (id) => apiGet(`/sitios/${id}`);

export const createSitio = async (data) => {
    try {
        const response = await api.post('/sitios', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear sitio.'));
    }
};
export const updateSitio = async (id, data) => {
    try {
        const response = await api.put(`/sitios/${id}`, data);
        return response.data; // El controlador de C# devuelve el sitio actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar sitios.'));
    }
};
export const toggleSitioEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/sitios/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado del sitio.'));
    }
};
export const deleteSitio = (id) => api.delete(`/sitios/${id}`).then(res => res.data);

// ==============================================================================
// CONTRATOS
// ==============================================================================
export const getContratosPaginadas = async (pagina = 1, tamano = 10, query = '', fechaInicio = null, fechaFin = null) => {
    const token = getToken();
    const params = new URLSearchParams();

    params.append('pagina', pagina);
    params.append('tamano', tamano);
    if (query?.trim()) params.append('query', query.trim());
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const url = `${BASE_URL}/contratos?${params.toString()}`;

    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const exportarContratos = async ({ query = '', fechaInicio = null, fechaFin = null }) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        const url = `${BASE_URL}/contratos/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'Contratos_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar contratos.'));
    }
};


export const getContratos = () => apiGet('/contratos');

export const getContratoById = (id) => apiGet(`/contratos/${id}`);

export const createContrato = async (data) => {
    try {
        const response = await api.post('/contratos', data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al crear contrato.'));
    }
};
export const updateContrato = async (id, data) => {
    try {
        const response = await api.put(`/contratos/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al actualizar contrato.'));
    }
};
export const toggleContratoEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/contratos/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de contrato.'));
    }
};
export const deleteContrato = (id) => api.delete(`/contratos/${id}`).then(res => res.data);

// ==============================================================================
// MODELOS
// ==============================================================================
export const getModelosPaginados = async (pagina = 1, tamano = 10, query = '') => {
    try {
        const url = `/modelo?pagina=${pagina}&tamano=${tamano}&query=${encodeURIComponent(query)}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener modelos paginados.'));
    }
};

export const exportarModelos = async (query = '') => {
    try {
        const token = getToken();
        const url = `${BASE_URL}/modelo/exportar${query ? `?query=${encodeURIComponent(query)}` : ''}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'Modelos_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar modelos.'));
    }
};


export const getModelos = () => apiGet('/modelo');

export const getModeloById = (id) => apiGet(`/modelo/${id}`);

export const createModelo = async (data) => {
    try {
        const response = await api.post('/modelo', data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al crear modelo.'));
    }
};

export const updateModelo = async (id, data) => {
    try {
        const response = await api.put(`/modelo/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al actualizar modelo.'));
    }
};

export const toggleModeloEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/modelo/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de modelo.'));
    }
};

export const deleteModelo = (id) => api.delete(`/modelo/${id}`).then(res => res.data);


// ==========================
// EJEMPLOS ESPECÍFICOS 
// ==========================
export const getRecorridos = () => apiGet('/recorridos');
export const crearRecorrido = (data) => api.post('/recorridos', data).then(res => res.data);