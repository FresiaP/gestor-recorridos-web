import { useEffect, useState } from 'react';
import { createMarca, updateMarca } from '../../../services/api';


const MarcaForm = ({ marca, onClose }) => {
    // Inicializamos el estado como true (activo por defecto)
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    // Nuevo estado para mostrar el mensaje de éxito temporalmente
    const [mensajeExito, setMensajeExito] = useState(null);

    const isEditing = !!marca;

    useEffect(() => {
        if (marca) {
            // Asignamos el valor recibido: marca.descripcion
            setDescripcion(marca.descripcionMarca || '');
            setEstado(marca.estado ?? true);
        } else {
            // Aseguramos que en modo creación, el estado siempre sea true
            setEstado(true);
        }


    }, [marca]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!descripcion.trim()) {
            setError("El nombre de la marca no puede estar vacío.");
            return;
        }
        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // Objeto que enviamos a la API
        const dataToSend = {
            descripcionMarca: descripcion.trim(),
            estado: estado
        };

        try {
            let resultado;
            if (isEditing) {
                // Modo Editar: Usa el ID de la marca
                resultado = await updateMarca(marca.idMarca, dataToSend);
            } else {
                // Modo Crear
                resultado = await createMarca(dataToSend);
            }

            const mensaje = `Marca ${isEditing ? 'actualizada' : 'creada'} con éxito.`;
            // Comportamiento: Mostrar mensaje y cerrar automáticamente después de 1.5s
            setMensajeExito(mensaje);

            // Devolvemos la categoría al padre para actualizar la lista
            setTimeout(() => {
                onClose(resultado); // resultado contiene la categoría actualizada o nueva
            }, 1500);

        } catch (err) {
            console.error("Error completo:", err);

            // VALIDACIÓN DE UNICIDAD/BAD REQUEST (400)
            let errorMessage = 'Error al guardar la marca.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            // Usamos un control de errores
            setError(errorMessage);
            setCargando(false); // Asegura que el botón se desbloquee si falla
        } finally {
            // Aseguramos que el botón se reactive si hubo error,
            // y no se queda "Guardando..." bloqueado
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Marca' : 'Crear Nueva Marca'}
            </h2>

            {/* Manejo de Error */}
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcionMarca">
                    Descripción de la Marca
                </label>
                <input
                    id="descripcionMarca"
                    type="text"
                    name="descripcionMarca"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={cargando || !!mensajeExito}
                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-indigo-200 transition duration-150"
                />
            </div>

            {/*Campo de Checkbox para el Estado (solo en Edición) */}
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
                        Marca Activa
                        <span className="text-gray-500 text-xs ml-2">
                            ({estado ? 'Visible' : 'Oculta/Desactivada'})
                        </span>
                    </label>
                </div>
            )}
            {/* Fin del Campo Estado */}

            {/*</div> <div className="flex items-center justify-end space-x-4 pt-4">*/}
            <div className="flex items-center justify-between mt-6">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition duration-150"
                    disabled={cargando || !!mensajeExito} // Deshabilita el botón si está cargando o ya tuvo éxito
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
        </form >
    );
};

export default MarcaForm;
