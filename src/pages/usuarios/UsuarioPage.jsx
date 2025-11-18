// src/pages/usuarios/UsuarioPage.jsx
import React, { useState, useEffect } from 'react';
import UsuarioForm from './UsuarioForm';
import { getUsuariosPaginados, updateUsuario, deleteUsuario } from '../../services/api';

const UsuarioPage = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(false);

    const fetchData = async (pagina = 1) => {
        try {
            setCargando(true);
            const data = await getUsuariosPaginados(pagina, 10);
            setUsuarios(data.datos ?? []);
            setTotalPaginas(data.totalPaginas);
            setPaginaActual(pagina);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setUsuarios([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        fetchData(paginaActual);
    }, [paginaActual]);

    const handleCreate = () => {
        setUsuarioEditando(null);
        setIsModalOpen(true);
    };

    const handleEdit = (usuario) => {
        setUsuarioEditando(usuario);
        setIsModalOpen(true);
    };

    const handleCloseModal = (usuarioActualizado = false) => {
        setIsModalOpen(false);
        setUsuarioEditando(null);
        if (usuarioActualizado) fetchData(paginaActual);
    };

    const handleToggleEstado = async (usuario) => {
        try {
            await updateUsuario(usuario.idUsuario, { estado: !usuario.estado });
            fetchData(paginaActual);
        } catch (error) {
            console.error('Error al cambiar estado:', error);
        }
    };

    const handleDelete = async (idUsuario, login) => {
        if (window.confirm(`¿Seguro que deseas eliminar al usuario "${login}"?`)) {
            try {
                await deleteUsuario(idUsuario);
                fetchData(paginaActual);
            } catch (error) {
                console.error('Error al eliminar usuario:', error);
            }
        }
    };

    const handlePrevPage = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    const handleNextPage = () => {
        if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>

            <button
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded mb-4"
            >
                Crear Nuevo Usuario
            </button>

            {/* TABLA DE DATOS */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usuarios.map((u) => (
                            <tr key={u.idUsuario}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.idUsuario}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.login}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.nombreApellido}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {u.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(u)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition duration-150"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleToggleEstado(u)}
                                        className={`mr-3 transition duration-150 ${u.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                        title={u.estado ? 'Desactivar Usuario' : 'Activar Usuario'}
                                    >
                                        {u.estado ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.idUsuario, u.login)}
                                        className="text-red-600 hover:text-red-900 transition duration-150"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usuarios.length === 0 && !cargando && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
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
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50 transition duration-150"
                >
                    &gt;
                </button>
            </div>

            {/* MODAL DEL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
                        <UsuarioForm
                            usuario={usuarioEditando}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuarioPage;
