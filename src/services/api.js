// src/services/api.js
//import { queries } from '@testing-library/dom';
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
// AUTENTICACIÓN DE USUARIOS
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

export const getUsuarioActual = () => {
    const token = sessionStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = jwtDecode(token);

        // Parsear permisos
        let permisosArray = [];
        if (payload.permisos) {
            try {
                const parsed = JSON.parse(payload.permisos);
                permisosArray = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                permisosArray = [payload.permisos];
            }
        }

        // Validar expiración del token
        const now = Date.now() / 1000;
        if (payload.exp < now) {
            eliminarToken();
            return null;
        }

        return {
            // ✅ Usa IdUsuario si existe, si no usa nameid
            id: payload.IdUsuario || payload.nameid,
            nombre: payload.nombre,
            login: payload.unique_name,
            rol: payload.role,
            estado: payload.estado, // si tu backend lo envía
            permisos: permisosArray,
        };
    } catch {
        eliminarToken();
        return null;
    }
};


// ==============================================================================
// USUARIOS CRUD
// ==============================================================================
export const getUsuariosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('tamano', tamano);
        if (query?.trim()) params.append('query', query.trim());
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estado', estadoFiltro); // 👈 coincide con backend
        }

        const url = `/usuarios?${params.toString()}`;
        const response = await api.get(url);

        // 👇 Adaptamos al formato que espera el hook
        return {
            datos: response.data.items || [],                // lista de usuarios
            totalPaginas: Math.ceil(response.data.total / tamano) // número de páginas
        };
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener usuarios.'));
    }
};

export const createUsuario = async (data) => {
    try {
        const response = await api.post('/usuarios', data);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al crear usuario.'));
    }
};

export const updateUsuario = async (id, data) => {
    try {
        const response = await api.put(`/usuarios/${id}`, data);
        return response.data;
    } catch (error) {
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


// ==============================================================================
// PERMISOS Y ASIGNACIÓN DE PERMISOS
// ==============================================================================
export const getPermisos = () => apiGet('/permisos');

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
    try {
        const response = await api.post(`/usuarios/${idUsuario}/permisos`, { permisos: permisosIds });
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al asignar permisos.'));
    }
};

// PERMISOS CRUD (solo lectura + exportar)
export const getPermisosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
    try {
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('tamano', tamano);
        if (query?.trim()) params.append('query', query.trim());
        if (estadoFiltro?.trim() && estadoFiltro.toLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }

        const url = `/permisos?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener permisos.'));
    }
};

// Obtener permisos actuales de un usuario
export const getPermisosUsuario = async (idUsuario) => {
    try {
        const response = await api.get(`/usuarios/${idUsuario}/permisos`);
        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, 'Error al obtener permisos del usuario.'));
    }
};


export const exportarPermisos = async ({ query = '', estadoFiltro = '' }) => {
    try {
        const params = {
            ...(query.trim() && { query: query.trim() }),
            ...(estadoFiltro && { estadoFiltro })
        };

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


// ==============================================================================
// Dispositivos
// ==============================================================================
export const getDispositivosPaginados = async (pagina = 1, tamano = 10, query = '', estadoFiltro = '') => {
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

        const url = `/dispositivos/?${params.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al obtener dispositivos paginados.'));
    }
};

export const exportarDispositivos = async ({ query = "", estadoFiltro = "" } = {}) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        if (query?.trim()) params.append('query', query.trim());

        // Agregar filtro de estado al exportar
        if (estadoFiltro?.trim() && estadoFiltro.toLocaleLowerCase() !== 'todo') {
            params.append('estadoFiltro', estadoFiltro);
        }
        const url = `${BASE_URL}/dispositivos/exportar?${params.toString()}`;

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
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al actualizar el dispositivo.'));
    }
};
export const toggleDispositivoEstado = async (id, nuevoEstado) => {
    try {
        await api.patch(`/dispositivos/${id}/estado`, { estado: nuevoEstado });
        return { id, estado: nuevoEstado };
    } catch (error) {
        // Usando la función central
        throw new Error(extractErrorMessage(error, 'Error al cambiar estado del dispositivo.'));
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


// ==========================
// EJEMPLOS ESPECÍFICOS 
// ==========================
export const getRecorridos = () => apiGet('/recorridos');
export const crearRecorrido = (data) => api.post('/recorridos', data).then(res => res.data);