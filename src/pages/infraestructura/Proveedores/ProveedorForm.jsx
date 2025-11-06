import React, { useState, useEffect } from 'react';
import { createProveedor, updateProveedor } from '../../../services/api';

const ProveedorForm = ({ proveedor, onClose }) => {

    const [nombre, setNombre] = useState('');
    const [contacto, setContacto] = useState('');
    const [telefono, setTelefono] = useState('');
    const [estado, setEstado] = useState(true);

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    const isEditing = !!proveedor;

    useEffect(() => {
        if (proveedor) {
            // Inicialización de estados al editar
            setNombre(proveedor.nombre || '');
            setContacto(proveedor.contacto || '');
            setTelefono(proveedor.telefono || '');
            setEstado(proveedor.estado ?? true);
        } else {
            // Estado inicial al crear
            setEstado(true);
        }
    }, [proveedor]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación de campos obligatorios en el frontend
        if (!nombre.trim() || !contacto.trim() || !telefono.trim()) {
            setError("Todos los campos (Nombre, Contacto, Teléfono) son obligatorios.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // Objeto que enviamos a la API

        const dataToSend = {
            nombre: nombre.trim(),
            contacto: contacto.trim(),
            telefono: telefono.trim(),
            estado: estado
        };

        try {
            let resultado;

            if (isEditing) {
                resultado = await updateProveedor(proveedor.idProveedor, dataToSend);
            } else {
                resultado = await createProveedor(dataToSend);
            }

            const mensaje = `Proveedor ${isEditing ? 'actualizado' : 'creado'} con éxito.`;
            setMensajeExito(mensaje);

            // Devolvemos el proveedor al padre para actualizar la lista
            setTimeout(() => {
                onClose(resultado); // resultado contiene la categoría actualizada o nueva
            }, 1500);

        } catch (err) {
            console.error("Error completo:", err);

            // VALIDACIÓN DE UNICIDAD/BAD REQUEST (400)
            let errorMessage = 'Error al guardar el proveedor.';

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
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {isEditing ? `Editar Proveedor: ${proveedor.nombre}` : 'Crear Nuevo Proveedor'}
            </h3>

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

            {/* Campo NOMBRE */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
                    Nombre del Proveedor (Nombre)
                </label>
                <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    maxLength={50} // Máximo 50 caracteres según tu DTO
                    disabled={cargando || !!mensajeExito}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>

            {/* Campo CONTACTO */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contacto">
                    Nombre de Contacto
                </label>
                <input
                    id="contacto"
                    type="text"
                    name="contacto"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    required
                    maxLength={50} // Máximo 50 caracteres según tu DTO
                    disabled={cargando || !!mensajeExito}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
            </div>

            {/* Campo TELÉFONO */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="telefono">
                    Teléfono (Max 7 dígitos)
                </label>
                <input
                    id="telefono"
                    type="text"
                    name="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    maxLength={30} // Máximo 30 caracteres según tu DTO
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
                        className="mr-2 leading-tight h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="estado" className="text-gray-700 text-sm font-bold">
                        Proveedor Activo
                        <span className="text-gray-500 text-xs ml-2">
                            ({estado ? 'Visible' : 'Oculto/Desactivado'})
                        </span>
                    </label>
                </div>
            )}
            {/* Fin del Campo Estado */}


            <div className="flex justify-end space-x-2 mt-6">
                <button
                    type="button"
                    onClick={() => onClose(null)}
                    disabled={cargando}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={cargando || !!mensajeExito}
                    className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ${cargando || !!mensajeExito
                        ? 'bg-indigo-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                >
                    {cargando ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
            </div>
        </form>
    );
};

export default ProveedorForm;