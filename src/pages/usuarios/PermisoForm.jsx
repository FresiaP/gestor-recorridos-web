// src/pages/usuarios/PermisoForm.jsx
import React, { useState, useEffect } from 'react';
import { createPermiso, updatePermiso } from '../../services/api';

const PermisoForm = ({ permiso, onClose }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState(true);

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    const isEditing = !!permiso;

    useEffect(() => {
        if (permiso) {
            setNombre(permiso.nombre || '');
            setDescripcion(permiso.descripcion || '');
            setEstado(permiso.estado ?? true);
        } else {
            setNombre('');
            setDescripcion('');
            setEstado(true);
        }
    }, [permiso]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre.trim()) {
            setError("El nombre del permiso no puede estar vacío.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const dataToSend = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            estado
        };

        try {
            let resultado;
            if (isEditing) {
                resultado = await updatePermiso(permiso.idPermiso, dataToSend);
            } else {
                resultado = await createPermiso(dataToSend);
            }

            setMensajeExito(`Permiso ${isEditing ? 'actualizado' : 'creado'} con éxito.`);

            setTimeout(() => {
                onClose(resultado);
            }, 1500);

        } catch (err) {
            setError(err.message || "Error al guardar el permiso.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4">
            <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? 'Editar Permiso' : 'Crear Nuevo Permiso'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
                    {mensajeExito}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="shadow border rounded w-full py-2 px-3"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={cargando || !!mensajeExito}
                    className="shadow border rounded w-full py-2 px-3"
                />
            </div>

            {isEditing && (
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={estado}
                        onChange={(e) => setEstado(e.target.checked)}
                        disabled={cargando || !!mensajeExito}
                        className="mr-2 h-5 w-5 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="text-gray-700 text-sm font-bold">
                        Permiso Activo
                        <span className="text-gray-500 text-xs ml-2">
                            ({estado ? 'Activo' : 'Inactivo'})
                        </span>
                    </label>
                </div>
            )}

            <div className="flex items-center justify-between mt-6">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    disabled={cargando || !!mensajeExito}
                >
                    {cargando ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar')}
                </button>
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    disabled={cargando || !!mensajeExito}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default PermisoForm;
