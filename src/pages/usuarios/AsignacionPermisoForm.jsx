import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarUsuarioSelect,
    getPermisos,
    getPermisosIdsUsuario,
    asignarPermisosUsuario,
} from '../../services/api';

const CATALOG_PAGE_SIZE = 20;

const ALCANCE_PREDEFINIDO_OPTIONS = [
    { value: '', label: 'Mostrar Todos (Búsqueda Manual)' },
    { value: 'Auditoria', label: 'Auditoria' },
    { value: 'Categoria', label: 'Categoría' },
    { value: 'Contrato', label: 'Contrato' },
    { value: 'Consumible', label: 'Consumible' },
    { value: 'Consumo', label: 'Consumo' },
    { value: 'Usuario', label: 'Usuario' },
    { value: 'Incidencia', label: 'Incidencia' },
    { value: 'Resolucion', label: 'Resolucion' },
    { value: 'Dispositivo', label: 'Dispositivo' },
    { value: 'Permiso', label: 'Permiso' },
    { value: 'Proveedor', label: 'Proveedor' },
    { value: 'Parametro', label: 'Parametro' },
    { value: 'Ubicacion', label: 'Ubicacion' },
    { value: 'Sitio', label: 'Sitio' },
    { value: 'Marca', label: 'Marca' },
    { value: 'Modelo', label: 'Modelo' },

];

const AsignacionPermisoForm = ({ onClose, onSuccess }) => {
    // === ESTADO PRINCIPAL ===
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [permisosVisibles, setPermisosVisibles] = useState([]);
    const [permisosMarcados, setPermisosMarcados] = useState([]);

    // === ESTADO DE PAGINACIÓN Y FILTRO ===
    const [paginaPermisos, setPaginaPermisos] = useState(1);
    const [totalPaginasPermisos, setTotalPaginasPermisos] = useState(1);
    const [filtroPredefinido, setFiltroPredefinido] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // === ESTADO UI Y FEEDBACK ===
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    const isFiltered = useMemo(() => filtroPredefinido !== '' || searchTerm !== '', [filtroPredefinido, searchTerm]);

    // === 1. CARGA DEL CATÁLOGO DE PERMISOS ===
    useEffect(() => {
        const cargarCatalogo = async () => {
            try {
                setCargando(true);
                const paginaAUsar = isFiltered ? 1 : paginaPermisos;
                const queryToSend = filtroPredefinido || searchTerm;

                const data = await getPermisos(
                    paginaAUsar,
                    isFiltered ? 50 : CATALOG_PAGE_SIZE,
                    queryToSend
                );

                const lista = Array.isArray(data) ? data : data.datos || [];
                setPermisosVisibles(lista);
                setTotalPaginasPermisos(data.totalPaginas || 1);

            } catch (err) {
                console.error("Error al cargar el catálogo de permisos:", err);
                setError("Error al cargar la lista de permisos disponibles.");
            } finally {
                setCargando(false);
            }
        };
        cargarCatalogo();
    }, [paginaPermisos, filtroPredefinido, searchTerm, isFiltered]);

    // === 2. CARGA DE PERMISOS MARCADOS DEL USUARIO ===
    useEffect(() => {
        const userId = usuarioSeleccionado ? usuarioSeleccionado.value : null;
        setPermisosMarcados([]);
        setError(null);

        if (!userId) return;

        const cargarPermisosDelUsuario = async () => {
            try {
                const ids = await getPermisosIdsUsuario(userId);
                setPermisosMarcados(ids.map(id => parseInt(id)));
            } catch (err) {
                console.error("Error al cargar permisos del usuario:", err);
                setError("Error al cargar los permisos asignados. Intente de nuevo.");
            }
        };

        cargarPermisosDelUsuario();
    }, [usuarioSeleccionado]);

    // === LÓGICA DE SELECCIÓN ===

    const allVisibleSelected = permisosVisibles.length > 0 &&
        permisosVisibles.every(p => permisosMarcados.includes(p.idPermiso));

    const togglePermiso = useCallback((idPermiso) => {
        const id = parseInt(idPermiso);
        setPermisosMarcados(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    }, []);

    const toggleSelectAll = () => {
        const visibleIds = permisosVisibles.map(p => p.idPermiso);

        setPermisosMarcados(prev => {
            if (allVisibleSelected) {
                return prev.filter(id => !visibleIds.includes(id));
            } else {
                const newIds = visibleIds.filter(id => !prev.includes(id));
                return [...prev, ...newIds];
            }
        });
    };

    const loadUserOptions = async (inputValue) => {
        const opciones = await buscarUsuarioSelect(inputValue, 1, 50);
        return opciones;
    };

    const handleSelectUser = (opcion) => {
        setUsuarioSeleccionado(opcion);
        setPaginaPermisos(1);
        setFiltroPredefinido('');
        setSearchTerm('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usuarioSeleccionado) {
            setError("Debe seleccionar un usuario para asignar permisos.");
            return;
        }

        try {
            setCargando(true);
            setError(null);

            const userId = usuarioSeleccionado.value;
            await asignarPermisosUsuario(userId, permisosMarcados);

            setMensajeExito("Permisos asignados correctamente.");
            setTimeout(() => onSuccess(true), 1500);
        } catch (err) {
            console.error("Error al asignar permisos:", err);
            setError(err.response?.data?.message || err.message || "Error al asignar permisos.");
        } finally {
            setCargando(false);
        }
    };

    // === COMPONENTE DE PAGINACIÓN ===
    const Paginacion = () => (
        <div className="flex justify-center items-center mt-4 space-x-1">
            <button
                type="button"
                onClick={() => setPaginaPermisos(p => p - 1)}
                disabled={paginaPermisos === 1 || cargando}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded-l disabled:opacity-50 transition duration-150 text-sm"
            >
                &lt; Anterior
            </button>
            <span className="text-sm px-2 text-gray-600">
                Pág. {paginaPermisos} de {totalPaginasPermisos}
            </span>
            <button
                type="button"
                onClick={() => setPaginaPermisos(p => p + 1)}
                disabled={paginaPermisos === totalPaginasPermisos || cargando}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded-r disabled:opacity-50 transition duration-150 text-sm"
            >
                Siguiente &gt;
            </button>
        </div>
    );

    // === RENDERIZADO ===
    return (
        // Usamos max-w-6xl para que el formulario se centre y se extienda al máximo ancho que su contenedor le permita.
        <form onSubmit={handleSubmit} className="p-4 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 border-b pb-2">
                Gestión de Permisos (Sincronización)
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
                    {mensajeExito}
                </div>
            )}

            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Usuario a Gestionar</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadUserOptions}
                    value={usuarioSeleccionado}
                    onChange={handleSelectUser}
                    placeholder="Buscar y seleccionar usuario..."
                    isClearable
                    isDisabled={cargando || !!mensajeExito}
                />
            </div>

            {/* Caja de Filtros y Búsqueda */}
            <div className="mb-2 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* SELECT: Filtro Predefinido/Alcance */}
                    <div className="flex flex-col justify-end">
                        <label className="block text-xs text-gray-600 mb-1">Filtrar por Columna/Entidad</label>
                        <select
                            value={filtroPredefinido}
                            onChange={(e) => {
                                setFiltroPredefinido(e.target.value);
                                setPaginaPermisos(1);
                                setSearchTerm('');
                            }}
                            className="w-full border p-2 text-sm rounded"
                            disabled={!usuarioSeleccionado}
                        >
                            {ALCANCE_PREDEFINIDO_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Input de Búsqueda Manual */}
                    <div className="flex flex-col justify-end">
                        <label className="block text-xs text-gray-600 mb-1">
                            Búsqueda {filtroPredefinido ? `(Filtro '${filtroPredefinido}' activo)` : 'Manual en Descripción/Grupo'}
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPaginaPermisos(1);
                            }}
                            placeholder="Escribe el término a buscar..."
                            className="w-full border p-2 text-sm rounded"
                            disabled={!usuarioSeleccionado || !!filtroPredefinido}
                        />
                    </div>
                </div>
            </div>

            {/* Contenedor de Permisos */}
            {/* Margen negativo para anular el padding y lograr la alineación vertical con la caja de filtros */}
            <div className="mt-[-16px]">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-700 text-sm font-bold">
                        Permisos ({permisosVisibles.length} visibles)
                    </label>
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        disabled={!usuarioSeleccionado || permisosVisibles.length === 0}
                        className={`text-sm px-3 py-1 rounded transition duration-150 ${allVisibleSelected ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'} disabled:opacity-50`}
                    >
                        {allVisibleSelected ? 'Deseleccionar Visibles' : 'Seleccionar Visibles'}
                    </button>
                </div>

                {/* Lista de Permisos: Ahora es siempre una sola columna (grid-cols-1) */}
                <div className="max-h-64 overflow-y-auto border p-4 rounded bg-white grid grid-cols-1 gap-y-3 gap-x-6">
                    {cargando ? (
                        // Mensaje de carga para evitar la transición brusca al cambiar de página
                        <p className="col-span-full text-center text-gray-500 p-4">Cargando permisos, por favor espere...</p>
                    ) : permisosVisibles.length > 0 ? (
                        permisosVisibles.map(p => (
                            // La etiqueta ocupa el ancho completo, eliminando la superposición
                            <label key={p.idPermiso} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={permisosMarcados.includes(p.idPermiso)}
                                    onChange={() => togglePermiso(p.idPermiso)}
                                    disabled={!usuarioSeleccionado}
                                    className="h-4 w-4 text-indigo-600 rounded flex-shrink-0"
                                />
                                <span className={`text-sm ${!usuarioSeleccionado ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {p.descripcion}
                                </span>
                            </label>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 p-4">No hay permisos que coincidan con los filtros aplicados.</p>
                    )}
                </div>

                {!isFiltered && totalPaginasPermisos > 1 && (
                    <Paginacion />
                )}
            </div>

            <div className="flex items-center justify-between mt-6">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition duration-150"
                    disabled={cargando || !!mensajeExito || !usuarioSeleccionado}
                >
                    {cargando ? 'Guardando...' : `Guardar ${permisosMarcados.length} Permiso(s)`}
                </button>
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-150"
                    disabled={cargando}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default AsignacionPermisoForm;