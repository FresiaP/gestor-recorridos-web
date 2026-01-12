import {
    Autocomplete,
    TextField
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCallback, useEffect, useState } from 'react';
import {
    buscarDispositivosSelect,
    buscarSitiosSelect,
    exportarReporteConsumo,
    getProveedores,
    GetReporteConsumo
} from '../../services/api';

const ReporteConsumoPage = () => {
    // --- ESTADOS DE DATOS ---
    const [reporteData, setReporteData] = useState([]);
    const [sitios, setSitios] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [dispositivos, setDispositivos] = useState([]);

    // --- ESTADOS DE UI ---
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    // --- ESTADOS DE FILTROS ---
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [sitioSeleccionado, setSitioSeleccionado] = useState(null);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
    const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState(null);

    // 1. CARGA DE MAESTROS (Proveedores, Sitios y Dispositivos)
    useEffect(() => {
        const cargarMaestros = async () => {
            try {
                const [resP, resS, resD] = await Promise.all([
                    getProveedores(),
                    buscarSitiosSelect('', 1, 100),
                    buscarDispositivosSelect('', 1, 100)
                ]);

                setSitios(Array.isArray(resS) ? resS : (resS || []));
                setDispositivos(Array.isArray(resD) ? resD : (resD || []));
                setProveedores(Array.isArray(resP) ? resP : (resP?.datos || resP?.data || []));
            } catch (err) {
                console.error("Error cargando maestros:", err);
                setError("No se pudieron cargar los filtros de proveedores/dispositivos/sitios.");
            }
        };
        cargarMaestros();
    }, []);

    // 2. FUNCIÓN DE BÚSQUEDA (memoizada con useCallback)
    const fetchReporte = useCallback(async () => {
        if (!fechaInicio || !fechaFin) return;

        setCargando(true);
        setError(null);
        try {
            const params = {
                FechaDesde: fechaInicio ? fechaInicio.toISOString().split('T')[0] : null,
                FechaHasta: fechaFin ? fechaFin.toISOString().split('T')[0] : null,
                ProveedorId: proveedorSeleccionado?.idProveedor || null,
                SitioId: sitioSeleccionado?.value || null,
                DispositivoId: dispositivoSeleccionado?.value || null
            };



            console.log("Body enviado:", params); // debug
            const resultado = await GetReporteConsumo(params);
            console.log("Respuesta:", resultado); // debug
            setReporteData(resultado);
        } catch (err) {
            console.error("Error al obtener reporte:", err);
            setError("Error al procesar la consulta del reporte.");
        } finally {
            setCargando(false);
        }
    }, [fechaInicio, fechaFin, sitioSeleccionado, dispositivoSeleccionado, proveedorSeleccionado]);



    // 3. EFECTO DE BÚSQUEDA AUTOMÁTICA
    useEffect(() => {
        fetchReporte();
    }, [fetchReporte]);

    // --- MANEJADORES ---
    const handleExport = async () => {
        try {
            const params = {
                FechaDesde: fechaInicio ? fechaInicio.toISOString().split('T')[0] : null,
                FechaHasta: fechaFin ? fechaFin.toISOString().split('T')[0] : null,
                SitioId: sitioSeleccionado?.value || null,
                ProveedorId: proveedorSeleccionado?.idProveedor || null,
                DispositivoId: dispositivoSeleccionado?.value || null
            };

            await exportarReporteConsumo(params);
        } catch (err) {
            alert(`Error de exportación: ${err.message || "No se pudo exportar el reporte."}`);
        }
    };

    const handleLimpiar = () => {
        setSitioSeleccionado(null);
        setDispositivoSeleccionado(null);
        setProveedorSeleccionado(null);
        setFechaInicio(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        setFechaFin(new Date());
    };

    return (
        <div className="p-12 bg-white min-h-screen">
            {/* Encabezado */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Reporte de Consumo</h1>
                <p className="text-gray-500 mt-1">Análisis de impresiones y copias.</p>
            </div>

            {/* SECCIÓN DE FILTROS */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6 shadow-sm">
                {/* Autocomplete SITIOS */}
                <div className="w-64">
                    <Autocomplete
                        options={sitios}
                        getOptionLabel={(opt) => opt.label || ""}
                        value={sitioSeleccionado}
                        onChange={(_, val) => setSitioSeleccionado(val)}
                        isOptionEqualToValue={(opt, val) => opt.value === val.value}
                        renderInput={(params) => <TextField {...params} label="Sitio" size="small" />}
                        noOptionsText="Sin resultados"
                    />
                </div>

                {/* Autocomplete Proveedores */}
                <div className="w-64">
                    <Autocomplete
                        options={proveedores}
                        getOptionLabel={(opt) => opt.nombre || opt.label || ""}
                        value={proveedorSeleccionado}
                        onChange={(_, val) => setProveedorSeleccionado(val)}
                        isOptionEqualToValue={(opt, val) => opt.idProveedor === val.idProveedor}
                        renderInput={(params) => <TextField {...params} label="Proveedor" size="small" />}
                        noOptionsText="Sin resultados"
                    />
                </div>

                {/* Autocomplete Dispositivos */}
                <div className="w-64">
                    <Autocomplete
                        options={dispositivos}
                        getOptionLabel={(opt) => opt.label || ""}
                        value={dispositivoSeleccionado}
                        onChange={(_, val) => setDispositivoSeleccionado(val)}
                        onInputChange={async (_, inputValue) => {
                            const resD = await buscarDispositivosSelect(inputValue, 1, 50);
                            setDispositivos(resD);
                        }}
                        isOptionEqualToValue={(opt, val) => opt.value === val.value}
                        renderInput={(params) => <TextField {...params} label="Dispositivo" size="small" />}
                        noOptionsText="Sin resultados"
                    />
                </div>

                {/* DatePickers */}
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

                {/* Acciones */}
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

            {/* ERROR UI */}
            {error && (
                <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {/* TABLA DE RESULTADOS */}
            <div className="bg-white shadow-md overflow-x-auto rounded-lg border border-gray-200">
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full table-auto text-sm text-left">
                        <thead className="bg-blue-800 text-white">
                            <tr>
                                <th rowSpan="2" className="px-4 py-2 border">Hardware (Modelo)</th>
                                <th rowSpan="2" className="px-4 py-2 border">Impresora</th>
                                <th rowSpan="2" className="px-4 py-2 border"># de Serie</th>
                                <th rowSpan="2" className="px-4 py-2 border">Ubicación</th>
                                <th rowSpan="2" className="px-4 py-2 border">Fecha Corte</th>
                                <th colSpan="3" className="px-4 py-2 border text-center bg-gray-700">Consumo Monocromático</th>
                                <th colSpan="3" className="px-4 py-2 border text-center bg-blue-700">Consumo Color</th>
                            </tr>
                            <tr className="bg-gray-100 text-gray-800">
                                <th className="px-2 py-1 border">Inicial</th>
                                <th className="px-2 py-1 border">Final</th>
                                <th className="px-2 py-1 border bg-yellow-100">Total</th>
                                <th className="px-2 py-1 border">Inicial</th>
                                <th className="px-2 py-1 border">Final</th>
                                <th className="px-2 py-1 border bg-yellow-100">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reporteData.map((item, index) => {
                                const getNumber = (value) => Number(value ?? 0);

                                return (
                                    <tr key={index} className="hover:bg-gray-50 border-b">
                                        <td className="px-4 py-2">{item.dispositivoModelo}</td>
                                        <td className="px-4 py-2 italic text-gray-600">{item.nombreDispositivo}</td>
                                        <td className="px-4 py-2 font-mono">{item.dispositivoSerie}</td>
                                        <td className="px-4 py-2">{item.ubicacion}</td>
                                        <td className="px-4 py-2">
                                            {item.fechaCorte ? new Date(item.fechaCorte).toLocaleDateString() : ""}
                                        </td>

                                        {/* Datos Mono */}
                                        <td className="px-4 py-2 text-right">{getNumber(item.contadorInicialMono).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right">{getNumber(item.contadorFinalMono).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right font-bold text-blue-700">{getNumber(item.consumoMono).toLocaleString()}</td>

                                        {/* Datos Color */}
                                        <td className="px-4 py-2 text-right">{getNumber(item.contadorInicialColor).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right">{getNumber(item.contadorFinalColor).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right font-bold text-green-700">{getNumber(item.consumoColor).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-200 font-bold">
                            <tr>
                                <td colSpan="5" className="px-4 py-2 text-right text-lg">TOTAL GENERAL:</td>
                                <td colSpan="2"></td>
                                <td className="px-4 py-2 text-right text-blue-800 text-lg">
                                    {reporteData.reduce((acc, curr) => acc + (curr.consumoMono ?? 0), 0).toLocaleString()}
                                </td>
                                <td colSpan="2"></td>
                                <td className="px-4 py-2 text-right text-green-800 text-lg">
                                    {reporteData.reduce((acc, curr) => acc + (curr.consumoColor ?? 0), 0).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReporteConsumoPage;

