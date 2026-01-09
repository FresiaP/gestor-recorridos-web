import { Autocomplete, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useEffect, useState } from 'react';
import {
    buscarDispositivosSelect,
    buscarUsuarioSelect,
    deleteIncidencia,
    exportarIncidencias,
    getIncidenciasPaginadas
} from '../../../services/api';
import IncidenciaForm from './IncidenciaForm';

const IncidenciaPage = () => {
    const [incidencias, setIncidencias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // --- ESTADOS PARA FILTROS AVANZADOS ---
    const [criterioBusqueda, setCriterioBusqueda] = useState("dispositivo");
    const [opcionesBusqueda, setOpcionesBusqueda] = useState([]);
    const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
    const [resueltas, setResueltas] = useState(null);

    // Estados de fecha
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incidenciaEditando, setIncidenciaEditando] = useState(null);

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
    const fetchIncidencia = useCallback(async (page) => {
        setCargando(true);
        setError(null);
        try {
            // Conversión de fechas para la API
            const fechaInicioParam = fechaInicio ? fechaInicio.toISOString().split('T')[0] : null;
            const fechaFinParam = fechaFin ? fechaFin.toISOString().split('T')[0] : null;
            const terminoBusqueda = elementoSeleccionado ? (elementoSeleccionado.nombre || elementoSeleccionado.label) : '';

            const data = await getIncidenciasPaginadas(
                page,
                tamanoPagina,
                terminoBusqueda,
                fechaInicioParam,
                fechaFinParam,
                resueltas,
            );

            setIncidencias(Array.isArray(data.datos) ? data.datos : []);
            setTotalPaginas(data.totalPaginas || 1);
        } catch (err) {
            setError(err.message || 'Fallo al cargar las incidecias paginadas.');
        } finally {
            setCargando(false);
        }
    }, [tamanoPagina, elementoSeleccionado, fechaInicio, fechaFin, resueltas]);

    // 3. EFECTO: Patrón de Búsqueda Automática (Live Filter)
    // Se ejecuta cuando cambia la página, o cuando cambia cualquiera de los filtros 
    // (ya que fetchConsumible depende de los filtros y useCallback recrea la función).
    useEffect(() => {
        fetchIncidencia(paginaActual);
    }, [paginaActual, fetchIncidencia]);

    // 4. EFECTO: Cuando cambian los filtros, volvemos a la página 1.
    useEffect(() => {
        setPaginaActual(1);
    }, [elementoSeleccionado, fechaInicio, fechaFin, tamanoPagina, resueltas]);


    // --- MANEJADORES DE ACCIÓN ---

    const handleExport = async () => {
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return;
        }

        try {
            await exportarIncidencias(
                elementoSeleccionado ? (elementoSeleccionado.nombre || elementoSeleccionado.label) : "",
                fechaInicio ? fechaInicio.toISOString().split("T")[0] : null,
                fechaFin ? fechaFin.toISOString().split("T")[0] : null,
                "rango",
                resueltas
            );
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };

    // Funciones CRUD
    const handleCreate = () => {
        setIncidenciaEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (incidecias) => {
        setIncidenciaEditando(incidecias);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la incidencia "${nombre}"?`)) {
            return;
        }
        try {
            await deleteIncidencia(id);
            alert(`Incidencia "${nombre}" eliminado con éxito.`);
            await fetchIncidencia(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (incidenciaActualizada = false) => {
        setIsModalOpen(false);
        setIncidenciaEditando(null);
        if (incidenciaActualizada) {
            fetchIncidencia(paginaActual);
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
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Incidencias</h1>

            <div className="flex flex-col gap-4">

                {/* FILA 1: BOTÓN CREAR */}
                <div className="flex justify-start items-center">
                    <button
                        onClick={handleCreate}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow transition duration-150"
                    >
                        ➕ Crear Nueva Incidencia
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

                            {/* Estado */}
                            <div className="flex flex-col"></div>
                            <label className="text-sm font-bold text-gray-700 mb-1">Estado</label>
                            <select
                                value={resueltas === null ? "" : resueltas ? "true" : "false"}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") setResueltas(null);
                                    else setResueltas(val === "true");
                                }}
                                className="border rounded px-3 py-2 h-[40px]"
                            >
                                <option value="">Todas</option>
                                <option value="true">Resueltas</option>
                                <option value="false">Pendientes</option>
                            </select>

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
                                setResueltas(null);
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Notificación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resuelto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {incidencias.map((i) => (
                                <tr key={i.idIncidencia}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{i.idIncidencia}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{i.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{i.descripcion}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{i.nombreApellido}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{i.fechaNotificacion?.slice(0, 10)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{i.detalle}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{i.resuelta ? "Sí" : "No"}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(i)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                                        <button onClick={() => handleDelete(i.idIncidencia, i.nombre)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {incidencias.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron incidencias con estos filtros.
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
                        <IncidenciaForm
                            incidencia={incidenciaEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div >
    );
};

export default IncidenciaPage;