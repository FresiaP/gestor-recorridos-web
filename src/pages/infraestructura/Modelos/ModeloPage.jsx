// src/pages/infraestructura/Modelos/ModeloPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    getModelosPaginados,
    deleteModelo,
    toggleModeloEstado,
    exportarModelos

} from '../../../services/api';
import ModeloForm from './ModeloForm';
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';

const ModeloPage = () => {
    const [modelos, setModelos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [paginaActual, setPaginaActual] = useState(1);
    const [tamanoPagina, setTamanoPagina] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modeloEditando, setModeloEditando] = useState(null);

    // Función para recargar la lista de Modelos
    const fetchModelos = useCallback(async (page) => {
        setCargando(true);
        setError(null);
        try {
            const data = await getModelosPaginados(page, tamanoPagina, searchTerm);

            const modelos = data.datos || [];
            const totalRegistros = data.totalRegistros || 0;
            const paginas = Math.ceil(totalRegistros / tamanoPagina);

            setModelos(modelos);
            setTotalPaginas(paginas);

        } catch (err) {
            setError(err.message || 'Fallo al cargar los modelos paginados.');
        } finally {
            setCargando(false);
        }
    }, [tamanoPagina, searchTerm]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setPaginaActual(1);
    }, [searchTerm]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchModelos(paginaActual);
    }, [paginaActual, fetchModelos]);


    // MANEJADOR: Exportar a Excel
    const handleExport = async () => {
        try {
            await exportarModelos(searchTerm?.trim() || '');
        } catch (err) {
            alert(`Error de exportación: ${err.message}`);
        }
    };



    const handleCreate = () => {
        setModeloEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (modelo) => {
        setModeloEditando(modelo);
        setIsModalOpen(true);
    };

    const handleToggleEstado = async (modelo) => {
        const nuevoEstado = !modelo.estado;
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        if (!window.confirm(`¿Estás seguro de que quieres ${accion} el modelo "${modelo.descripcion}"?`)) {
            return;
        }

        try {
            await toggleModeloEstado(modelo.idModelo, nuevoEstado);
            alert(`Modelo "${modelo.descripcion}" ${accion}do con éxito.`);

            // Llamar directamente a fetchModelos para refrescar
            await fetchModelos(paginaActual);
        } catch (err) {
            alert(`Error al ${accion}: ${err.message}`);
        }
    };

    const handleDelete = async (id, descripcion) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el modelo "${descripcion}"? Esta acción es irreversible.`)) {
            return;
        }
        try {
            await deleteModelo(id);
            alert(`Modelo "${descripcion}" eliminado con éxito.`);
            await fetchModelos(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    // FUNCIÓN: Recarga los datos del backend tras Crear/Editar
    const handleCloseModal = (modeloActualizado = false) => {
        setIsModalOpen(false);
        setModeloEditando(null);

        // Si el formulario devolvió un objeto (creación o actualización exitosa)
        // en lugar de manipular el array localmente (lo que causa el error de ID/datos),
        // recargamos los datos del backend para asegurar la consistencia con la paginación.
        if (modeloActualizado) {
            fetchModelos(paginaActual);
        }
    };

    const handleNextPage = () => {
        if (paginaActual < totalPaginas) setPaginaActual(p => p + 1);
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) setPaginaActual(p => p - 1);
    };




    if (cargando) return <div className="p-6 text-gray-500">Cargando modelos...</div>;
    if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

    //=================================================================================
    //Renderizado
    //=================================================================================
    return (
        <div className="p-12">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Modelos</h1>
            <div className="flex justify-between items-center">
                <button
                    onClick={handleCreate}
                    className="bg-blue-700 hover:bg-white-700 text-white font-bold py-2 px-4 rounded mb-4 shadow transition duration-150"
                >
                    ➕ Crear Nuevo Modelo
                </button>

                <div className="flex items-center space-x-4">
                    <BuscadorDebounce
                        value={searchTerm}
                        onDebouncedChange={(val) => setSearchTerm(val)}
                        disabled={cargando}
                        placeholder="Buscar por Nombre..."
                    />
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

            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-200">
                        {modelos.map((modelo) => (
                            <tr key={modelo.idModelo}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{modelo.idModelo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{modelo.descripcion}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{modelo.descripcionMarca}</td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${modelo.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {modelo.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(modelo)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition duration-150"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleToggleEstado(modelo)}
                                        className={`mr-3 transition duration-150 ${modelo.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                        title={modelo.estado ? 'Desactivar Modelo' : 'Activar Modelo'}
                                    >
                                        {modelo.estado ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(modelo.idModelo, modelo.descripcion)}
                                        className="text-red-600 hover:text-red-900 transition duration-150"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {modelos.length === 0 && !cargando && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron modelos.
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
                        <ModeloForm
                            modelo={modeloEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModeloPage;