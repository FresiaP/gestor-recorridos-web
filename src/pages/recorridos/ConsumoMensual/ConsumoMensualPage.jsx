import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Autocomplete, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useEffect, useState } from 'react';
import {
    buscarDispositivosSelect,
    buscarSitiosSelect,
    deleteConsumoMensual,
    exportarConsumosMensuales,
    getConsumosMensualesPaginados
} from '../../../services/api';
import ConsumoMensualForm from './ConsumoMensualForm';

const ConsumoMensualPage = () => {
    const [consumosMensuales, setConsumosMensuales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // --- ESTADOS PARA FILTROS ---
    const [criterioBusqueda, setCriterioBusqueda] = useState("dispositivo");
    const [opcionesBusqueda, setOpcionesBusqueda] = useState([]);
    const [elementoSeleccionado, setElementoSeleccionado] = useState(null);

    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [consumoEditando, setConsumoEditando] = useState(null);

    // Cargar opciones según criterio
    useEffect(() => {
        const cargarOpciones = async () => {
            setOpcionesBusqueda([]);
            setElementoSeleccionado(null);
            try {
                let data = [];
                if (criterioBusqueda === "dispositivo") {
                    data = await buscarDispositivosSelect();
                } else if (criterioBusqueda === "sitio") {
                    data = await buscarSitiosSelect();
                }
                setOpcionesBusqueda(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error cargando opciones de búsqueda", error);
                setOpcionesBusqueda([]);
            }
        };
        cargarOpciones();
    }, [criterioBusqueda]);

    const fetchConsumosMensuales = useCallback(async (page) => {
        setCargando(true);
        setError(null);
        try {
            const fechaInicioParam = fechaInicio ? fechaInicio.toISOString().split('T')[0] : '';
            const fechaFinParam = fechaFin ? fechaFin.toISOString().split('T')[0] : '';
            const terminoBusqueda = elementoSeleccionado ? (elementoSeleccionado.nombre || elementoSeleccionado.label) : '';


            const data = await getConsumosMensualesPaginados(
                Number(page),
                tamanoPagina,
                terminoBusqueda,
                fechaInicioParam,
                fechaFinParam,
                '',
                'asc'
            );

            setConsumosMensuales(Array.isArray(data.datos) ? data.datos : []);
            setTotalPaginas(data.totalPaginas || 1);
        } catch (err) {
            setError(err.message || 'Fallo al cargar los consumos mensuales.');
        } finally {
            setCargando(false);
        }
    }, [tamanoPagina, elementoSeleccionado, fechaInicio, fechaFin]);



    useEffect(() => {
        fetchConsumosMensuales(paginaActual);
    }, [paginaActual, fetchConsumosMensuales]);

    useEffect(() => {
        setPaginaActual(1);
    }, [elementoSeleccionado, fechaInicio, fechaFin, tamanoPagina]);

    const handleExport = async () => {
        try {
            const fechaInicioParam = fechaInicio ? fechaInicio.toISOString().split("T")[0] : "";
            const fechaFinParam = fechaFin ? fechaFin.toISOString().split("T")[0] : "";
            const terminoBusqueda = elementoSeleccionado ? (elementoSeleccionado.nombre || elementoSeleccionado.label) : "";

            await exportarConsumosMensuales({
                query: terminoBusqueda,
                sortColumn: "",
                sortDirection: "asc",
                fechaInicio: fechaInicioParam,
                fechaFin: fechaFinParam
            });
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };


    const handleCreate = () => {
        setConsumoEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (consumo) => {
        setConsumoEditando(consumo);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, nombreIdentificador) => {
        if (!window.confirm(`¿Eliminar consolidado de "${nombreIdentificador}"?`)) return;
        try {
            await deleteConsumoMensual(id);
            alert(`Consolidado eliminado con éxito.`);
            await fetchConsumosMensuales(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (actualizado = false) => {
        setIsModalOpen(false);
        setConsumoEditando(null);
        if (actualizado) fetchConsumosMensuales(paginaActual);
    };

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

    // --- RENDER ---
    if (error) {
        return (
            <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
                Gestión de Consumos Mensuales
            </h1>

            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
                >
                    Generar Consumo del mes
                </button>
            </div>

            {/* FILTROS */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 font-medium whitespace-nowrap">Buscar por:</label>
                    <select
                        value={criterioBusqueda}
                        onChange={(e) => setCriterioBusqueda(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm bg-white h-[40px] min-w-[120px]"
                    >
                        <option value="dispositivo">Dispositivo</option>
                        <option value="sitio">Sitio</option>
                    </select>
                </div>

                <div className="w-56">
                    <Autocomplete
                        options={opcionesBusqueda}
                        getOptionLabel={(option) => option.nombre || option.label || ""}
                        value={elementoSeleccionado}
                        onChange={(event, newValue) => setElementoSeleccionado(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={`Seleccionar ${criterioBusqueda === 'dispositivo' ? 'Dispositivo' : 'Sitio'}`}
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

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={fechaInicio}
                            onChange={(date) => setFechaInicio(date)}
                            label="Desde"
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                        />
                        <DatePicker
                            value={fechaFin}
                            onChange={(date) => setFechaFin(date)}
                            label="Hasta"
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                        />
                    </div>
                </LocalizationProvider>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => {
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
                        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
                    >
                        Exportar
                    </button>

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

            {/* TABLA DE DATOS*/}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
                {cargando ? (
                    <div className="p-12 text-center text-gray-500">Cargando datos...</div>
                ) : (
                    <table className="min-w-full table-auto text-sm text-left">
                        <thead className="bg-blue-800 text-white">
                            <tr>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border z-10">Impresora</th>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border">Serie</th>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border">Modelo</th>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border">Ubicación</th>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border">Sitio</th>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border">Fecha Corte</th>
                                <th colSpan="3" className="sticky top-0 bg-gray-700 px-4 py-2 border text-center z-10">Consumo B/N</th>
                                <th colSpan="3" className="sticky top-0 bg-blue-700 px-4 py-2 border text-center">Consumo Color</th>
                                <th rowSpan="2" className="sticky top-0 bg-blue-800 px-4 py-2 border text-center">Acciones</th>
                            </tr>
                            <tr className="bg-gray-100 text-gray-800">
                                <th className="sticky top-[2.3rem] bg-gray-100 px-2 py-1 border z-10">Inicial</th>
                                <th className="sticky top-[2.3rem] bg-gray-100 px-2 py-1 border z-10">Final</th>
                                <th className="sticky top-[2.3rem] bg-yellow-100 px-2 py-1 border z-10">Total</th>
                                <th className="sticky top-[2.3rem] bg-gray-100 px-2 py-1 border z-10">Inicial</th>
                                <th className="sticky top-[2.3rem] bg-gray-100 px-2 py-1 border z-10">Final</th>
                                <th className="sticky top-[2.3rem] bg-yellow-100 px-2 py-1 border z-10">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumosMensuales.map((c) => (
                                <tr key={c.idConsumoMensual} className="hover:bg-gray-50 border-b">
                                    <td className="px-4 py-2">{c.nombreIdentificador}</td>
                                    <td className="px-4 py-2 font-mono">{c.serie}</td>
                                    <td className="px-4 py-2">{c.descripcionModelo}</td>
                                    <td className="px-4 py-2">{c.descripcionUbicacion}</td>
                                    <td className="px-4 py-2">{c.descripcionSitio}</td>
                                    <td className="px-4 py-2">{c.fechaCorte?.slice(0, 10)}</td>

                                    {/* Datos B/N */}
                                    <td className="px-4 py-2 text-right">{c.contadorInicialMono}</td>
                                    <td className="px-4 py-2 text-right">{c.contadorFinalMono}</td>
                                    <td className="px-4 py-2 text-right font-bold text-blue-700">{c.totalMono}</td>

                                    {/* Datos Color */}
                                    <td className="px-4 py-2 text-right">{c.contadorInicialColor}</td>
                                    <td className="px-4 py-2 text-right">{c.contadorFinalColor}</td>
                                    <td className="px-4 py-2 text-right font-bold text-green-700">{c.totalColor}</td>

                                    {/* Acciones */}
                                    <td className="px-4 py-2 text-right flex gap-2 justify-end">
                                        <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(c.idConsumoMensual, c.nombreIdentificador)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {consumosMensuales.length === 0 && (
                                <tr>
                                    <td colSpan="13" className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron consumos mensuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-200 font-bold">
                            <tr>
                                <td colSpan="6" className="px-4 py-2 text-right text-lg">TOTAL GENERAL:</td>
                                <td colSpan="2"></td>
                                <td className="px-4 py-2 text-right text-blue-800 text-lg">
                                    {consumosMensuales.reduce((acc, curr) => acc + (curr.totalMono ?? 0), 0).toLocaleString()}
                                </td>
                                <td colSpan="2"></td>
                                <td className="px-4 py-2 text-right text-green-800 text-lg">
                                    {consumosMensuales.reduce((acc, curr) => acc + (curr.totalColor ?? 0), 0).toLocaleString()}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
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
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 flex justify-center items-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
                        <ConsumoMensualForm
                            consumoMensual={consumoEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsumoMensualPage;
