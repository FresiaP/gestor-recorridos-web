import {
    Autocomplete,
    Box,
    CircularProgress,
    TextField
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useEffect, useState } from 'react';
import {
    buscarContratosSelect,
    buscarProveedoresSelect,
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

    // 1. CARGA DE MAESTROS
    useEffect(() => {
        const cargarMaestros = async () => {
            try {
                const [resC, resP] = await Promise.all([
                    buscarContratosSelect('', 1, 100),
                    buscarProveedoresSelect('', 1, 100)
                ]);
                setContratos(Array.isArray(resC) ? resC : (resC?.data || []));
                setProveedores(Array.isArray(resP) ? resP : (resP?.data || []));
            } catch (err) {
                console.error("Error cargando maestros:", err);
                setError("No se pudieron cargar los filtros de proveedores / Contratos.");
            }
        };
        cargarMaestros();
    }, []);

    // 2. FUNCIÓN DE BÚSQUEDA
    const fetchReporte = useCallback(async () => {
        if (!fechaInicio || !fechaFin) return;

        setCargando(true);
        setError(null);
        try {
            const params = {
                FechaDesde: fechaInicio
                    ? fechaInicio.toISOString().split("T")[0]
                    : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
                FechaHasta: fechaFin
                    ? fechaFin.toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0],
                ContratoId: contratoSeleccionado ? Number(contratoSeleccionado.value) : null,
                ProveedorId: proveedorSeleccionado ? Number(proveedorSeleccionado.value) : null,
                Estado: null
            };


            console.log("Body enviado:", params); // debug
            const resultado = await getVencimientoContratos(params);
            console.log("Respuesta:", resultado); // debug

            setReporteData(Array.isArray(resultado) ? resultado : (resultado?.data || []));
        } catch (err) {
            setError("Error al obtener reporte de vencimiento.");
        } finally {
            setCargando(false);
        }
    }, [fechaInicio, fechaFin, contratoSeleccionado, proveedorSeleccionado]);

    useEffect(() => {
        fetchReporte();
    }, [fetchReporte]);

    // 3. MANEJADORES
    const handleExport = async () => {
        try {
            const params = {
                FechaDesde: fechaInicio
                    ? fechaInicio.toISOString().split("T")[0]
                    : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
                FechaHasta: fechaFin
                    ? fechaFin.toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0],
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
                    </div>
                </LocalizationProvider>
                <div className="flex gap-2 ml-auto">
                    <button onClick={handleLimpiar} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition">
                        Limpiar
                    </button>
                    <button onClick={handleExport} disabled={cargando || reporteData.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow disabled:opacity-50 transition">
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
            <div className="bg-white shadow-md overflow-x-auto rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Contrato</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Proveedor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Fecha Inicio</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Fecha Fin</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Días Restantes</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Monto</th>
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
                                        <td className="px-4 py-3 text-sm text-right font-mono text-gray-700">{row.diasRestantes}</td>
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
