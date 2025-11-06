import React, { useState } from 'react';
import { getSitiosPaginados, deleteSitio, toggleSitioEstado, exportarSitios } from '../../../services/api';
import SitioForm from './SitioForm';
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../../hooks/useFiltroPaginado';

const SitioPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sitioEditando, setSitioEditando] = useState(null);

    const {
        items: sitios,
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
    } = useFiltroPaginado({
        fetchFunction: getSitiosPaginados,
        exportFunction: exportarSitios
    });

    const handleCreate = () => {
        setSitioEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (sitio) => {
        setSitioEditando(sitio);
        setIsModalOpen(true);
    };

    const handleToggleEstado = async (sitio) => {
        const nuevoEstado = !sitio.estado;
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        if (!window.confirm(`¿Estás seguro de que quieres ${accion} el sitio "${sitio.descripcion}"?`)) {
            return;
        }

        try {
            await toggleSitioEstado(sitio.idSitio, nuevoEstado);
            alert(`Sitio "${sitio.descripcion}" ${accion}do con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al ${accion}: ${err.message}`);
        }
    };

    const handleDelete = async (id, descripcion) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el sitio "${descripcion}"? Esta acción es irreversible.`)) {
            return;
        }
        try {
            await deleteSitio(id);
            alert(`Sitio "${descripcion}" eliminado con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (sitioActualizado = false) => {
        setIsModalOpen(false);
        setSitioEditando(null);
        if (sitioActualizado) {
            fetchData(paginaActual);
        }
    };

    // --- Renderizado Condicional ---
    if (cargando) return <div className="p-6 text-gray-500">Cargando sitios...</div>;
    if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

    return (
        <div className="p-12">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Sitios</h1>
            <div className="flex justify-between items-center">
                <button
                    onClick={handleCreate}
                    className="bg-blue-700 hover:bg-white-700 text-white font-bold py-2 px-4 rounded mb-4 shadow transition duration-150"
                >
                    ➕ Crear Nuevo Sitio
                </button>

                <div className="flex items-center space-x-4">
                    <BuscadorDebounce
                        value={searchTerm}
                        onDebouncedChange={(val) => setSearchTerm(val)}
                        disabled={cargando}
                        placeholder="Buscar por Descripción..."
                    />

                    {/* Control de Selección de Estado */}
                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
                    >
                        <option value="">Todos</option> {/* Valor vacío o 'todo' para no filtrar */}
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>

                    <button
                        onClick={handleExport}
                        disabled={cargando}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg flex items-center shadow disabled:opacity-50 transition duration-150"
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

            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-200">
                        {sitios.map((sitio) => (
                            <tr key={sitio.idSitio}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sitio.idSitio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sitio.descripcion}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sitio.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {sitio.estado ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(sitio)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition duration-150"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleToggleEstado(sitio)}
                                        className={`mr-3 transition duration-150 ${sitio.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                        title={sitio.estado ? 'Desactivar Sitio' : 'Activar Sitio'}
                                    >
                                        {sitio.estado ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sitio.idSitio, sitio.descripcion)}
                                        className="text-red-600 hover:text-red-900 transition duration-150"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sitios.length === 0 && !cargando && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron sitios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200">
                <button
                    onClick={handlePrevPage}
                    disabled={paginaActual === 1 || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l disabled:opacity-50 transition duration-150"
                >
                    &lt; Anterior
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
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-r disabled:opacity-50 transition duration-150"
                >
                    Siguiente &gt;
                </button>
            </div>

            {/* MODAL DEL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
                        <SitioForm
                            sitio={sitioEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SitioPage;

