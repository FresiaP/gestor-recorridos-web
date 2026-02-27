// src/pages/infraestructura/Modelos/ModeloForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarSitiosSelect,
    createUbicacion,
    getSitioById,
    updateUbicacion
} from '../../../services/api';

const UbicacionForm = ({ ubicacion, onClose }) => {
    const [opcionesSitio, setOpcionesSitio] = useState([]);
    const [form, setForm] = useState({
        idSitio: '',
        descripcionUbicacion: '',
        estado: true,
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!ubicacion;

    //Carga inicial de datos
    useEffect(() => {
        if (ubicacion) {
            setForm({
                idSitio: ubicacion.idSitio?.toString() || '',
                descripcionUbicacion: ubicacion.descripcionUbicacion || '',
                estado: ubicacion.estado ?? true
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [sitio] = await Promise.all([
                        getSitioById(ubicacion.idSitio),
                    ]);

                    setOpcionesSitio([{ value: sitio.idSitio, label: sitio.descripcionSitio }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [ubicacion]);

    //Función para recargar datos
    useEffect(() => {
        if (ubicacion) {
            setForm({
                idSitio: ubicacion.idSitio?.toString() || '',
                descripcionUbicacion: ubicacion.descripcionUbicacion || '',
                estado: ubicacion.estado ?? true
            });
        }
    }, [ubicacion]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.descripcionUbicacion.trim()) {
            setError("La descripción de la ubicación no puede estar vacía.");
            return;
        }
        if (!form.idSitio) {
            setError("Debe seleccionar un sitio.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // Conversión segura de tipos
        const payload = {
            ...form,
            idSitio: parseInt(form.idSitio),
            descripcionUbicacion: form.descripcionUbicacion.trim(),
            estado: form.estado ?? false
        };

        try {
            if (isEditing) {
                await updateUbicacion(ubicacion.idUbicacion, payload);
            } else {
                await createUbicacion(payload);
            }

            setMensajeExito(`Ubicación ${isEditing ? 'actualizado' : 'creado'} con éxito.`);

            // Cierra el modal y fuerza recarga en la tabla
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            let errorMessage = 'Error al guardar la ubicación.';
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
        <form onSubmit={handleSubmit} noValidate className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Ubicación' : 'Crear Nueva Ubicación'}
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcionUbicacion"> Descripción de la Ubicación</label>
                <input
                    id="descripcionUbicacion"
                    type="text"
                    name="descripcionUbicacion"
                    value={form.descripcionUbicacion}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idUbicacion">Sitio Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarSitiosSelect(inputValue, 1, 50);
                        setOpcionesSitio(opciones);
                        return opciones;
                    }}
                    value={
                        form.idSitio
                            ? opcionesSitio.find((o) => o.value === parseInt(form.idSitio)) || {
                                value: form.idSitio
                                    ? opcionesSitio.find((o) => o.value === parseInt(form.idSitio)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idSitio: opcion?.value || '' }));
                        setOpcionesSitio((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar sitio..."
                    isClearable
                    className="mb-4"
                />
            </div>

            {/* Estado (solo en edición) */}
            {isEditing && (
                <div className="mt-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={form.estado}
                        onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.checked }))}
                        className="mr-2"
                    />
                    <label className="text-sm text-gray-700 font-bold">
                        Ubicacion Activa
                        <span className="text-gray-500 text-xs ml-2">
                            ({form.estado ? 'Visible' : 'Oculto/Desactivado'})
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

export default UbicacionForm;
