import { TrashIcon } from '@heroicons/react/24/outline';
import { Autocomplete, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback, useEffect, useState } from 'react';
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import {
    buscarDispositivosSelect,
    buscarSitiosSelect,
    deleteConsumoMensual,
    exportarConsumosMensuales,
    getConsumosMensualesPaginados,
    obtenerReporteConsumosMensuales
} from '../../../services/api';
import ConsumoMensualForm from './ConsumoMensualForm';

const formatDate = (date) =>
    date instanceof Date && !isNaN(date)
        ? date.toISOString().split("T")[0]
        : null;

const ConsumoMensualPage = () => {
    const [consumosMensuales, setConsumosMensuales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);


    const [criterioBusqueda, setCriterioBusqueda] = useState("dispositivo");
    const [opcionesBusqueda, setOpcionesBusqueda] = useState([]);
    const [filtros, setFiltros] = useState({
        query: '',
        fechaInicio: null,
        fechaFin: null,
        idDispositivo: null,
        idSitio: null
    });

    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cargar opciones según criterio
    useEffect(() => {
        const cargarOpciones = async () => {
            setOpcionesBusqueda([]);
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
        try {
            const data = await getConsumosMensualesPaginados({
                pagina: page,
                tamano: tamanoPagina,
                query: filtros.query,
                fechaInicio: formatDate(filtros.fechaInicio),
                fechaFin: formatDate(filtros.fechaFin),
                idDispositivo: filtros.idDispositivo || undefined,
                idSitio: filtros.idSitio || undefined
            });

            setConsumosMensuales(data.datos || []);
            setTotalPaginas(data.totalPaginas || 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, [tamanoPagina, filtros]);

    useEffect(() => {
        fetchConsumosMensuales(paginaActual);
    }, [paginaActual, fetchConsumosMensuales]);

    // Exportar a Excel
    const handleExport = async () => {
        try {
            await exportarConsumosMensuales({
                query: filtros.query,
                fechaInicio: filtros.fechaInicio,
                fechaFin: filtros.fechaFin,
                idDispositivo: filtros.idDispositivo,
                idSitio: filtros.idSitio
            });
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };

    // Exportar a PDF
    const exportarPDF = (reporte) => {
        const doc = new jsPDF("landscape");

        const fechaInicio = reporte.fechaCorteAnterior
            ? new Date(reporte.fechaCorteAnterior).toLocaleDateString()
            : "Inicio";

        const fechaFin = reporte.fechaCorteActual
            ? new Date(reporte.fechaCorteActual).toLocaleDateString()
            : "Actual";

        // Título
        doc.setFontSize(16);
        doc.text(`Consumos Mensuales del ${fechaInicio} al ${fechaFin}`, 14, 15);

        // Encabezados
        const columnas = [
            "Impresora", "Serie", "Modelo", "Ubicación", "Sitio", "Fecha Corte",
            "Inicial B/N", "Final B/N", "Total B/N",
            "Inicial Color", "Final Color", "Total Color"
        ];

        const filas = reporte.registros.map(item => [
            item.nombreIdentificador,
            item.serie,
            item.descripcionModelo,
            item.descripcionUbicacion,
            item.descripcionSitio,
            item.fechaCorte?.slice(0, 10),
            item.contadorInicialMono,
            item.contadorFinalMono,
            item.totalMono,
            item.contadorInicialColor,
            item.contadorFinalColor,
            item.totalColor
        ]);

        // Totales como fila extra (tfoot)
        filas.push([
            { content: "TOTAL GENERAL:", colSpan: 6, styles: { halign: "left", fontStyle: "bold" } },
            "", "",
            { content: reporte.totalMono.toLocaleString(), styles: { halign: "left", fontStyle: "bold", textColor: [30, 64, 175] } },
            "", "",
            { content: reporte.totalColor.toLocaleString(), styles: { halign: "left", fontStyle: "bold", textColor: [22, 163, 74] } }
        ]);

        autoTable(doc, {
            startY: 25,
            head: [columnas],
            body: filas,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] }
        });

        doc.save("consumos_mensuales.pdf");
    };

    const handleExportPDF = async () => {
        try {

            const reporte = await obtenerReporteConsumosMensuales(filtros);

            exportarPDF(reporte);

        } catch (err) {

            alert(`Error generando reporte PDF: ${err.message}`);

        }
    };

    const handleCreate = () => setIsModalOpen(true);

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
        if (actualizado) fetchConsumosMensuales(paginaActual);
    };

    const handleNextPage = () => {
        if (paginaActual < totalPaginas) setPaginaActual(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) setPaginaActual(prev => prev - 1);
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
        <div className="p-12">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Consumos Mensuales</h1>

            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
                >
                    Generar Consumo del mes
                </button>
            </div>

            {/* Cuadro de Búsqueda */}
            <BuscadorDebounce
                className="w-64"
                value={filtros.query}
                onDebouncedChange={(value) => {

                    if (value === filtros.query) return; // 👈 evita rebote

                    setSelectedOption(null);

                    setFiltros(prev => ({
                        ...prev,
                        query: value,
                        idDispositivo: null,
                        idSitio: null
                    }));

                    setPaginaActual(1);
                }}
                placeholder="Buscar por Sitio, Dispositivo..."
            />


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
                        getOptionLabel={(option) => option.label}
                        value={selectedOption}
                        onChange={(event, newValue) => {

                            setSelectedOption(newValue);

                            setFiltros(prev => ({
                                ...prev,
                                query: '', // 👈 limpia texto SIEMPRE
                                idDispositivo: criterioBusqueda === "dispositivo" && newValue ? newValue.value : null,
                                idSitio: criterioBusqueda === "sitio" && newValue ? newValue.value : null
                            }));

                            setPaginaActual(1); // 👈 importante
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label={`Buscar por ${criterioBusqueda}`} />
                        )}
                    />


                </div>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={filtros.fechaInicio}
                            onChange={(date) => setFiltros(prev => ({ ...prev, fechaInicio: date }))}
                            label="Desde"
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                        />
                        <DatePicker
                            value={filtros.fechaFin}
                            onChange={(date) => setFiltros(prev => ({ ...prev, fechaFin: date }))}
                            label="Hasta"
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                        />
                    </div>
                </LocalizationProvider>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setFiltros({ query: '', fechaInicio: null, fechaFin: null, idDispositivo: null, idSitio: null })}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 h-[40px] whitespace-nowrap"
                    >
                        Limpiar
                    </button>
                    {/* Exportar a PDF */}
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700"
                        onClick={handleExportPDF}
                    >
                        Exportar PDF
                    </button>

                    {/* Exportar a Excel */}
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

            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
                {cargando ? (
                    <div className="p-12 text-center text-gray-500">Cargando datos...</div>
                ) : (
                    <table className="min-w-full table-auto text-sm text-left">
                        <thead className="bg-blue-800 text-white">
                            <tr>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border z-10">Impresora</th>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border">Serie</th>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border">Modelo</th>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border">Ubicación</th>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border">Sitio</th>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border">Fecha Corte</th>
                                <th colSpan={3} className="sticky top-0 bg-gray-700 px-4 py-2 border text-center z-10">Consumo B/N</th>
                                <th colSpan={3} className="sticky top-0 bg-blue-700 px-4 py-2 border text-center">Consumo Color</th>
                                <th rowSpan={2} className="sticky top-0 bg-blue-800 px-4 py-2 border text-center">Acciones</th>
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
                                    <td className="px-4 py-2 text-right">{c.contadorInicialMono}</td>
                                    <td className="px-4 py-2 text-right">{c.contadorFinalMono}</td>
                                    <td className="px-4 py-2 text-right font-bold text-blue-700">{c.totalMono}</td>
                                    <td className="px-4 py-2 text-right">{c.contadorInicialColor}</td>
                                    <td className="px-4 py-2 text-right">{c.contadorFinalColor}</td>
                                    <td className="px-4 py-2 text-right font-bold text-green-700">{c.totalColor}</td>
                                    <td className="px-4 py-2 text-right flex gap-2 justify-end">
                                        <button onClick={() => handleDelete(c.idConsumoMensual, c.nombreIdentificador)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {consumosMensuales.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron consumos mensuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-200 font-bold">
                            <tr>
                                <td colSpan={6} className="px-4 py-2 text-right text-lg">TOTAL GENERAL:</td>
                                <td colSpan={2}></td>
                                <td className="px-4 py-2 text-right text-blue-800 text-lg">
                                    {consumosMensuales.reduce((acc, curr) => acc + (curr.totalMono ?? 0), 0).toLocaleString()}
                                </td>
                                <td colSpan={2}></td>
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
                        <ConsumoMensualForm onClose={handleCloseModal} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsumoMensualPage;