import { useCallback, useEffect, useState } from 'react';

/**
 * Hook personalizado para manejar la lógica de paginación, búsqueda y filtros.
 *
 * @param {object} props
 * @param {function} props.fetchFunction - Función asíncrona para obtener datos paginados.
 * @param {function} props.exportFunction - Función asíncrona para exportar datos filtrados.
 * @returns {object} Estado y funciones de control para la UI.
 */
export const useFiltroPaginado = ({ fetchFunction, exportFunction }) => {
    // --- ESTADOS BASE ---
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [sortColumn, setSortColumn] = useState('');
const [sortDirection, setSortDirection] = useState('asc');


    // --- ESTADOS DE FILTRO Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // 🌟 MODIFICACIÓN CLAVE: Función fetchData más flexible
    // Acepta los 4 parámetros base, y usa ...args para cualquier otro (ordenarPor, fechas, etc.).
    const fetchData = useCallback(async (page, size, query, estado, ...args) => {
        setCargando(true);
        setError(null);
        try {
            // Pasa todos los argumentos: los 4 base + los opcionales en ...args
            const data = await fetchFunction(page, size, query, estado, ...args);
            setItems(data.datos || []);
            setTotalPaginas(data.totalPaginas);
        } catch (err) {
            setError(err.message || 'Error al cargar datos.');
        } finally {
            setCargando(false);
        }
    }, [fetchFunction]);

    // --- EFECTOS DE CONTROL ---

    // Reinicia a página 1 si cambian filtros o búsqueda
    useEffect(() => {
        setPaginaActual(1);
    }, [searchTerm, estadoFiltro]);

    // Recarga datos cuando cambian la paginación o filtros BASE (Para las entidades que no tienen filtros extras)
    useEffect(() => {
        fetchData(paginaActual, tamanoPagina, searchTerm, estadoFiltro, sortColumn, sortDirection);
    }, [paginaActual, tamanoPagina, searchTerm, estadoFiltro, sortColumn, sortDirection, fetchData]);

// --- EXPORTAR DATOS FLEXIBLE ---
const handleExport = useCallback(async (filtrosOpcionales = {}) => {
  try {
    // Pasa filtros base + ordenación + opcionales
    await exportFunction({
      query: searchTerm,
      estadoFiltro,
      sortColumn,
      sortDirection,
      ...filtrosOpcionales
    });
  } catch (err) {
    alert(`Error al exportar: ${err.message}`);
  }
}, [searchTerm, estadoFiltro, sortColumn, sortDirection, exportFunction]);


    // --- NAVEGACIÓN DE PÁGINAS ---
    const handleNextPage = () => {
        if (paginaActual < totalPaginas) setPaginaActual(p => p + 1);
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) setPaginaActual(p => p - 1);
    };

    // --- RETORNO DEL HOOK ---
    return {
        items,
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
    };
};