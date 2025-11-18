import { useState, useEffect, useCallback } from 'react';

export const useFiltroPaginado = ({ fetchFunction, exportFunction }) => {
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Función para traer datos
    const fetchData = useCallback(async (page, size, query, estado) => {
        setCargando(true);
        setError(null);
        try {
            const data = await fetchFunction(page, size, query, estado);
            setItems(data.datos || []);
            setTotalPaginas(data.totalPaginas);
        } catch (err) {
            setError(err.message || 'Error al cargar datos.');
        } finally {
            setCargando(false);
        }
    }, [fetchFunction]);

    // Reinicia a página 1 si cambian filtros o búsqueda
    useEffect(() => {
        setPaginaActual(1);
    }, [searchTerm, estadoFiltro]);

    // Cada vez que cambien página, tamaño, búsqueda o filtro → recarga datos
    useEffect(() => {
        fetchData(paginaActual, tamanoPagina, searchTerm, estadoFiltro);
    }, [paginaActual, tamanoPagina, searchTerm, estadoFiltro, fetchData]);

    // Exportar datos
    const handleExport = async () => {
        try {
            await exportFunction({ query: searchTerm, estadoFiltro });
        } catch (err) {
            alert(`Error al exportar: ${err.message}`);
        }
    };

    // Navegación de páginas
    const handleNextPage = () => {
        if (paginaActual < totalPaginas) setPaginaActual(p => p + 1);
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) setPaginaActual(p => p - 1);
    };

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
        handlePrevPage
    };
};
