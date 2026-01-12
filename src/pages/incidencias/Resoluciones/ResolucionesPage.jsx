import { ArrowsRightLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Autocomplete, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarDispositivosSelect,
    buscarIncidenciasSelect,
    buscarUsuarioSelect,
    deleteResolucion,
    exportarResoluciones,
    getResolucionesPaginadas,
    reasignarResolucion
} from '../../../services/api';
import ResolucionesForm from './ResolucionesForm';

const ResolucionPage = () => {
    const [resoluciones, setResoluciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // --- ESTADOS PARA FILTROS AVANZADOS ---
    const [criterioBusqueda, setCriterioBusqueda] = useState("dispositivo");
    const [opcionesBusqueda, setOpcionesBusqueda] = useState([]);
    const [elementoSeleccionado, setElementoSeleccionado] = useState(null);

    // Estados de fecha
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // modal Crear / editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ResolucionEditando, setResolucionEditando] = useState(null);

    // modal reasignar
    const [isReasignarOpen, setIsReasignarOpen] = useState(false);
    const [ResolucionReasignando, setResolucionReasignando] = useState(null);
    const [nuevaIncidencia, setNuevaIncidencia] = useState(null);

    // 1. EFECTO: Cargar la lista de opciones (Dispositivo vs Usuario)
    useEffect(() => {
        const cargarOpciones = async () => {
            setOpcionesBusqueda([]);
            setElementoSeleccionado(null);
            try {
                let data = [];
                if (criterioBusqueda === "dispositivo") {
                    data = await buscarDispositivosSelect();
                } else if (criterioBusqueda === "usuario") {
                    data = await buscarUsuarioSelect();
                }
                setOpcionesBusqueda(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error cargando opciones de búsqueda", error);
                setOpcionesBusqueda([]);
            }
        };
        cargarOpciones();
    }, [criterioBusqueda]);

    // 2. FUNCIÓN DE BÚSQUEDA PRINCIPAL (memoizada)
    // Se ejecuta con los filtros actuales
    const fetchResolucion = useCallback(async (page) => {
        setCargando(true);
        setError(null);
        try {
            // Conversión de fechas para la API
            const fechaInicioParam = fechaInicio ? fechaInicio.toISOString().split('T')[0] : null;
            const fechaFinParam = fechaFin ? fechaFin.toISOString().split('T')[0] : null;
            const terminoBusqueda = elementoSeleccionado ? (elementoSeleccionado.nombre || elementoSeleccionado.label) : '';

            const data = await getResolucionesPaginadas(
                page,
                tamanoPagina,
                terminoBusqueda,
                fechaInicioParam,
                fechaFinParam,
            );

            setResoluciones(Array.isArray(data.datos) ? data.datos : []);
            setTotalPaginas(data.totalPaginas || 1);
        } catch (err) {
            setError(err.message || 'Fallo al cargar los resoluciones paginadas.');
        } finally {
            setCargando(false);
        }
    }, [tamanoPagina, elementoSeleccionado, fechaInicio, fechaFin]);

    // 3. EFECTO: Patrón de Búsqueda Automática (Live Filter)
    // Se ejecuta cuando cambia la página, o cuando cambia cualquiera de los filtros 
    // (ya que fetchConsumible depende de los filtros y useCallback recrea la función).
    useEffect(() => {
        fetchResolucion(paginaActual);
    }, [paginaActual, fetchResolucion]);

    // 4. EFECTO: Cuando cambian los filtros, volvemos a la página 1.
    useEffect(() => {
        setPaginaActual(1);
    }, [elementoSeleccionado, fechaInicio, fechaFin, tamanoPagina]);


    // --- MANEJADORES DE CRUD ---
    // Funciones CRUD
    const handleCreate = () => {
        setResolucionEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (resoluciones) => {
        setResolucionEditando(resoluciones);
        setIsModalOpen(true);
    };

    const handleExport = async () => {
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return;
        }

        try {
            await exportarResoluciones({
                query: elementoSeleccionado ? (elementoSeleccionado.nombre || elementoSeleccionado.label) : "",
                fechaInicio: fechaInicio ? fechaInicio.toISOString().split("T")[0] : null,
                fechaFin: fechaFin ? fechaFin.toISOString().split("T")[0] : null
            });
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };


    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la resolución "${nombre}"?`)) {
            return;
        }
        try {
            await deleteResolucion(id);
            alert(`Resolucion "${nombre}" eliminado con éxito.`);
            await fetchResolucion(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (resolucionActualizada = false) => {
        setIsModalOpen(false);
        setResolucionEditando(null);
        if (resolucionActualizada) {
            fetchResolucion(paginaActual);
        }
    };

    // Reasignar
    const handleOpenReasignar = (resolucion) => {
        setResolucionReasignando(resolucion);
        setIsReasignarOpen(true);
    };

    const handleConfirmReasignar = async () => {
        if (!ResolucionReasignando || !nuevaIncidencia) return;
        try {
            const resultado = await reasignarResolucion(ResolucionReasignando.idResolucion, nuevaIncidencia.value);
            alert(resultado);
            setIsReasignarOpen(false);
            setResolucionReasignando(null);
            setNuevaIncidencia(null);
            fetchResolucion(paginaActual);
        } catch (err) {
            alert(`Error al reasignar: ${err.message}`);
        }
    };

    // --- FUNCIONES DE PAGINACIÓN ---
    const handleNextPage = () => {
        if (paginaActual < totalPaginas) {
            setPaginaActual(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) {
            setPaginaActual(prev => prev - 1);
        }
    };
    // -------------------------------

    // Renderizado Condicional de Error
    if (error) { return (<div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>); }

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Resoluciones</h1>

            <div className="flex flex-col gap-4">

                {/* FILA 1: BOTÓN CREAR */}
                <div className="flex justify-start items-center">
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
             text-white font-medium px-5 py-2.5 rounded-lg shadow-md 
             transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Nueva resolución
                    </button>
                </div>

                {/* FILA 2: TODOS LOS FILTROS Y BOTONES (Diseño compacto) */}
                <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">

                    {/* 1. COMBOBOX PRINCIPAL: Buscar por (Alineado con su label) */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700 font-medium whitespace-nowrap">Buscar por:</label>
                        <select
                            value={criterioBusqueda}
                            onChange={(e) => setCriterioBusqueda(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm bg-white h-[40px] min-w-[120px]"
                        >
                            <option value="dispositivo">Dispositivo</option>
                            <option value="usuario">Usuario</option>
                        </select>
                    </div>

                    {/* 2. AUTOCOMPLETE: Selector de Dispositivo o Usuario (Tamaño fijo) */}
                    <div className="w-56">
                        <Autocomplete
                            options={opcionesBusqueda}
                            getOptionLabel={(option) => option.nombre || option.label || ""}
                            value={elementoSeleccionado}
                            // El cambio de estado aquí dispara automáticamente la búsqueda via useEffect
                            onChange={(event, newValue) => {
                                setElementoSeleccionado(newValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={`Seleccionar ${criterioBusqueda === 'dispositivo' ? 'Dispositivo' : 'Usuario'}`}
                                    variant="outlined"
                                    size="small"
                                    placeholder={`Escribe para buscar ${criterioBusqueda}...`}
                                />
                            )}
                            noOptionsText="No se encontraron registros"
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            disabled={cargando}
                        />
                    </div>

                    {/* 3. SELECTORES DE FECHA */}
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <div className="flex items-center gap-2">
                            <DatePicker
                                value={fechaInicio}
                                // El cambio de estado aquí dispara automáticamente la búsqueda via useEffect
                                onChange={(date) => setFechaInicio(date)}
                                dateFormat="yyyy-MM-dd"
                                label="Desde"
                                slotProps={{ textField: { size: "small", className: "w-36" } }}
                            />
                            <DatePicker
                                value={fechaFin}
                                // El cambio de estado aquí dispara automáticamente la búsqueda via useEffect
                                onChange={(date) => setFechaFin(date)}
                                dateFormat="yyyy-MM-dd"
                                label="Hasta"
                                slotProps={{ textField: { size: "small", className: "w-36" } }}
                            />
                        </div>
                    </LocalizationProvider>

                    {/* 4. BOTONES Y SELECTOR DE FILAS */}
                    <div className="flex items-center gap-2 ml-auto">

                        <button
                            onClick={() => {
                                // Limpia todos los estados, lo que automáticamente dispara la nueva búsqueda (sin filtros)
                                setElementoSeleccionado(null);
                                setFechaInicio(null);
                                setFechaFin(null);
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 h-[40px] whitespace-nowrap"
                        >
                            Limpiar
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={cargando}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow disabled:opacity-50 h-[40px] whitespace-nowrap"
                            title="Exportar"
                        >
                            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar
                        </button>

                        {/* Selector de tamaño de página */}
                        <select
                            value={tamanoPagina}
                            onChange={(e) => setTamanoPagina(Number(e.target.value))}
                            disabled={cargando}
                            className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm h-[40px] min-w-[90px]"
                        >
                            <option value={10}>10 filas</option>
                            <option value={25}>25 filas</option>
                            <option value={50}>50 filas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-lg mt-6">
                {cargando ? (
                    <div className="p-12 text-center text-gray-500">Cargando datos...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispositivo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle Incidencia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Resolución</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiempo (días)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentarios</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {resoluciones.map((r) => (
                                <tr key={r.idResolucion}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.idResolucion}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.descripcion}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.detalle}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.fechaResolucion?.slice(0, 10)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.tiempoResolucionDias}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.comentarios}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{r.nombreApellido}</td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3"></div>

                                        {/* EDITAR */}
                                        <button onClick={() => handleEdit(r)}
                                            className="text-indigo-600 hover:text-indigo-900 relative group"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                               bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                Editar
                                            </span>
                                        </button>

                                        {/* REASIGNAR */}
                                        <button onClick={() => handleOpenReasignar(r)} className="text-yellow-600 hover:text-yellow-900 relative group"
                                        >
                                            <ArrowsRightLeftIcon className="h-5 w-5" />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2
                                             bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100"
                                            >
                                                Reasignar
                                            </span>
                                        </button>

                                        {/* ELIMINAR */}
                                        <button onClick={() => handleDelete(r.idResolucion)} className="text-red-600 hover:text-red-900 relative group"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                               bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                Eliminar
                                            </span>
                                        </button>

                                    </td>
                                </tr>
                            ))}
                            {resoluciones.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron consumibles con estos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200 space-x-1 flex-wrap">
                <button
                    onClick={handlePrevPage}
                    disabled={paginaActual === 1 || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-l disabled:opacity-50"
                >
                    &lt;
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                    Página {paginaActual} de {totalPaginas}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={paginaActual === totalPaginas || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50"
                >
                    &gt;
                </button>
            </div>

            {/* MODAL Crear / Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
                        <ResolucionesForm
                            resolucion={ResolucionEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}

            {/* Modal Reasignar */}
            {isReasignarOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 flex justify-center items-center">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Reasignar Resolución</h2>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={async (inputValue) => {
                                const opciones = await buscarIncidenciasSelect(inputValue, 1, 50);
                                console.log("Opciones recibidas:", opciones);
                                return opciones;
                            }}
                            value={nuevaIncidencia}
                            onChange={setNuevaIncidencia}
                            placeholder="Selecciona nueva incidencia..."
                            isClearable
                        />
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => setIsReasignarOpen(false)}
                                className="bg-gray-500 text-white px-3 py-1 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmReasignar}
                                className="bg-green-600 text-white px-3 py-1 rounded"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ResolucionPage;