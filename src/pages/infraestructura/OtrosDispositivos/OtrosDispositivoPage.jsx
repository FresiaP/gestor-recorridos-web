import { CheckCircleIcon, PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../../hooks/useFiltroPaginado';
import { deleteOtrosDispositivo, exportarOtrosDispositivos, getOtrosDispositivosPaginados, toggleOtrosDispositivoEstado } from '../../../services/api';
import OtrosDispositivoForm from './OtrosDispositivoForm';


const OtrosDispositivoPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [OtrosDispositivoEditando, setOtrosDispositivoEditando] = useState(null);

    const {
        items: otrosdispositivos,
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
        fetchFunction: getOtrosDispositivosPaginados,
        exportFunction: exportarOtrosDispositivos
    });

    const handleCreate = () => {
        setOtrosDispositivoEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (otrosdispositivo) => {
        setOtrosDispositivoEditando(otrosdispositivo);
        setIsModalOpen(true);
    };

    const handleToggleEstado = async (otrosdispositivo) => {
        const nuevoEstado = !otrosdispositivo.estado;
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        if (!window.confirm(`¿Estás seguro de que quieres ${accion} el dispositivo "${otrosdispositivo.nombre}"?`)) return;

        try {
            await toggleOtrosDispositivoEstado(otrosdispositivo.idOtrosDispositivos, nuevoEstado);
            alert(`Dispositivo "${otrosdispositivo.nombre}" ${accion}da con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al ${accion}: ${err.message}`);
        }
    };
    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el dispositivo "${nombre}"? Esta acción es irreversible.`)) return;

        try {
            await deleteOtrosDispositivo(id);
            alert(`Dispositivo "${nombre}" eliminada con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (OtrosdispositivoActualizado = false) => {
        setIsModalOpen(false);
        setOtrosDispositivoEditando(null);
        if (OtrosdispositivoActualizado) fetchData(paginaActual);
    };


    // --- Renderizado Condicional ---
    if (cargando) return <div className="p-12 text-gray-500">Cargando otros dispositivos...</div>;
    if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Otros Dispositivos</h1>
            <div className="flex justify-between items-center">

                {/* CREAR OTRO DISPOSITIVO NUEVO*/}
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
                    Crear Nuevo Dispositivo
                </button>

                <div className="flex items-center space-x-4">
                    <BuscadorDebounce
                        value={searchTerm}
                        onDebouncedChange={(val) => setSearchTerm(val)}
                        disabled={cargando}
                        placeholder="Buscar por Nombre, serie..."
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

                    {/* EXPORTAR*/}
                    <button
                        onClick={handleExport}
                        disabled={cargando}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center shadow disabled:opacity-50 transition duration-150"
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
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sitio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {otrosdispositivos.map((o) => (
                            <tr key={o.idOtrosDispositivos}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.idOtrosDispositivos}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.nombre}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.serie}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.nombreTipo}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.descripcion}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.descripcionModelo}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.descripcionMarca}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.descripcionUbicacion}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{o.descripcionSitio}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {o.estado ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">

                                    {/* EDITAR */}
                                    <button
                                        onClick={() => handleEdit(o)}
                                        className="text-indigo-600 hover:text-indigo-900 relative group"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                               bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                            Editar
                                        </span>
                                    </button>

                                    {/* ACTIVAR/ DESACTIVAR */}
                                    <button
                                        onClick={() => handleToggleEstado(o)}
                                        className={`relative group ${o.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                            }`}
                                    >
                                        {o.estado ? (
                                            <XCircleIcon className="h-5 w-5" />
                                        ) : (
                                            <CheckCircleIcon className="h-5 w-5" />
                                        )}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                         bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                            {o.estado ? 'Desactivar' : 'Activar'}
                                        </span>
                                    </button>

                                    {/* ELIMINAR */}
                                    <button
                                        onClick={() => handleDelete(o.idOtrosDispositivos, o.nombre)}
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
                        ))}
                        {otrosdispositivos.length === 0 && (
                            <tr>
                                <td colSpan="12" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron dispositivos.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>


            {/* CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 0 && (
                <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200 space-x-1 flex-wrap">
                    <button
                        onClick={handlePrevPage}
                        disabled={paginaActual === 1 || cargando}
                        aria-label="Página anterior"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-l disabled:opacity-50 transition duration-150"
                    >
                        &lt;
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                        <button
                            key={num}
                            onClick={() => setPaginaActual(num)}
                            aria-label={`Ir a la página ${num}`}
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
                        aria-label="Página siguiente"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50 transition duration-150"
                    >
                        &gt;
                    </button>
                </div>
            )}

            {/* MODAL DEL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
                        <OtrosDispositivoForm
                            otrosdispositivo={OtrosDispositivoEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OtrosDispositivoPage;