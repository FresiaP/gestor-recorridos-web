import { useEffect, useState } from 'react';
import { createTipo, updateTipo } from '../../../services/api';

const TipoForm = ({ tipo, onClose }) => {
    const [nombre, setNombre] = useState('');
    const [estado, setEstado] = useState(true);

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    const isEditing = !!tipo;

    useEffect(() => {
        if (tipo) {
            setNombre(tipo.nombre || '');
            setEstado(tipo.estado ?? true);
        } else {
            setEstado(true);
        }
    }, [tipo]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre.trim()) {
            setError("El nombre del tipo no puede estar vacío.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // Objeto que enviamos a la API

        const dataToSend = {
            nombre: nombre.trim(),
            estado: estado
        };

        try {
            let resultado;

            if (isEditing) {
                resultado = await updateTipo(tipo.idTipo, dataToSend);
            } else {
                resultado = await createTipo(dataToSend);
            }

            const mensaje = `Tipo ${isEditing ? 'actualizada' : 'creada'} con éxito.`;
            setMensajeExito(mensaje);

            // Devolvemos la categoría al padre para actualizar la lista
            setTimeout(() => {
                onClose(resultado); // resultado contiene la categoría actualizada o nueva
            }, 1500);

        } catch (err) {
            console.error("Error completo:", err);

            // VALIDACIÓN DE UNICIDAD/BAD REQUEST (400)
            let errorMessage = 'Error al guardar tipo.';

            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setCargando(false);

        } finally {
            // Aseguramos que el botón se reactive si hubo error,
            // y no se queda "Guardando..." bloqueado
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4">
            <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? 'Editar Tipo' : 'Crear Nuevo Tipo'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">

                    {error}
                </div>
            )}

            {/* Manejo de Éxito: Mensaje visible durante el 1.5s antes del cierre */}
            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
                    {mensajeExito}
                </div>
            )}

            <div className="mb-4">
                <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="nombre"
                >
                    Tipo
                </label>
                <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>

            {/*Campo de Checkbox para el Estado (solo en Edición) */}
            {isEditing && (
                <div className="mb-4 flex items-center">
                    <input
                        id="estado"
                        type="checkbox"
                        checked={estado}
                        onChange={(e) => setEstado(e.target.checked)}
                        disabled={cargando || !!mensajeExito}
                        className="mr-2 leading-tight h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label
                        htmlFor="estado"
                        className="text-gray-700 text-sm font-bold"
                    >
                        Categoría Activa
                        <span className="text-gray-500 text-xs ml-2">
                            ({estado ? 'Visible' : 'Oculta/Desactivada'})
                        </span>
                    </label>
                </div>
            )}
            {/* Fin del Campo Estado */}

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
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
                    disabled={cargando || !!mensajeExito}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default TipoForm;