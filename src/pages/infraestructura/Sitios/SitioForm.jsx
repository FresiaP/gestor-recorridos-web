import React, { useState, useEffect } from 'react';
import { createSitio, updateSitio } from '../../../services/api';

const SitioForm = ({ sitio, onClose }) => {
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    const isEditing = !!sitio;

    useEffect(() => {
        if (sitio) {
            setDescripcion(sitio.descripcion || '');
            setEstado(sitio.estado ?? true);
        } else {
            setEstado(true);
        }
    }, [sitio]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!descripcion.trim()) {
            setError("La descripción del sitio no puede estar vacía.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const dataToSend = {
            descripcion: descripcion.trim(),
            estado: estado
        };

        try {
            let resultado;
            if (isEditing) {
                resultado = await updateSitio(sitio.idSitio, dataToSend);
            } else {
                resultado = await createSitio(dataToSend);
            }

            const mensaje = `Sitio ${isEditing ? 'actualizado' : 'creado'} con éxito.`;
            setMensajeExito(mensaje);

            setTimeout(() => {
                onClose(resultado);
            }, 1500);
        } catch (err) {
            console.error("Error completo:", err);
            let errorMessage = 'Error al guardar el sitio.';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Sitio' : 'Crear Nuevo Sitio'}
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcion">
                    Descripción del Sitio
                </label>
                <input
                    id="descripcion"
                    type="text"
                    name="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-indigo-200 transition duration-150"
                />
            </div>

            {isEditing && (
                <div className="mb-4 flex items-center">
                    <input
                        className="mr-2 leading-tight h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        id="estado"
                        type="checkbox"
                        checked={estado}
                        onChange={(e) => setEstado(e.target.checked)}
                        disabled={cargando || !!mensajeExito}

                    />
                    <label className="text-gray-700 text-sm font-bold" htmlFor="estado">
                        Sitio Activo
                        <span className="text-gray-500 text-xs ml-2">
                            ({estado ? 'Visible' : 'Oculto/Desactivado'})
                        </span>
                    </label>
                </div>
            )}

            <div className="flex items-center justify-between mt-6">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition duration-150"
                    disabled={cargando || !!mensajeExito}
                >
                    {cargando ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar')}
                </button>
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-150"
                    disabled={cargando}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default SitioForm;
