// src/services/api.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// URL base de tu backend C#
const BASE_URL = 'http://localhost:5010/api';

// =======================================================================
// UTILERÍAS DE TOKEN
// =======================================================================
const getToken = () => sessionStorage.getItem('token');
const getRefreshToken = () => sessionStorage.getItem('refreshToken');

export const guardarToken = (token, refreshToken) => {
    sessionStorage.setItem('token', token.replace(/"/g, ''));
    sessionStorage.setItem('refreshToken', refreshToken.replace(/"/g, ''));


};

export const eliminarToken = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
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
// INTERCEPTOR DE RESPUESTAS PARA REFRESH TOKEN 
// ======================================================================= 
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    // enviar objeto JSON con refreshToken
                    const res = await api.post('/auth/refresh', { refreshToken }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const { token, refreshToken: newRefreshToken } = res.data;
                    guardarToken(token, newRefreshToken);
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    eliminarToken();
                    window.location.href = '/login'; // redirigir al login si falla 
                }
            }
        }
        return Promise.reject(error);
    });

// =======================================================================
// FUNCIÓN CENTRAL DE EXTRACCIÓN DE ERRORES
// =======================================================================
const extractErrorMessage = (error, defaultMessage = 'Error de conexión o servidor.') => {
    if (error.response && error.response.data) {
        const data = error.response.data;

        if (data.errors) {
            const firstKey = Object.keys(data.errors)[0];
            if (firstKey && data.errors[firstKey].length > 0) {
                return data.errors[firstKey][0];
            }
        }
        if (data.error) return data.error;
        if (data.message) return data.message;
        if (data.title && error.response.status === 400) return data.title;
    }
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
        throw new Error(extractErrorMessage(error, 'Error al obtener datos.'));
    }
};

// ==========================================================================
// AUTENTICACIÓN DE USUARIOS
// ==========================================================================
export const login = async (login, password) => {
    try {
        const response = await api.post('/auth/login', { login, password });
        const { token, refreshToken } = response.data;
        if (!token || !refreshToken) throw new Error("El servidor no proporcionó tokens.");
        guardarToken(token, refreshToken);
        return true;
    } catch (error) {
        const errorMessage = extractErrorMessage(error, 'Credenciales inválidas o error de conexión.');
        console.error("Error de login:", error.response || error);
        throw new Error(errorMessage);
    }
};

export const getUsuarioActual = () => {
    // CORREGIDO: leer desde sessionStorage (consistente con guardarToken)
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    const decoded = jwtDecode(token);

    // Extraer roles correctamente
    let roles = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    if (!roles) roles = [];
    if (!Array.isArray(roles)) roles = [roles];

    return {
        idUsuario: decoded.IdUsuario,
        username: decoded.unique_name,
        nombre: decoded.nombre,
        permisos: roles,
    };
};


// ==============================================================================
// Usuarios CRUD
// ==============================================================================
export const getUsuariosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
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

        const url = `/usuarios/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener usuarios paginados.'));
    }
};

export const buscarUsuarioSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/usuarios/select', { params });
    return response.data.map(c => ({
        value: c.value ?? c.Value,
        label: c.label ?? c.Label
    }));
};

export const createUsuario = async (data) => {
    try {
        const response = await api.post('/usuarios/register', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear usuario.'));
    }
};

export const updateUsuario = async (id, data) => {
    try {
        const response = await api.put(`/usuarios/${id}`, data);
        return response.data; // El controlador de C# devuelve el usuario actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar usuario.'));
    }
};

export const toggleUsuarioEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/usuarios/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de usuario.'));
    }
};

export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`).then(res => res.data);

export const exportarUsuarios = async ({ query = '', estadoFiltro = '' }) => {
    try {
        const params = {
            ...(query.trim() && { query: query.trim() }),
            ...(estadoFiltro && { estadoFiltro })
        };

        const response = await api.get('/usuarios/exportar', {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'usuarios_export.xlsx';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?$/);
            if (match && match[1]) fileName = match[1];
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
        throw new Error(extractErrorMessage(error, 'Error al exportar usuarios.'));
    }
};
export const getUsuarioById = (id) => apiGet(`/usuarios/${id}`);

// ==============================================================================
// Permisos y Asignación de permisos
// ==============================================================================
export const getPermisos = async (pagina = 1, tamano = 20, query = '') => {
    const res = await api.get('/permisos', {
        params: { pagina, tamano, query }
    });
    return res.data;
};

export const buscarPermisosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/permisos/select', { params });
    return response.data.map(p => ({
        value: p.value ?? p.Value,
        label: p.label ?? p.Label
    }));
};

export const asignarPermisosUsuario = async (idUsuario, permisosIds) => {
    const payload = {
        IdUsuario: Number(idUsuario),
        PermisosIds: permisosIds
    };
    const res = await api.post(`/usuarios/${idUsuario}/permisos`, payload);
    return res.data;
};

export const deleteAsignacion = async (idUsuarioPermiso) => {
    const res = await api.delete(`/usuarios/asignaciones/${idUsuarioPermiso}`);
    return res.data;
};

// PERMISOS CRUD (solo lectura + exportar)
export const getPermisosPaginados = async (pagina = 1, tamano = 10, query = '') => {
    try {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        if (query?.trim()) {
            params.append('query', query.trim());
        }

        const url = `/permisos?${params.toString()}`;
        const response = await api.get(url);
        return response.data; // tu backend devuelve PaginacionResponse<PermisoReadDto>
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener permisos.'));
    }
};

export const exportarPermisos = async ({ query = '' }) => {
    try {
        const params = {};
        if (query.trim()) {
            params.query = query.trim();
        }

        const response = await api.get('/permisos/exportar', {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'permisos_export.xlsx';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?$/);
            if (match && match[1]) fileName = match[1];
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
        throw new Error(extractErrorMessage(error, 'Error al exportar permisos.'));
    }
};

// Permisos actuales de usuarios
export const getAsignacionesPaginadas = async (pagina = 1, tamano = 10, query = '') => {
    const res = await api.get('/usuarios/asignaciones', {
        params: { pagina, tamano, query }
    });
    const data = res.data;
    return {
        datos: data.datos || [],
        paginaActual: data.paginaActual,
        tamanoPagina: data.tamanoPagina,
        totalRegistros: data.totalRegistros,
        totalPaginas: data.totalPaginas
    };
};

export const exportarAsignaciones = async ({ query }) => {
    const res = await api.get('/usuarios/asignaciones/exportar', {
        params: { query },
        responseType: 'blob'
    });
    return res.data;
};

export const getPermisosUsuario = async (idUsuario) => {
    const res = await api.get(`/usuarios/${idUsuario}/permisos`);
    return res.data;
};

export const getPermisosIdsUsuario = async (idUsuario) => {
    const res = await api.get(`/usuarios/${idUsuario}/ids-permisos`);
    // El backend devuelve una lista simple de enteros: [1, 5, 8]
    return res.data;
};

export const getPermisosCatalogo = async (query = '') => {
    // Si tu backend devuelve todo al omitir la paginación, usamos:
    const res = await api.get('/permisos', {
        params: { query }
    });
    // Retornamos la lista de datos (la matriz sin metadatos de paginación)
    return res.data.datos || res.data;
};

// ==============================================================================
// Categoria
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

export const buscarCategoriasSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/categorias/select', { params });
    return response.data.map(c => ({
        value: c.value ?? c.Value,
        label: c.label ?? c.Label
    }));
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
        const backendErrors = error.response?.data?.errors;
        if (backendErrors) {
            const firstError = Object.values(backendErrors)[0][0];
            throw new Error(firstError);
        }

        throw new Error(
            extractErrorMessage(error, 'Error al crear categoría.')
        );
    }
};
export const updateCategoria = async (id, data) => {
    try {
        const response = await api.put(`/categorias/${id}`, data);
        return response.data;
    } catch (error) {
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
// Tipos
// ==============================================================================
export const getTiposPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('tamano', tamano);
        if (query?.trim()) params.append('query', query.trim());
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        // CORRECCIÓN aplicada: Se agregó el prefijo '/api/' y se asegura el casing 'Tipo'
        const url = `/Tipo?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("Error al obtener tipos paginados:", error);
        throw error;
    }
};

export const buscarTiposSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/Tipo/select', { params });
    return response.data.map(c => ({
        value: c.value ?? c.Value,
        label: c.label ?? c.Label
    }));
};

export const exportarTipos = async ({ query = '', estadoFiltro = '' }) => {
    try {
        const params = {
            ...(query.trim() && { query: query.trim() }),
            ...(estadoFiltro && { estadoFiltro })
        };

        const response = await api.get(`${BASE_URL}/tipo/exportar`, {
            params,
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'tipos_export.xlsx';
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

export const getTipos = () => apiGet('/Tipo');

export const getTipoById = (id) => apiGet(`/Tipo/${id}`);

export const createTipo = async (data) => {
    try {
        const response = await api.post('/Tipo', data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al crear tipo.'));
    }
};
export const updateTipo = async (id, data) => {
    try {
        const response = await api.put(`/Tipo/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al actualizar tipo.'));
    }
};
export const toggleTipoEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/Tipo/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de tipo.'));
    }
};
export const deleteTipo = (id) => api.delete(`/Tipo/${id}`).then(res => res.data);


// ==============================================================================
// Marcas
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
export const buscarMarcasSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/marcas/select', { params });
    return response.data.map(m => ({
        value: m.value ?? m.Value,
        label: m.label ?? m.Label
    }));
};

export const exportarMarcas = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `/marcas/exportar?${params.toString()}`;

        const response = await api.get(url, { responseType: "blob" });

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
// Proveedores
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

export const buscarProveedoresSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/proveedor/select', { params });
    return response.data.map(p => ({
        value: p.value ?? p.Value,
        label: p.label ?? p.Label
    }));
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
// Sitios
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

export const buscarSitiosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/sitios/select', { params });
    return response.data.map(s => ({
        value: s.value ?? s.Value,
        label: s.label ?? s.Label
    }));
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
// Contratos
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

export const buscarContratosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/contratos/select', { params });
    return response.data.map(c => ({
        value: c.value ?? c.Value,
        label: c.label ?? c.Label
    }));
};

export const buscarContratosTop = async (query = '') => {
    const { datos } = await getContratosPaginadas(1, 10, query);
    return datos ?? [];
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

export const recalcularEstadosContratos = async () => {
    const response = await api.post('/Contratos/recalcular-estados');
    return response.data;
};


export const updateContrato = async (id, data) => {
    try {
        const response = await api.put(`/contratos/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al actualizar contrato.'));
    }
};

export const deleteContrato = (id) => api.delete(`/contratos/${id}`).then(res => res.data);

//================================================================================
// Estados
//================================================================================

export const buscarEstadoSelect = async (inputValue = '') => {
    const params = {};
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue.trim();
    }

    const response = await api.get('/EstadosEstado/select', { params });
    // Normaliza por si el backend capitaliza las keys
    return response.data.map((c) => ({
        value: c.value ?? c.Value,
        label: c.label ?? c.Label,
    }));
};
export const getEstadosById = (id) => apiGet(`/EstadosEstado/${id}`);

//================================================================================
// Propiedad Legal
//================================================================================

export const buscarPropiedadLegalSelect = async (inputValue = '') => {
    const params = {};
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue.trim();
    }

    const response = await api.get('/PropiedadLegal/select', { params });
    // Normaliza por si el backend capitaliza las keys
    return response.data.map((p) => ({
        value: p.value ?? p.Value,
        label: p.label ?? p.Label,
    }));
};
export const getPropiedadLegalById = (id) => apiGet(`/PropiedadLegal/${id}`);

// ==============================================================================
// Modelos
// ==============================================================================
export const getModelosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('tamano', tamano);
        if (query) params.append('query', query);
        if (estadoFiltro) params.append('estadoFiltro', estadoFiltro);

        const response = await api.get(`/modelo?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener modelos paginados.'));
    }
};

export const buscarModelosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/modelo/select', { params });
    return response.data.map(m => ({
        value: m.value ?? m.Value,
        label: m.label ?? m.Label
    }));
};

export const buscarModelosTop = async (query = '') => {
    const { datos } = await getModelosPaginados(1, 10, query);
    return datos ?? [];
};

export const exportarModelos = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLocaleLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }
        const url = `${BASE_URL}/modelo/exportar?${params.toString()}`;

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

// ==============================================================================
// Ubicaciones
// ==============================================================================
export const getUbicacionesPaginadas = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
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

        const url = `/ubicacion/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener ubicaciones paginadas.'));
    }
};

export const buscarUbicacionesSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/ubicacion/select', { params });
    return response.data.map(u => ({
        value: u.value ?? u.Value,
        label: u.label ?? u.Label
    }));
};

export const buscarUbicacionesTop = async (query = '') => {
    const { datos } = await getUbicacionesPaginadas(1, 10, query);
    return datos ?? [];
};

export const exportarUbicaciones = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLocaleLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }
        const url = `${BASE_URL}/ubicacion/exportar?${params.toString()}`;

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
        link.setAttribute('download', 'Ubicaciones_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar proveedores.'));
    }
};
export const getUbicaciones = () => apiGet('/ubicacion');

export const getUbicacionesById = (id) => apiGet(`/ubicacion/${id}`);

export const createUbicacion = async (data) => {
    try {
        const response = await api.post('/ubicacion', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear ubicacion.'));
    }
};
export const updateUbicacion = async (id, data) => {
    try {
        const response = await api.put(`/ubicacion/${id}`, data);
        return response.data; // El controlador de C# devuelve la ubicación actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar ubicacion.'));
    }
};
export const toggleUbicacionEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/ubicacion/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado de la ubicacion.'));
    }
};
export const deleteUbicacion = (id) => api.delete(`/ubicacion/${id}`).then(res => res.data);

//====================================================================================
//Activos
//====================================================================================
export const getActivosPaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    estadoFiltro = '',
    sortColumn = '',
    sortDirection = 'asc'
) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtro por estado
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        // Ordenamiento dinámico
        if (sortColumn?.trim()) {
            params.append('sortColumn', sortColumn);
        }
        if (sortDirection?.trim()) {
            params.append('sortDirection', sortDirection);
        }

        const url = `/activos/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener activos paginados.'));
    }
};
export const buscarActivosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/activos/select', { params });
    return response.data.map(a => ({
        value: a.value ?? a.Value,
        label: a.label ?? a.Label
    }));
};
export const exportarActivos = async ({
    query = "",
    estadoFiltro = "",
    sortColumn = "",
    sortDirection = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append("query", query.trim());

        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== "todo") {
            params.append("estadoFiltro", estadoFiltro);
        }

        if (sortColumn?.trim()) params.append("sortColumn", sortColumn);
        if (sortDirection?.trim()) params.append("sortDirection", sortDirection);

        const url = `${BASE_URL}/activos/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: "blob",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.setAttribute("download", "Activos_Exportados.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al exportar activos."));
    }
};
export const getActivos = () => apiGet('/activos');

export const getActivosById = (id) => apiGet(`/activos/${id}`);

export const createActivo = async (data) => {
    try {
        const response = await api.post('/activos', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear el activo.'));
    }
};
export const updateActivo = async (id, data) => {
    try {
        const response = await api.put(`/activos/${id}`, data);
        return response.data;
    } catch (error) {

        throw new Error(extractErrorMessage(error, 'Error al actualizar el activo.'));
    }
};
export const deleteActivo = (id) => api.delete(`/activos/${id}`).then(res => res.data);

export const getPrediccionesPorActivo = async (idActivo) => {
    try {
        const response = await api.get(`/predicciones/activo/${idActivo}`);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al obtener predicciones."));
    }
};

export const guardarPrediccion = async (payload) => {
    try {
        const response = await api.post("/predicciones/guardar", payload);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.message || "Error en el servidor");
        } else if (error.request) {
            throw new Error("No se recibió respuesta del servidor");
        } else {
            throw new Error(error.message);
        }
    }
};

export const generarPrediccion = async (idActivo, umbral) => {
    try {
        const response = await api.get(
            `/predicciones/generar/${idActivo}`,
            {
                params: { umbral }
            }
        );

        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.message || "Error en el servidor");
        } else if (error.request) {
            throw new Error("No se recibió respuesta del servidor");
        } else {
            throw new Error(error.message);
        }
    }
};

//====================================================================================
//Servicios
//====================================================================================
export const getServiciosPaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    estadoFiltro = '',
    sortColumn = '',
    sortDirection = 'asc'
) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtro por estado
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        // Ordenamiento dinámico
        if (sortColumn?.trim()) {
            params.append('sortColumn', sortColumn);
        }
        if (sortDirection?.trim()) {
            params.append('sortDirection', sortDirection);
        }

        const url = `/servicio/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener servicios paginados.'));
    }
};

export const exportarServicios = async ({
    query = "",
    estadoFiltro = "",
    sortColumn = "",
    sortDirection = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append("query", query.trim());

        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== "todo") {
            params.append("estadoFiltro", estadoFiltro);
        }

        if (sortColumn?.trim()) params.append("sortColumn", sortColumn);
        if (sortDirection?.trim()) params.append("sortDirection", sortDirection);

        const url = `${BASE_URL}/servicio/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: "blob",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.setAttribute("download", "Servicios_Exportados.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al exportar servicios."));
    }
};

export const getServiciosById = (id) => apiGet(`/servicio/${id}`);

export const createServicio = async (data) => {
    try {
        const response = await api.post('/servicio', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear el servicio.'));
    }
};

export const updateServicio = async (id, data) => {
    try {
        const response = await api.put(`/servicio/${id}`, data);
        return response.data;
    } catch (error) {

        throw new Error(extractErrorMessage(error, 'Error al actualizar el servicio.'));
    }
};
export const deleteServicio = (id) => api.delete(`/servicio/${id}`).then(res => res.data);

// ==============================================================================
// Dispositivos
// ==============================================================================
export const getDispositivosPaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    estadoFiltro = '',
    sortColumn = '',
    sortDirection = 'asc'
) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtro por estado
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        // Ordenamiento dinámico
        if (sortColumn?.trim()) {
            params.append('sortColumn', sortColumn);
        }
        if (sortDirection?.trim()) {
            params.append('sortDirection', sortDirection);
        }

        const url = `/dispositivos/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener dispositivos paginados.'));
    }
};

export const buscarDispositivosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/dispositivos/select', { params });
    return response.data.map(c => ({
        value: c.value ?? c.Value,
        label: c.label ?? c.Label
    }));
};

export const exportarDispositivos = async ({
    query = "",
    estadoFiltro = "",
    sortColumn = "",
    sortDirection = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append("query", query.trim());

        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== "todo") {
            params.append("estadoFiltro", estadoFiltro);
        }

        if (sortColumn?.trim()) params.append("sortColumn", sortColumn);
        if (sortDirection?.trim()) params.append("sortDirection", sortDirection);

        const url = `${BASE_URL}/dispositivos/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: "blob",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.setAttribute("download", "Dispositivos_Exportados.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al exportar dispositivos."));
    }
};

export const getDispositivos = () => apiGet('/dispositivos');

export const getDispositivoById = (id) => apiGet(`/dispositivos/${id}`);

export const createDispositivo = async (data) => {
    try {
        const response = await api.post('/dispositivos', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear dispositivo.'));
    }
};

export const updateDispositivo = async (id, data) => {
    try {
        const response = await api.put(`/dispositivos/${id}`, data);
        return response.data; // El controlador de C# devuelve el dispositivo actualizado
    } catch (error) {

        throw new Error(extractErrorMessage(error, 'Error al actualizar el dispositivo.'));
    }
};

export const deleteDispositivo = (id) => api.delete(`/dispositivos/${id}`).then(res => res.data);

// ==============================================================================
// Otros Dispositivos
// ==============================================================================
export const getOtrosDispositivosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
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

        const url = `/otrosdispositivo/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener otros dispositivos paginados.'));
    }
};

export const buscarOtrosDispositivosSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/otrosdispositivo/select', { params });
    return response.data.map(o => ({
        value: o.value ?? o.Value,
        label: o.label ?? o.Label
    }));
};

export const exportarOtrosDispositivos = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLocaleLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }
        const url = `${BASE_URL}/otrosdispositivo/exportar?${params.toString()}`;

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
export const getOtrosDispositivos = () => apiGet('/otrosdispositivo');

export const getOtrosDispositivoById = (id) => apiGet(`/otrosdispositivo/${id}`);

export const createOtrosDispositivo = async (data) => {
    try {
        const response = await api.post('/otrosdispositivo', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear dispositivo.'));
    }
};
export const updateOtrosDispositivo = async (id, data) => {
    try {
        const response = await api.put(`/otrosdispositivo/${id}`, data);
        return response.data; // El controlador de C# devuelve el dispositivo actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el dispositivo.'));
    }
};
export const toggleOtrosDispositivoEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/otrosdispositivo/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado del dispositivo.'));
    }
};
export const deleteOtrosDispositivo = (id) => api.delete(`/otrosdispositivo/${id}`).then(res => res.data);

// ==============================================================================
// Consumibles
// ==============================================================================
export const getConsumiblesPaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = '',

) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda de texto (query)
        // ESTO maneja la búsqueda por nombre de Dispositivo o Usuario
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtros de fecha (solo si son válidos)
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);

        if (fechaInicio && isValidDate(fechaInicio)) {
            params.append('fechaInicio', fechaInicio); // Enviando al backend
        }
        if (fechaFin && isValidDate(fechaFin)) {
            params.append('fechaFin', fechaFin);       // Enviando al backend
        }

        const url = `/consumible?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener consumibles paginados.'));
    }
};

export const exportarConsumibles = async ({
    query = "",
    ordenarPor = "",
    idDispositivo = null,
    idUsuario = null,
    fechaInicio = "",
    fechaFin = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        // Filtros
        if (query?.trim()) params.append('query', query.trim());
        if (ordenarPor?.trim()) params.append('ordenarPor', ordenarPor.trim());

        // --- Nuevos Filtros Maestros ---
        if (idDispositivo && idDispositivo > 0) {
            params.append('idDispositivo', idDispositivo);
        }
        if (idUsuario && idUsuario > 0) {
            params.append('idUsuario', idUsuario);
        }
        // -------------------------------

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);


        const url = `${BASE_URL}/consumible/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Lógica de descarga...
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', 'Consumibles_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar consumibles.'));
    }
};

export const getConsumibleById = (id) => apiGet(`/consumible/${id}`);

export const createConsumible = async (data) => {
    try {
        const response = await api.post('/consumible', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear consumible.'));
    }
};
export const updateConsumible = async (id, data) => {
    try {
        const response = await api.put(`/consumible/${id}`, data);
        return response.data; // El controlador de C# devuelve el consumible actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el consumible.'));
    }
};

export const deleteConsumible = (id) => api.delete(`/consumible/${id}`).then(res => res.data);

// Leer consumos desde la impresora (solo lectura)
export const extraerConsumible = async (ip) => {
    try {
        const response = await api.get('/consumible/extraer-consumibles', {
            params: { ip }
        });
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al extraer consumos.'));
    }
};

// Leer y guardar consumos desde la impresora
export const extraerYGuardarConsumible = async (ip, idDispositivo, idUsuario) => {
    try {
        const response = await api.post('/consumible/extraer-y-guardar-consumibles', null, {
            params: { ip, idDispositivo, idUsuario }
        });
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al extraer y guardar consumos.'));
    }
};

// ==============================================================================
// Consumos
// ==============================================================================
export const getConsumosPaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = '',

) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda de texto (query)
        // ESTO maneja la búsqueda por nombre de Dispositivo o Usuario
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtros de fecha (solo si son válidos)
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);

        if (fechaInicio && isValidDate(fechaInicio)) {
            params.append('fechaInicio', fechaInicio); // Enviando al backend
        }
        if (fechaFin && isValidDate(fechaFin)) {
            params.append('fechaFin', fechaFin);       // Enviando al backend
        }

        const url = `/consumo?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener consumos paginados.'));
    }
};

export const exportarConsumo = async ({
    query = "",
    ordenarPor = "",
    idDispositivo = null,
    idUsuario = null,
    fechaInicio = "",
    fechaFin = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        // Filtros
        if (query?.trim()) params.append('query', query.trim());
        if (ordenarPor?.trim()) params.append('ordenarPor', ordenarPor.trim());

        // --- Nuevos Filtros Maestros ---
        if (idDispositivo && idDispositivo > 0) {
            params.append('idDispositivo', idDispositivo);
        }
        if (idUsuario && idUsuario > 0) {
            params.append('idUsuario', idUsuario);
        }
        // -------------------------------

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);


        const url = `${BASE_URL}/consumo/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Lógica de descarga...
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', 'Consumos_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar consumos.'));
    }
};

export const getConsumoById = (id) => apiGet(`/consumo/${id}`);

export const createConsumo = async (data) => {
    try {
        const response = await api.post('/consumo', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear consumo.'));
    }
};
export const updateConsumo = async (id, data) => {
    try {
        const response = await api.put(`/consumo/${id}`, data);
        return response.data; // El controlador de C# devuelve el consumo actualizado
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el consumo.'));
    }
};

export const deleteConsumo = (id) => api.delete(`/consumo/${id}`).then(res => res.data);

// Leer consumos desde la impresora (solo lectura)
export const extraerConsumos = async (ip) => {
    try {
        const response = await api.get('/consumo/extraer', {
            params: { ip }
        });
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al extraer consumos.'));
    }
};

// Leer y guardar consumos desde la impresora
export const extraerYGuardar = async (ip, idDispositivo, idUsuario) => {
    try {
        const response = await api.post('/consumo/extraer-y-guardar', null, {
            params: { ip, idDispositivo, idUsuario }
        });
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al extraer y guardar consumos.'));
    }
};

// ==============================================================================
// Consumos Mensuales
// ==============================================================================
export const getConsumosMensualesPaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = '',
    sortColumn = '',
    sortDirection = 'asc'
) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda
        if (query?.trim()) params.append('query', query.trim());

        // Filtros de fecha
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
        if (fechaInicio && isValidDate(fechaInicio)) params.append('fechaInicio', fechaInicio);
        if (fechaFin && isValidDate(fechaFin)) params.append('fechaFin', fechaFin);

        // Ordenamiento opcional
        if (sortColumn) params.append('sortColumn', sortColumn);
        if (sortDirection) params.append('sortDirection', sortDirection);

        const url = `/ConsumoMensual?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener consumos mensuales paginados.'));
    }
};

export const exportarConsumosMensuales = async ({
    query = "",
    sortColumn = "",
    sortDirection = "asc",
    fechaInicio = "",
    fechaFin = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        // Filtros de búsqueda
        if (query?.trim()) params.append("query", query.trim());

        // Ordenamiento
        if (sortColumn?.trim()) params.append("sortColumn", sortColumn.trim());
        if (sortDirection?.trim()) params.append("sortDirection", sortDirection.trim());

        // Filtros de fecha (validación formato yyyy-MM-dd)
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
        if (fechaInicio && isValidDate(fechaInicio)) params.append("fechaInicio", fechaInicio);
        if (fechaFin && isValidDate(fechaFin)) params.append("fechaFin", fechaFin);

        const url = `${BASE_URL}/ConsumoMensual/exportar?${params.toString()}`;
        const response = await axios.get(url, {
            responseType: "blob",
            headers: { Authorization: `Bearer ${token}` },
        });

        // Descargar archivo Excel
        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlBlob;
        link.setAttribute("download", "ConsumosMensuales_Exportados.xlsx");
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Error al exportar consumos mensuales."));
    }
};

export const getConsumoMensualesById = (id) => apiGet(`/ConsumoMensual/${id}`);

export const createConsumoMensual = async (data) => {
    try {
        const response = await api.post('/ConsumoMensual', data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al crear consumo mensual.'));
    }
};

export const updateConsumoMensual = async (id, data) => {
    try {
        const response = await api.put(`/ConsumoMensual/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al actualizar consumo mensual.'));
    }
};

export const deleteConsumoMensual = (id) => api.delete(`/ConsumoMensual/${id}`).then(res => res.data);


export const generarConsolidado = async (idDispositivo, fechaLectura) => {
    try {
        const response = await api.post('/ConsumoMensual/generar-consolidado', null, {
            params: { idDispositivo, fechaLectura }
        });
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al generar consolidado.'));
    }
};

// ==============================================================================
// Parametros Ambiente
// ==============================================================================
export const getParametroAmbientePaginados = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = '',

) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda de texto (query)
        // ESTO maneja la búsqueda por nombre de Dispositivo o Usuario
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtros de fecha (solo si son válidos)
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);

        if (fechaInicio && isValidDate(fechaInicio)) {
            params.append('fechaInicio', fechaInicio); // Enviando al backend
        }
        if (fechaFin && isValidDate(fechaFin)) {
            params.append('fechaFin', fechaFin);       // Enviando al backend
        }

        const url = `/ParametroAmbiente?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener parámetros paginados.'));
    }
};

export const exportarParametroAmbiente = async ({
    query = "",
    ordenarPor = "",
    idUbicacion = null,
    idUsuario = null,
    fechaInicio = "",
    fechaFin = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        // Filtros
        if (query?.trim()) params.append('query', query.trim());
        if (ordenarPor?.trim()) params.append('ordenarPor', ordenarPor.trim());

        // --- Nuevos Filtros Maestros ---
        if (idUbicacion && idUbicacion > 0) {
            params.append('idUbicacion', idUbicacion);
        }
        if (idUsuario && idUsuario > 0) {
            params.append('idUsuario', idUsuario);
        }
        // -------------------------------

        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
        if (fechaInicio && isValidDate(fechaInicio)) params.append('fechaInicio', fechaInicio);
        if (fechaFin && isValidDate(fechaFin)) params.append('fechaFin', fechaFin);

        const url = `${BASE_URL}/ParametroAmbiente/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Lógica de descarga...
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', 'Parametros_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar Parametros.'));
    }
};

export const getParametroAmbienteById = (id) => apiGet(`/ParametroAmbiente/${id}`);

export const createParametroAmbiente = async (data) => {
    try {
        const response = await api.post('/ParametroAmbiente', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear parametro.'));
    }
};
export const updateParametroAmbiente = async (id, data) => {
    try {
        const response = await api.put(`/ParametroAmbiente/${id}`, data);
        return response.data; // El controlador de C# devuelve el parámetros actualizados
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el parámetro.'));
    }
};

export const deleteParametroAmbiente = (id) => api.delete(`/ParametroAmbiente/${id}`).then(res => res.data);

// ==============================================================================
// Incidencias
// ==============================================================================
export const getIncidenciasPaginadas = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = '',
    resueltas = null
) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda de texto
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtros de fecha
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);

        if (fechaInicio && isValidDate(fechaInicio)) {
            params.append('fechaInicio', fechaInicio);
        }
        if (fechaFin && isValidDate(fechaFin)) {
            params.append('fechaFin', fechaFin);
        }


        if (typeof resueltas === 'boolean') {
            params.append('resueltas', resueltas);
        }

        const url = `/Incidencias?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener Incidencias paginadas.'));
    }
};

export const buscarIncidenciasSelect = async (inputValue = '', page = 1, size = 50) => {
    const params = { page, size };
    if (inputValue && inputValue.trim() !== '') {
        params.query = inputValue;
    }
    const response = await api.get('/Incidencias/select', { params });
    return response.data.map(i => ({
        value: i.value ?? i.Value,
        label: i.label ?? i.Label
    }));
};

export const exportarIncidencias = async ({
    query = "",
    ordenarPor = "",
    idDispositivo = null,
    idUsuario = null,
    fechaInicio = "",
    fechaFin = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        // Filtros
        if (query?.trim()) params.append('query', query.trim());
        if (ordenarPor?.trim()) params.append('ordenarPor', ordenarPor.trim());

        // --- Nuevos Filtros Maestros ---
        if (idDispositivo && idDispositivo > 0) {
            params.append('idDispositivo', idDispositivo);
        }
        if (idUsuario && idUsuario > 0) {
            params.append('idUsuario', idUsuario);
        }
        // -------------------------------

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);


        const url = `${BASE_URL}/Incidencias/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Lógica de descarga...
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', 'Incidencias_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar Incidencias.'));
    }
};

export const getIncidenciaById = (id) => apiGet(`/Incidencias/${id}`);

export const createIncidencia = async (data) => {
    try {
        const response = await api.post('/Incidencias', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear Incidencias.'));
    }
};
export const updateIncidencia = async (id, data) => {
    try {
        const response = await api.put(`/Incidencias/${id}`, data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el incidencia.'));
    }
};

export const deleteIncidencia = (id) => api.delete(`/Incidencias/${id}`).then(res => res.data);

// ==============================================================================
// Resoluciones
// ==============================================================================
export const getResolucionesPaginadas = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = ''
) => {
    try {
        const params = new URLSearchParams();

        // Paginación
        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtro de búsqueda de texto
        if (query?.trim()) {
            params.append('query', query.trim());
        }

        // Filtros de fecha
        const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);

        if (fechaInicio && isValidDate(fechaInicio)) {
            params.append('fechaInicio', fechaInicio);
        }
        if (fechaFin && isValidDate(fechaFin)) {
            params.append('fechaFin', fechaFin);
        }

        const url = `/Resolucion?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener Resoluciones paginadas.'));
    }
};

export const exportarResoluciones = async ({
    query = "",
    ordenarPor = "",
    idDispositivo = null,
    idUsuario = null,
    fechaInicio = "",
    fechaFin = ""
} = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        // Filtros
        if (query?.trim()) params.append('query', query.trim());
        if (ordenarPor?.trim()) params.append('ordenarPor', ordenarPor.trim());

        // --- Nuevos Filtros Maestros ---
        if (idDispositivo && idDispositivo > 0) {
            params.append('idDispositivo', idDispositivo);
        }
        if (idUsuario && idUsuario > 0) {
            params.append('idUsuario', idUsuario);
        }
        // -------------------------------

        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);


        const url = `${BASE_URL}/Resolucion/exportar?${params.toString()}`;

        const response = await axios.get(url, {
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Lógica de descarga...
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', 'Resoluciones_Exportados.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar Resoluciones.'));
    }
};

export const getResolucionById = (id) => apiGet(`/Resolucion/${id}`);

export const createResolucion = async (data) => {
    try {
        const response = await api.post('/Resolucion', data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al crear Resolucion.'));
    }
};
export const updateResolucion = async (id, data) => {
    try {
        const response = await api.put(`/Resolucion/${id}`, data);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el Resolucion.'));
    }
};

export async function reasignarResolucion(idResolucion, nuevoIdIncidencia) {
    const response = await api.put(`/Resolucion/reasignar/${idResolucion}`, nuevoIdIncidencia, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
}

export const deleteResolucion = (id) => api.delete(`/Resolucion/${id}`).then(res => res.data);

//===================================================================================================
// Auditorias
//===================================================================================================
export const getAuditoriasPaginadas = async (
    pagina = 1,
    tamano = 10,
    query = '',
    fechaInicio = '',
    fechaFin = '',
    moduloFiltro = '',
    tipoBusquedaFecha = 'rango'
) => {
    try {
        const params = new URLSearchParams();

        params.append('pagina', pagina);
        params.append('tamano', tamano);

        // Filtros opcionales
        if (query?.trim()) params.append('query', query.trim());
        if (moduloFiltro?.trim()) params.append('moduloFiltro', moduloFiltro.trim());

        // Fechas
        if (fechaInicio?.trim()) params.append('fechaInicio', fechaInicio.trim());
        if (fechaFin?.trim()) params.append('fechaFin', fechaFin.trim());

        // Tipo de búsqueda de fecha
        if (tipoBusquedaFecha?.trim()) params.append('tipoBusquedaFecha', tipoBusquedaFecha.trim());

        const url = `/Auditorias?${params.toString()}`;
        const response = await api.get(url);

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener auditorías paginadas.'));
    }
};

export const getAuditoriaById = (id) => apiGet(`/Auditorias/${id}`);

export const exportarAuditorias = async ({
    query = '',
    fechaInicio = '',
    fechaFin = '',
    moduloFiltro = '',
    tipoBusquedaFecha = 'rango'
}) => {
    try {
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());
        if (moduloFiltro?.trim()) params.append('moduloFiltro', moduloFiltro.trim());
        if (fechaInicio?.trim()) params.append('fechaInicio', fechaInicio.trim());
        if (fechaFin?.trim()) params.append('fechaFin', fechaFin.trim());
        if (tipoBusquedaFecha?.trim()) params.append('tipoBusquedaFecha', tipoBusquedaFecha.trim());

        const url = `/Auditorias/exportar?${params.toString()}`;

        const response = await api.get(url, { responseType: 'blob' });

        // Lógica de descarga de archivo
        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'auditoria_export.xlsx';

        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?$/);
            if (match && match[1]) {
                fileName = match[1].replace(/"/g, '');
            }
        }

        const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = urlBlob;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(urlBlob);

        return true;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar auditorías.'));
    }
};


//=====================================================================================================
//Reportes
//=====================================================================================================

// ==============================================================================
// REPORTE DE VENCIMIENTO DE CONTRATOS
// ==============================================================================
export const getVencimientoContratos = async (filtro) => {
    try {
        const body = {
            FechaDesde: filtro.FechaDesde ?? null,
            FechaHasta: filtro.FechaHasta ?? null,
            ContratoId: filtro.ContratoId ?? null,
            ProveedorId: filtro.ProveedorId ?? null,
            Estado: filtro.Estado ?? null
        };

        console.log("Body enviado desde servicio:", body);

        const response = await api.post('/reportes/contratos/vencimiento', body);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al cargar el reporte.'));
    }
};

export const exportarVencimientoContratos = async (filtro) => {
    try {
        const token = getToken();
        const body = {
            FechaDesde: filtro.FechaDesde || null,
            FechaHasta: filtro.FechaHasta || null,
            ContratoId: filtro.ContratoId || null,
            ProveedorId: filtro.ProveedorId || null,
            Estado: filtro.Estado || null
        };

        const response = await axios.post(`${BASE_URL}/reportes/contratos/exportar`, body, {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${token}` }
        });

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Reporte_VencimientoContrato_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al exportar a Excel.'));
    }
};

//==============================================================================
// DASHBOARD
//==============================================================================
export const getDashboard = async () => {
    const response = await api.get("/dashboard");
    return response.data;
};
