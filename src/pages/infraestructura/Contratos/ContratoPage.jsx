import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useEffect, useState } from 'react';
import { FaSync } from "react-icons/fa";
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import { deleteContrato, exportarContratos, getContratosPaginadas, recalcularEstadosContratos } from '../../../services/api';
import ContratoForm from './ContratoForm';

const ContratosPage = () => {
    const [mensaje, setMensaje] = useState(null);

    const [contratos, setContratos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [tipoBusquedaFecha, setTipoBusquedaFecha] = useState("texto");

    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contratoEditando, setContratoEditando] = useState(null);



    const fetchContratos = useCallback(async (page) => {
        setCargando(true);
        setError(null);
        try {
            const fechaInicioParam =
                tipoBusquedaFecha === 'inicio' ? fechaInicio?.toISOString().split('T')[0] : null;
            const fechaFinParam =
                tipoBusquedaFecha === 'inicio' ? fechaFin?.toISOString().split('T')[0] : null;

            const fechaInicioFinParam =
                tipoBusquedaFecha === 'fin' ? fechaInicio?.toISOString().split('T')[0] : null;
            const fechaFinFinParam =
                tipoBusquedaFecha === 'fin' ? fechaFin?.toISOString().split('T')[0] : null;

            console.log('Buscando contratos con:', {
                tipoBusquedaFecha,
                fechaInicio: fechaInicio?.toISOString().split('T')[0],
                fechaFin: fechaFin?.toISOString().split('T')[0],
            });

            const data = await getContratosPaginadas(
                page,
                tamanoPagina,
                searchTerm || '',
                tipoBusquedaFecha === 'inicio' ? fechaInicioParam : fechaInicioFinParam,
                tipoBusquedaFecha === 'inicio' ? fechaFinParam : fechaFinFinParam
            );

            setContratos(Array.isArray(data.datos) ? data.datos : []);
            setTotalPaginas(data.totalPaginas || 1);
        } catch (err) {
            setError(err.message || 'Fallo al cargar los contratos paginados.');
        } finally {
            setCargando(false);
        }
    }, [tamanoPagina, searchTerm, fechaInicio, fechaFin, tipoBusquedaFecha]);

    useEffect(() => {
        setPaginaActual(1);
    }, [searchTerm, fechaInicio, fechaFin]);

    useEffect(() => {
        fetchContratos(paginaActual);
    }, [paginaActual, fetchContratos]);

    useEffect(() => {
        // Limpiar campos según el tipo de búsqueda
        if (tipoBusquedaFecha === "texto") {
            setFechaInicio(null);
            setFechaFin(null);
        } else {
            setSearchTerm("");
        }
    }, [tipoBusquedaFecha]);

    useEffect(() => {
        setPaginaActual(1);
    }, [tipoBusquedaFecha]);

    const handleExport = async () => {
        if (
            (tipoBusquedaFecha === "inicio" || tipoBusquedaFecha === "fin") &&
            fechaInicio &&
            fechaFin &&
            fechaInicio > fechaFin
        ) {
            alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return;
        }

        try {
            await exportarContratos({
                query: tipoBusquedaFecha === "texto" ? searchTerm?.trim() || "" : "",
                fechaInicio:
                    tipoBusquedaFecha !== "texto"
                        ? fechaInicio?.toISOString().split("T")[0]
                        : null,
                fechaFin:
                    tipoBusquedaFecha !== "texto"
                        ? fechaFin?.toISOString().split("T")[0]
                        : null,
                tipoBusquedaFecha,
            });
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };

    const handleCreate = () => {
        setContratoEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (contrato) => {
        setContratoEditando(contrato);
        setIsModalOpen(true);
    };


    const handleDelete = async (id, numeroContrato) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el contrato "${numeroContrato}"? Esta acción es irreversible.`)) {
            return;
        }
        try {
            await deleteContrato(id);
            alert(`Contrato "${numeroContrato}" eliminado con éxito.`);
            await fetchContratos();
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (contratoActualizado = false) => {
        setIsModalOpen(false);
        setContratoEditando(null);
        if (contratoActualizado) {
            fetchContratos();
        }
    };

    const handleNextPage = () => {
        if (paginaActual < totalPaginas) setPaginaActual(p => p + 1);
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) setPaginaActual(p => p - 1);
    };

    const recalcularEstados = async () => {
        try {
            const response = await recalcularEstadosContratos();
            setMensaje(response.mensaje);

            // refrescar la lista de contratos 
            fetchContratos(paginaActual);
        } catch (error) {
            console.error("Error al recalcular estados:", error);
            setMensaje("Error al recalcular estados");
        }
    };


    // --- Renderizado Condicional ---
    if (cargando) { return (<div className="p-12 text-gray-500">Cargando contratos...</div>); }
    if (error) { return (<div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>); }

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Contratos</h1>
            <div className="flex justify-between items-center">

                {/* CREAR NUEVO CONTRATO */}
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
                    Crear Nuevo Contrato
                </button>


                <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm text-gray-700 font-medium">Buscar por:</label>
                    <select
                        value={tipoBusquedaFecha}
                        onChange={(e) => setTipoBusquedaFecha(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
                    >
                        <option value="texto">Buscar por texto</option>
                        <option value="inicio">Fecha de inicio</option>
                        <option value="fin">Fecha de fin</option>
                    </select>

                    {tipoBusquedaFecha === "texto" && (
                        <BuscadorDebounce
                            value={searchTerm}
                            onDebouncedChange={(val) => setSearchTerm(val)}
                            disabled={cargando}
                            placeholder="Buscar por número, proveedor, estado, fecha..."
                        />
                    )}

                    {(tipoBusquedaFecha === "inicio" || tipoBusquedaFecha === "fin") && (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-600">Desde:</label>
                                    <DatePicker
                                        value={fechaInicio}
                                        onChange={(date) => setFechaInicio(date)}
                                        dateFormat="yyyy-MM-dd"
                                        placeholderText="Fecha desde"
                                        slotProps={{ textField: { size: "small" } }}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-600">Hasta:</label>
                                    <DatePicker
                                        value={fechaFin}
                                        onChange={(date) => setFechaFin(date)}
                                        dateFormat="yyyy-MM-dd"
                                        placeholderText="Fecha hasta"
                                        slotProps={{ textField: { size: "small" } }}
                                    />
                                </div>
                            </div>
                        </LocalizationProvider>
                    )}

                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFechaInicio(null);
                            setFechaFin(null);
                            setTipoBusquedaFecha('texto');
                            fetchContratos(1);
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300"
                    >
                        Limpiar filtros
                    </button>

                    {/* EXPORTAR*/}
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

            {/* ACTUALIZAR ESTADOS */}
            <button
                onClick={recalcularEstados}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 
             text-white font-medium px-5 py-2.5 rounded-lg shadow-md 
             transition-all duration-200 ease-in-out transform hover:scale-105 ml-4"
            >
                <FaSync className="h-5 w-5" />
                Actualizar Estados
            </button>


            {mensaje && (
                <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                    {mensaje}
                </div>
            )}


            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-lg mt-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Fin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impresiones /C BW</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impresiones /C C.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Exc BW</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Exc C.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contratos.map((c) => (
                            <tr key={c.idContrato}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.idContrato}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.nombreProveedor}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.numeroContrato}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.montoContrato}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.detalles}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.fechaInicio?.slice(0, 10)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.fechaFin?.slice(0, 10)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.detalleImpresion?.bolsonImpresionesCopiasBw ?? '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.detalleImpresion?.bolsonImpresionesCopiasColor ?? '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.detalleImpresion?.costoExcedenteBw ?? '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.detalleImpresion?.costoExcedenteColor ?? '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{c.nombreEstado}</td>


                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-3">
                                    <button
                                        onClick={() => handleEdit(c)}
                                        className="text-indigo-600 hover:text-indigo-900 relative group"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                        bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                            Editar
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => handleDelete(c.idContrato, c.numeroContrato)}
                                        className="text-red-600 hover:text-red-900 relative group"
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
                        {contratos.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron contratos.
                                </td>
                            </tr>
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
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full transform transition duration-300 scale-100 opacity-100">
                            <ContratoForm
                                contrato={contratoEditando}
                                onClose={handleCloseModal}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ContratosPage;
