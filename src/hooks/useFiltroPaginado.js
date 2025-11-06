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

    const fetchData = useCallback(async (page) => {
        setCargando(true);
        setError(null);
        try {
            const data = await fetchFunction(page, tamanoPagina, searchTerm, estadoFiltro);
            setItems(data.datos || []);
            setTotalPaginas(data.totalPaginas);
        } catch (err) {
            setError(err.message || 'Error al cargar datos.');
        } finally {
            setCargando(false);
        }
    }, [fetchFunction, tamanoPagina, searchTerm, estadoFiltro]);

    useEffect(() => {
        setPaginaActual(1);
    }, [searchTerm, estadoFiltro]);

    useEffect(() => {
        fetchData(paginaActual);
    }, [paginaActual, fetchData]);

    const handleExport = async () => {
        try {
            await exportFunction({ query: searchTerm, estadoFiltro });
        } catch (err) {
            alert(`Error al exportar: ${err.message}`);
        }
    };

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
