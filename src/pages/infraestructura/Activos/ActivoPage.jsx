import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../../hooks/useFiltroPaginado';
import { deleteActivo, exportarActivos, getActivosPaginados, getPrediccionesPorActivo } from '../../../services/api';
import ActivoForm from './ActivoForm';
import PrediccionForm from "./PrediccionForm";

const ActivoPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ActivoEditando, setActivoEditando] = useState(null);
    const [isPrediccionOpen, setIsPrediccionOpen] = useState(false);
    const [activoSeleccionado, setActivoSeleccionado] = useState(null);
    const [resultadoTemporal, setResultadoTemporal] = useState(null);
    const [predicciones, setPredicciones] = useState([]);
    const [cargandoPredicciones, setCargandoPredicciones] = useState(false);


    const {
        items: activos,
        cargando,
        error,
        searchTerm,
        setSearchTerm,
        estadoFiltro,
        setEstadoFiltro,
        paginaActual,
        setPaginaActual,
        tamanoPagina,
        setTamanoPagina,
        totalPaginas,
        fetchData,
        handleExport,
        handleNextPage,
        handlePrevPage,
        sortColumn,
        setSortColumn,
        sortDirection,
        setSortDirection
    } = useFiltroPaginado({
        fetchFunction: getActivosPaginados,
        exportFunction: exportarActivos
    });

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleCreate = () => {
        setActivoEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (activo) => {
        setActivoEditando(activo);
        setIsModalOpen(true);
    };

    const handleVerPredicciones = async (activo) => {
        setActivoSeleccionado(activo);
        setPredicciones([]);
        setIsPrediccionOpen(true);
        setCargandoPredicciones(true);

        try {
            const data = await getPrediccionesPorActivo(activo.idActivo);
            setPredicciones(data);
        } catch (err) {

            if (err.message.includes("No hay predicciones")) {
                setPredicciones([]);
            } else {
                alert("Error al cargar predicciones: " + err.message);
            }

        } finally {
            setCargandoPredicciones(false);
        }
    };


    const handleDelete = async (id, nombreIdentificador) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el activo "${nombreIdentificador}"? Esta acción es irreversible.`)) return;

        try {
            await deleteActivo(id);
            alert(`Activo "${nombreIdentificador}" eliminado con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (activoActualizado = false) => {
        setIsModalOpen(false);
        setActivoEditando(null);
        if (activoActualizado) fetchData(paginaActual);
    };

    const handleCerrar = () => {
        setPredicciones([]);
        setResultadoTemporal(null);
        setActivoSeleccionado(null);
        setIsPrediccionOpen(false);
    };



    // --- Renderizado Condicional ---
    if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Activos</h1>
            <div className="flex justify-between items-center">

                {/* CREAR NUEVO ACTIVO*/}
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
                    Nuevo Activo
                </button>

                {/* Cuadro de Búsqueda*/}
                <div className="flex items-center space-x-4">
                    <BuscadorDebounce className="w-64"
                        value={searchTerm}
                        onDebouncedChange={setSearchTerm}
                        placeholder="Buscar por Nombre..."
                    />

                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
                    >
                        <option value="">Todos</option>
                        <option value="Activo">Activos</option>
                        <option value="Inactivo">Inactivos</option>
                        <option value="Descartado">Descartados</option>
                    </select>

                    {/* EXPORTAR */}
                    <button
                        onClick={handleExport}
                        disabled={cargando}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center shadow disabled:opacity-50 transition duration-150"
                        title="Exportar toda la lista a Excel"
                    >
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Exportar
                    </button>

                    <select
                        value={tamanoPagina}
                        onChange={(e) => setTamanoPagina(Number(e.target.value))}
                        disabled={cargando}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
                    >
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                    </select>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {[

                                { title: 'Nombre', key: 'nombreIdentificador' },
                                { title: 'Tipo', key: 'nombreTipo' },
                                { title: 'Categoría', key: 'nombreCategoria' },
                                { title: 'Ubicación', key: 'descripcionUbicacion' },
                                { title: 'Sitio', key: 'descripcionSitio' },
                                { title: 'Propiedad Legal', key: 'nombrePropiedadLegal' },
                                { title: 'Estado', key: 'estado' }
                            ].map(({ title, key }) => (
                                <th key={key} className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">
                                    <div className="flex items-center space-x-1">
                                        <span>{title}</span>
                                        <button onClick={() => handleSort(key)} className="text-gray-400 hover:text-gray-600">
                                            {sortColumn === key ? (
                                                sortDirection === 'asc' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </th>
                            ))}

                            <th className="sticky top-0 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider z-10">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {cargando ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-6 text-center text-gray-500">
                                    Cargando...
                                </td>
                            </tr>
                        ) : activos.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron activos.
                                </td>
                            </tr>
                        ) : (
                            activos.map((a) => (
                                <tr key={a.idActivo}>

                                    <td className="px-6 py-4 text-sm text-gray-500">{a.nombreIdentificador}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{a.nombreTipo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{a.nombreCategoria}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{a.descripcionUbicacion}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{a.descripcionSitio}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{a.nombrePropiedadLegal}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{a.nombreEstado}</td>

                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-3">

                                            {/* EDITAR */}
                                            <button
                                                onClick={() => handleEdit(a)}
                                                className="text-indigo-600 hover:text-indigo-900 relative group"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                    Editar
                                                </span>
                                            </button>

                                            {/* ELIMINAR */}
                                            <button
                                                onClick={() => handleDelete(a.idActivo, a.nombreIdentificador)}
                                                className="text-red-600 hover:text-red-900 relative group"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                    Eliminar
                                                </span>
                                            </button>

                                            {/* Predicciones */}
                                            <button
                                                onClick={() => handleVerPredicciones(a)}
                                                className="text-green-600 hover:text-green-900 relative group"
                                            >
                                                📊
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 
       bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                    Predicciones
                                                </span>
                                            </button>

                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}

                    </tbody>
                </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200 space-x-1 flex-wrap">
                <button
                    onClick={handlePrevPage}
                    disabled={paginaActual === 1 || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-l disabled:opacity-50 transition duration-150"
                >
                    &lt;
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                    <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        className={`py-2 px-3 font-medium border ${num === paginaActual
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            } transition duration-150`}
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={handleNextPage}
                    disabled={paginaActual === totalPaginas || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50 transition duration-150"
                >
                    &gt;
                </button>
            </div>

            {/* MODAL DEL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
                        <ActivoForm
                            activo={ActivoEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}

            {/* Modal del formulario predicción */}
            {isPrediccionOpen && activoSeleccionado && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 flex justify-center items-center">
                    <div
                        key={activoSeleccionado?.idActivo}
                        className="bg-white p-4 rounded-lg shadow-2xl max-w-3xl w-full"
                    >
                        <h2 className="text-xl font-bold mb-4">
                            Predicciones del activo {activoSeleccionado?.nombreIdentificador}
                        </h2>

                        <PrediccionForm
                            key={activoSeleccionado?.idActivo}
                            idActivo={activoSeleccionado.idActivo}
                            onPrediccionGenerada={(resultado) => {
                                // Mostrar resultado calculado en un panel temporal
                                setResultadoTemporal(resultado);
                            }}
                            onPrediccionGuardada={(nueva) => {
                                setPredicciones([nueva, ...predicciones]);
                                setResultadoTemporal(null);
                            }}

                        />

                        {/* Panel temporal */}
                        {resultadoTemporal && (
                            <div
                                className={`mt-2 p-2 rounded-lg border transition-all duration-500 ease-in-out transform ${resultadoTemporal.clase === "falla"
                                    ? "bg-red-100 border-red-400"
                                    : "bg-green-100 border-green-400"
                                    }`}
                            >
                                <h3 className="font-semibold mb-1">
                                    Resultado calculado
                                </h3>

                                <p>
                                    <strong>Probabilidad:</strong>{" "}
                                    {(resultadoTemporal.probabilidadFalla * 100).toFixed(2)}%
                                </p>

                                <p>
                                    <strong>Clase:</strong>{" "}
                                    <span
                                        className={`px-2 py-1 rounded text-white text-sm font-semibold ${resultadoTemporal.clase === "falla"
                                            ? "bg-red-600"
                                            : "bg-green-600"
                                            }`}
                                    >
                                        {resultadoTemporal.clase === "falla"
                                            ? "FALLA DETECTADA"
                                            : "SIN FALLA"}
                                    </span>
                                </p>

                                <p>
                                    <strong>Umbral:</strong> {resultadoTemporal.umbral}
                                </p>
                            </div>
                        )}

                        {/* Historial */}

                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Historial</h3>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200 border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Probabilidad</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Predicción</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Clase</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Umbral</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Incidencias 30 días</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Días desde última</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uso Promedio</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cargandoPredicciones ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-4">
                                                    <div className="space-y-3">

                                                        {[...Array(tamanoPagina || 5)]
                                                            .map((_, i) => (
                                                                <div key={i} className="animate-pulse flex space-x-4">

                                                                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                                                                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                                                                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                                                                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                                                                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>

                                                                </div>
                                                            ))}

                                                    </div>
                                                </td>
                                            </tr>

                                        ) : predicciones.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                                                    Este activo aún no tiene predicciones guardadas.
                                                </td>
                                            </tr>
                                        ) : (

                                            predicciones.map((p) => (
                                                <tr key={p.idPrediccion}>
                                                    <td className="px-4 py-2 font-semibold">
                                                        {(p.probabilidadFalla * 100).toFixed(2)}%
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <span
                                                            className={`px-2 py-1 rounded text-white text-xs font-semibold ${p.prediccion ? "bg-red-600" : "bg-green-600"
                                                                }`}
                                                        >
                                                            {p.prediccion ? "FALLA" : "OK"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        <span
                                                            className={`px-2 py-1 rounded text-white text-xs font-semibold ${p.clase === "falla"
                                                                ? "bg-red-600"
                                                                : "bg-green-600"
                                                                }`}
                                                        >
                                                            {p.clase === "falla" ? "FALLA" : "SIN FALLA"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-2">{p.umbral}</td>
                                                    <td className="px-4 py-2">{p.numeroIncidencias30Dias}</td>
                                                    <td className="px-4 py-2">{p.diasDesdeUltimaIncidencia}</td>
                                                    <td className="px-4 py-2">{p.usoPromedio}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-500">
                                                        {new Date(p.fechaPrediccion).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Gráfico de evolución de probabilidades */}
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">Evolución de Predicciones</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={predicciones}>

                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="fechaPrediccion"
                                            tickFormatter={(d) => new Date(d).toLocaleDateString()}
                                        />

                                        <YAxis
                                            domain={[0, 1]}
                                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                        />

                                        <Tooltip
                                            labelFormatter={(d) => new Date(d).toLocaleString()}
                                            formatter={(value) => [`${(value * 100).toFixed(2)}%`, "Probabilidad"]}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="probabilidadFalla"
                                            fill="#3182CE"
                                        >
                                            {predicciones.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.clase === "falla" ? "#E53E3E" : "#38A169"}
                                                />
                                            ))}
                                        </Bar>

                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                        </div>

                        <button onClick={handleCerrar}>
                            Cerrar
                        </button>


                    </div>
                </div>
            )}

        </div>

    );
};

export default ActivoPage;
