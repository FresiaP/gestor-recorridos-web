// src/pages/auditoria/AuditoriaPage.jsx

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useCallback, useEffect, useState } from 'react';
import BuscadorDebounce from '../../components/ui/BuscadorDebounce';
import {
    exportarAuditorias,
    getAuditoriasPaginadas
} from '../../services/api';



function AuditoriaPage() {
    // --- 1. ESTADOS DE DATOS Y CARGA ---
    const [auditorias, setAuditorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 2. ESTADOS DE FILTROS ---
    const [query, setQuery] = useState(''); // Búsqueda de texto libre (Acción/Detalle)
    // Estados de fecha
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [moduloFiltro, setModuloFiltro] = useState('');

    // Lista de módulos fijos para el selector 
    const modulos = [
        'Usuario', 'Permiso', 'UsuarioPermiso',
        'Marca', 'Modelo', 'Tipo', 'Categoria',
        'Dispositivo', 'EstadoDispositivo', 'OtrosDispositivo',
        'Consumible', 'Consumo',
        'Contrato', 'ContratoDetalleImpresion',
        'Proveedor', 'Sitio', 'Ubicacion',
        'Incidencia',
        'ParametroAmbiente',
        'Auditoria'
    ];

    // --- 3. ESTADOS DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // --- 4. FUNCIÓN DE BÚSQUEDA PRINCIPAL (memoizada) ---
    const fetchAuditorias = useCallback(async (page) => {
        setLoading(true);
        setError(null);

        const inicioStr = fechaInicio ? fechaInicio.toISOString().split('T')[0] : '';
        const finStr = fechaFin ? fechaFin.toISOString().split('T')[0] : '';

        try {
            const data = await getAuditoriasPaginadas(
                page,
                tamanoPagina,
                query,
                inicioStr,
                finStr,
                moduloFiltro
            );

            setAuditorias(data.datos || []);
            setTotalPaginas(data.totalPaginas || 1);

        } catch (err) {
            console.error('Error al cargar auditorías:', err);
            setError(err.message || 'Error al obtener registros de auditoría.');
        } finally {
            setLoading(false);
        }
    }, [tamanoPagina, query, fechaInicio, fechaFin, moduloFiltro]);
    // Dependencias de Recarga

    // --- 5. EFECTO: Patrón de Búsqueda Automática (Live Filter) ---
    // Se ejecuta cuando cambia la página, o cuando cambia cualquiera de los filtros (vía fetchAuditorias).
    useEffect(() => {
        fetchAuditorias(paginaActual);
    }, [paginaActual, fetchAuditorias]);

    // --- 6. EFECTO: Cuando cambian los filtros, volvemos a la página 1.
    useEffect(() => {
        setPaginaActual(1);
    }, [query, fechaInicio, fechaFin, moduloFiltro, tamanoPagina]);

    // --- 7. MANEJADORES DE ACCIÓN ---

    // Función genérica para manejar cambios en filtros que deben resetear la paginación
    const handleFilterChange = (setter, value) => {
        setter(value);
        // Nota: setPaginaActual(1) se ejecuta en el useEffect [6]
    };

    const handleExport = async () => {
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
            return;
        }

        setLoading(true);
        try {
            const inicioStr = fechaInicio ? fechaInicio.toISOString().split('T')[0] : null;
            const finStr = fechaFin ? fechaFin.toISOString().split('T')[0] : null;
            await exportarAuditorias({
                query,
                inicioStr,
                finStr,
                moduloFiltro,

            });

            // Aquí puedes mostrar un toast de éxito
        } catch (err) {
            console.error('Error al exportar:', err);
            alert(`Error de exportación: ${err.message}`);
        } finally {
            setLoading(false);
        }
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

    // --- RENDERIZADO ---
    if (error) {
        return (
            <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">
                Error al cargar: {error}
            </div>
        );
    }

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">📜 Registros de Auditoría</h1>

            {/* FILTROS */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">

                {/* 1. BÚSQUEDA LIBRE */}
                <div className="w-64">
                    <BuscadorDebounce
                        value={query}
                        onDebouncedChange={(val) => handleFilterChange(setQuery, val)}
                        placeholder="Buscar Acción o Detalle..."
                    />
                </div>

                {/* 2. SELECTOR DE MÓDULO */}
                <select
                    value={moduloFiltro}
                    onChange={(e) => handleFilterChange(setModuloFiltro, e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm bg-white h-[40px] min-w-[150px]"
                    disabled={loading}
                >
                    <option value="">-- Módulo/Entidad --</option>
                    {modulos.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {/* 3. SELECTOR DE FECHA */}
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={fechaInicio}
                            onChange={(date) => setFechaInicio(date)}
                            format="yyyy-MM-dd"
                            label="Desde"
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                            disabled={loading}
                        />
                        <DatePicker
                            value={fechaFin}
                            onChange={(date) => setFechaFin(date)}
                            format="yyyy-MM-dd"
                            label="Hasta"
                            slotProps={{ textField: { size: "small", className: "w-36" } }}
                            disabled={loading}
                        />
                    </div>
                </LocalizationProvider>


                {/* 4. BOTONES Y SELECTOR DE FILAS */}
                <div className="flex items-center gap-2 ml-auto">
                    <select
                        value={tamanoPagina}
                        onChange={(e) => handleFilterChange(setTamanoPagina, Number(e.target.value))}
                        disabled={loading}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm h-[40px] min-w-[90px]"
                    >
                        <option value={10}>10 filas</option>
                        <option value={25}>25 filas</option>
                        <option value={50}>50 filas</option>
                    </select>

                    <button
                        onClick={() => {
                            setQuery('');
                            setFechaInicio('');
                            setFechaFin('');
                            setModuloFiltro('');
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 h-[40px] whitespace-nowrap"
                        disabled={loading}
                    >
                        Limpiar
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={loading || auditorias.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow disabled:opacity-50 h-[40px] whitespace-nowrap"
                        title="Exportar"
                    >
                        {loading ? 'Preparando...' : 'Exportar a Excel'}
                    </button>
                </div>
            </div>


            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-lg mt-6">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Cargando datos...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Origen</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo Origen</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>

                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {auditorias.map((a) => (
                                <tr key={a.idAuditoria} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(a.fecha).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.usuarioLogin || 'Sistema'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.modulo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.accion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.ipOrigen}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.equipoOrigen}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={a.detalle}>
                                        {a.detalle}

                                    </td>
                                </tr>
                            ))}
                            {auditorias.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron registros de auditoría con estos filtros.
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
                    disabled={paginaActual === 1 || loading}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-l disabled:opacity-50"
                >
                    &lt;
                </button>
                <span className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    Página {paginaActual} de {totalPaginas}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={paginaActual === totalPaginas || loading}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50"
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}

export default AuditoriaPage;