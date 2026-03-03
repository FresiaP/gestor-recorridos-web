import {
    Autocomplete,
    Box,
    CircularProgress,
    TextField
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    buscarContratosSelect,
    buscarProveedoresSelect,
    eliminarToken,
    exportarVencimientoContratos,
    getVencimientoContratos
} from '../../services/api';

const ReporteVencimientoPage = () => {
    // --- ESTADOS DE DATOS ---
    const [reporteData, setReporteData] = useState([]);
    const [contratos, setContratos] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // --- ESTADOS DE UI ---
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    // --- ESTADOS DE FILTROS ---
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [fechaFin, setFechaFin] = useState(new Date());
    const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

    const navigate = useNavigate();

    // FUNCIÓN DE BÚSQUEDA (ahora manual con botón)
    const fetchReporte = useCallback(async () => {
        if (!fechaInicio || !fechaFin) return;
        if (fechaInicio > fechaFin) {
            setError("La fecha inicial no puede ser mayor que la fecha final.");
            return;
        }

        setCargando(true);
        setError(null);
        try {
            const params = {
                FechaDesde: fechaInicio.toISOString().split("T")[0],
                FechaHasta: fechaFin.toISOString().split("T")[0],
                ContratoId: contratoSeleccionado ? Number(contratoSeleccionado.value) : null,
                ProveedorId: proveedorSeleccionado ? Number(proveedorSeleccionado.value) : null,
                Estado: null
            };

            console.log("Body enviado:", params);
            const resultado = await getVencimientoContratos(params);
            console.log("Respuesta:", resultado);

            setReporteData(Array.isArray(resultado) ? resultado : (resultado?.data || []));
        } catch (err) {
            if (err.message.includes("401")) {
                setError("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
                eliminarToken();
                navigate("/login");
            } else {
                setError("Error al obtener reporte de vencimiento.");
            }
        } finally {
            setCargando(false);
        }
    }, [fechaInicio, fechaFin, contratoSeleccionado, proveedorSeleccionado, navigate]);

    const handleExport = async () => {
        try {
            const params = {
                FechaDesde: fechaInicio.toISOString().split("T")[0],
                FechaHasta: fechaFin.toISOString().split("T")[0],
                ContratoId: contratoSeleccionado ? Number(contratoSeleccionado.value) : null,
                ProveedorId: proveedorSeleccionado ? Number(proveedorSeleccionado.value) : null,
                Estado: null
            };
            await exportarVencimientoContratos(params);
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };

    const handleLimpiar = () => {
        setContratoSeleccionado(null);
        setProveedorSeleccionado(null);
        setFechaInicio(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        setFechaFin(new Date());
        setReporteData([]);
        setError(null);
    };


    // --- RENDER ---
    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Reporte de Vencimiento de Contratos</h1>
                <p className="text-gray-500 mt-1">Listado de contratos próximos a vencer según filtros seleccionados.</p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6 shadow-sm">
                <div className="w-64">
                    <Autocomplete
                        options={contratos}
                        getOptionLabel={(opt) => opt.label || ""}
                        value={contratoSeleccionado}
                        onChange={(_, val) => setContratoSeleccionado(val)}
                        onInputChange={async (_, inputValue) => {
                            const resC = await buscarContratosSelect(inputValue, 1, 50);
                            setContratos(resC);
                        }}
                        isOptionEqualToValue={(opt, val) => opt.value === val.value}
                        renderInput={(params) => <TextField {...params} label="Contrato" size="small" />}
                        noOptionsText="Sin resultados"
                    />

                </div>
                <div className="w-64">
                    <Autocomplete
                        options={proveedores}
                        getOptionLabel={(opt) => opt.label || ""}
                        value={proveedorSeleccionado}
                        onChange={(_, val) => setProveedorSeleccionado(val)}
                        onInputChange={async (_, inputValue) => {
                            const resP = await buscarProveedoresSelect(inputValue, 1, 50);
                            setProveedores(resP);
                        }}
                        isOptionEqualToValue={(opt, val) => opt.value === val.value}
                        renderInput={(params) => <TextField {...params} label="Proveedor" size="small" />}
                        noOptionsText="Sin resultados"
                    />

                </div>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            label="Desde"
                            value={fechaInicio}
                            onChange={(date) => setFechaInicio(date)}
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                        />
                        <DatePicker
                            label="Hasta"
                            value={fechaFin}
                            onChange={(date) => setFechaFin(date)}
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                        />

                        <button
                            onClick={fetchReporte}
                            disabled={cargando}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow disabled:opacity-50 transition"
                        >
                            Buscar
                        </button>

                    </div>
                </LocalizationProvider>
                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={handleLimpiar}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition"
                    >
                        Limpiar
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={cargando || reporteData.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow disabled:opacity-50 transition"
                    >
                        <span className="mr-1">Excel</span>
                    </button>
                </div>

            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-left text-xs font-semibold uppercase z-10">Contrato</th>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-left text-xs font-semibold uppercase z-10">Proveedor</th>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-left text-xs font-semibold uppercase z-10">Fecha Inicio</th>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-left text-xs font-semibold uppercase z-10">Fecha Fin</th>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-right text-xs font-semibold uppercase z-10">Días Restantes</th>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-left text-xs font-semibold uppercase z-10">Estado</th>
                                <th className="sticky top-0 bg-blue-900 px-4 py-3 text-left text-xs font-semibold uppercase z-10">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cargando ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <Box className="flex flex-col items-center gap-2">
                                            <CircularProgress size={40} />
                                            <span className="text-gray-500 text-sm">Generando reporte...</span>
                                        </Box>
                                    </td>
                                </tr>
                            ) : reporteData.length > 0 ? (
                                reporteData.map((row, index) => (
                                    <tr key={index} className="hover:bg-blue-50 transition duration-150">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.numeroContrato}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{row.proveedorNombre}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.fechaInicio).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(row.fechaFin).toLocaleDateString()}</td>
                                        <td className={`px-4 py-3 text-sm text-right font-mono ${row.diasRestantes < 0
                                            ? "text-red-700 bg-red-100"         // vencido
                                            : row.diasRestantes <= 7
                                                ? "text-yellow-800 bg-yellow-100" // próximo a vencer
                                                : "text-green-700"               // lejano a vencer, fondo neutro
                                            } rounded-md`}>
                                            {row.diasRestantes}
                                        </td>
                                        <td className={`px-4 py-3 text-sm font-bold ${row.nombreEstado === "Activo" ? "text-green-700" : "text-red-600"}`}>{row.nombreEstado}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{row.montoContrato?.toLocaleString("es-NI", { style: "currency", currency: "NIO" })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 italic">
                                        No se encontraron contratos próximos a vencer en el período seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReporteVencimientoPage;
