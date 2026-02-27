import { CheckCircleIcon, PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../../hooks/useFiltroPaginado';
import { deleteMarca, exportarMarcas, getMarcasPaginadas, toggleMarcaEstado } from '../../../services/api';
import MarcaForm from './MarcaForm';

const MarcaPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [marcaEditando, setMarcaEditando] = useState(null);

    const {
        items: marcas,
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
        fetchFunction: getMarcasPaginadas,
        exportFunction: exportarMarcas
    });

    const handleCreate = () => {
        setMarcaEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (marca) => {
        setMarcaEditando(marca);
        setIsModalOpen(true);
    };

    const handleToggleEstado = async (marca) => {
        const nuevoEstado = !marca.estado;
        const mensajeConfirmacion = nuevoEstado ? 'activar' : 'desactivar';
        const mensajeAccion = nuevoEstado ? 'activada' : 'desactivada';

        if (!window.confirm(`¿Estás seguro de que quieres ${mensajeConfirmacion} la Marca "${marca.descripcionMarca}"?`)) return;

        try {
            await toggleMarcaEstado(marca.idMarca, nuevoEstado);
            alert(`Marca "${marca.descripcionMarca}" ${mensajeAccion} con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al cambiar estado: ${err.message}`);
        }
    };

    const handleDelete = async (id, descripcionMarca) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la marca "${descripcionMarca}"? Esta acción es irreversible.`)) return;

        try {
            await deleteMarca(id);
            alert(`Marca "${descripcionMarca}" eliminada con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (marcaActualizada = false) => {
        setIsModalOpen(false);
        setMarcaEditando(null);
        if (marcaActualizada) fetchData(paginaActual);
    };

    // --- Renderizado Condicional ---
    if (error) return <div className="p-12 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Marcas</h1>
            <div className="flex justify-between items-center">

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
                    Nueva Marca
                </button>

                {/* Cuadro de Búsqueda*/}
                <div className="flex items-center space-x-4">
                    <BuscadorDebounce className="w-64"
                        value={searchTerm}
                        onDebouncedChange={setSearchTerm}
                        placeholder="Buscar por Nombre..."
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

                    {/* EXPORTAR */}
                    <button
                        onClick={handleExport}
                        disabled={cargando}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center shadow disabled:opacity-50 transition duration-150"
                        title="Exportar toda la lista a Excel (con filtros aplicados)"
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

            {/*TABLA DE DATOS*/}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>

                            <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">Descripción</th>
                            <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">Estado</th>
                            <th className="sticky top-0 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider z-10">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-200">
                        {cargando ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-6 text-center text-gray-500">
                                    Cargando...
                                </td>
                            </tr>
                        ) : marcas.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron marcas.
                                </td>
                            </tr>
                        ) : (
                            marcas.map((marca) => (
                                <tr key={marca.idMarca}>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{marca.descripcionMarca}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${marca.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>

                                            {marca.estado ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-3">

                                        {/* Editar */}
                                        <button
                                            onClick={() => handleEdit(marca)}
                                            className="text-indigo-600 hover:text-indigo-900 relative group"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                               bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                Editar
                                            </span>
                                        </button>

                                        {/* Activar/Desactivar */}
                                        <button
                                            onClick={() => handleToggleEstado(marca)}
                                            className={`relative group ${marca.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                                }`}
                                        >
                                            {marca.estado ? (
                                                <XCircleIcon className="h-5 w-5" />
                                            ) : (
                                                <CheckCircleIcon className="h-5 w-5" />
                                            )}
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                         bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                                {marca.estado ? 'Desactivar' : 'Activar'}
                                            </span>
                                        </button>

                                        {/* Eliminar */}
                                        <button
                                            onClick={() => handleDelete(marca.idMarca, marca.descripcionMarca)}
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
                            ))
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

                {/* El renderizado de paginación se mantiene igual para concisión */}
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
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
                            <MarcaForm
                                marca={marcaEditando}
                                onClose={handleCloseModal}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MarcaPage;