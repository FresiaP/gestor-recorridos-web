import { CheckCircleIcon, PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import BuscadorDebounce from '../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../hooks/useFiltroPaginado';
import { deleteUsuario, exportarUsuarios, getUsuariosPaginados, toggleUsuarioEstado } from '../../services/api';
import UsuarioForm from './UsuarioForm';

const UsuarioPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [UsuarioEditando, setUsuarioEditando] = useState(null);

    const {
        items: usuarios,
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
        fetchFunction: getUsuariosPaginados,
        exportFunction: exportarUsuarios
    });

    //=========================================================================================================
    // Manejadores de CRUD
    //=========================================================================================================
    // MANEJADOR: Exportar a Excel

    const handleCreate = () => {
        setUsuarioEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (usuario) => {
        setUsuarioEditando(usuario);
        setIsModalOpen(true);
    };

    const handleToggleEstado = async (usuario) => {
        const nuevoEstado = !usuario.estado;
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        if (!window.confirm(`¿Estás seguro de que quieres ${accion} el usuario "${usuario.nombreApellido}"?`)) return;

        try {
            await toggleUsuarioEstado(usuario.idUsuario, nuevoEstado);
            alert(`Usuario "${usuario.nombreApellido}" ${accion}da con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al ${accion}: ${err.message}`);
        }
    };

    const handleDelete = async (id, nombreApellido) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el usuario "${nombreApellido}"? Esta acción es irreversible.`)) return;

        try {
            await deleteUsuario(id);
            alert(`Usuario "${nombreApellido}" eliminado con éxito.`);
            await fetchData(paginaActual);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCloseModal = (usuarioActualizado = false) => {
        setIsModalOpen(false);
        setUsuarioEditando(null);
        if (usuarioActualizado) fetchData(paginaActual);
    };




    if (cargando) return <div className="p-12 text-gray-500">Cargando usuarios...</div>;
    if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

    return (
        <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Usuarios</h1>
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
                    Crear Nuevo Usuario
                </button>

                <div className="flex items-center space-x-4">
                    <BuscadorDebounce
                        value={searchTerm}
                        onDebouncedChange={(val) => setSearchTerm(val)}
                        disabled={cargando}
                        placeholder="Buscar por Nombre, login..."
                    />
                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
                    >
                        <option value="">Todos</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>

                    {/* EXPORTAR */}
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

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombres y Apellidos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-200">
                        {usuarios.map((usuario) => (
                            <tr key={usuario.idUsuario}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.idUsuario}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.nombreApellido}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.login}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {usuario.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                                    {/* EDITAR */}
                                    <button onClick={() => handleEdit(usuario)} className="text-indigo-600 hover:text-indigo-900 relative group"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                               bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                            Editar
                                        </span>
                                    </button>

                                    {/* ACTIVAR/ DESACTIVAR */}
                                    <button onClick={() => handleToggleEstado(usuario)}
                                        className={`relative group ${usuario.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'

                                            }`}
                                    >
                                        {usuario.estado ? (
                                            <XCircleIcon className="h-5 w-5" />
                                        ) : (
                                            <CheckCircleIcon className="h-5 w-5" />
                                        )}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                         bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100">
                                            {usuario.estado ? 'Desactivar' : 'Activar'}
                                        </span>
                                    </button>

                                    {/* ELIMINAR */}
                                    <button onClick={() => handleDelete(usuario.idUsuario, usuario.nombreApellido)} className="text-red-600 hover:text-red-900 relative group"
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
                        {usuarios.length === 0 && !cargando && (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No se encontraron usuarios.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200 space-x-1 flex-wrap">
                <button
                    onClick={handlePrevPage}
                    disabled={paginaActual === 1 || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-l disabled:opacity-50 transition duration-150"
                >
                    &lt;
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                    <button
                        key={num}
                        onClick={() => setPaginaActual(num)}
                        className={`py-2 px-3 font-medium border ${num === paginaActual ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition duration-150`}
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={handleNextPage}
                    disabled={paginaActual === totalPaginas || cargando}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50 transition duration-150"
                >
                    &gt;
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
                        <UsuarioForm
                            usuario={UsuarioEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuarioPage;