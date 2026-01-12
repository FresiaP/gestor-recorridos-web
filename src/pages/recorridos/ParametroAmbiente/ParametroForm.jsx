// src/pages/recorridos/Consumibles/ConsumibleForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarUbicacionesSelect,
    buscarUsuarioSelect,
    createParametroAmbiente,
    getUbicacionesById,
    getUsuarioById,
    updateParametroAmbiente
} from '../../../services/api';

const ParametroForm = ({ parametro, onClose }) => {
    const [OpcionesUbicacion, setOpcionesUbicacion] = useState([]);
    const [OpcionesUsuario, setOpcionesUsuario] = useState([]);

    const [form, setForm] = useState({
        idUbicacion: '',
        idUsuario: '',
        fechaRecorrido: '',
        temperatura: '',
        humedad: '',
        comentarios: ''
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!parametro;

    // Carga de datos si estamos editando
    useEffect(() => {
        if (parametro) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
            };


            setForm({
                idUbicacion: parametro.idUbicacion?.toString() ?? '',
                idUsuario: parametro.idUsuario?.toString() ?? '',
                fechaRecorrido: formatDate(parametro.fechaRecorrido) ?? '',
                temperatura: parametro.temperatura?.toString() ?? '0',
                humedad: parametro.humedad?.toString() ?? '0',
                comentarios: parametro.comentarios?.toString() ?? ''
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [ubicacion, usuario] = await Promise.all([
                        getUbicacionesById(parametro.idUbicacion),
                        getUsuarioById(parametro.idUsuario)
                    ]);

                    setOpcionesUbicacion([{ value: ubicacion.idUbicacion, label: ubicacion.descripcion }]);
                    setOpcionesUsuario([{ value: usuario.idUsuario, label: usuario.nombreApellido }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [parametro]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // FUNCIÓN HELPER: Convierte la cadena a entero, si está vacía, devuelve 0.
    const safeParseInt = (value) => {
        const trimmedValue = value?.trim();
        if (trimmedValue === '' || trimmedValue === null || trimmedValue === undefined) {
            return 0;
        }
        return parseInt(trimmedValue, 10) || 0; // Parsea a int o devuelve 0 si no es un número.
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.idUbicacion) return setError("Debe seleccionar una ubicación.");
        if (!form.idUsuario) return setError("Debe seleccionar un usuario.");
        if (!form.fechaRecorrido.trim()) return setError("La fecha de recorrido no puede estar vacía.");

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const payload = {
            idUbicacion: parseInt(form.idUbicacion),
            idUsuario: parseInt(form.idUsuario),
            fechaRecorrido: new Date(form.fechaRecorrido).toISOString(),
            temperatura: form.temperatura === '' ? 0 : parseFloat(form.temperatura),
            humedad: form.humedad === '' ? 0 : parseFloat(form.humedad),
            comentarios: form.comentarios || ""
        };

        try {
            if (isEditing) {
                // 👇 Usa idParametroAmbiente, no idParamAmbiente
                await updateParametroAmbiente(parametro.idParametroAmbiente, payload);
            } else {
                await createParametroAmbiente(payload);
            }

            setMensajeExito(`Registro ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el registro de parámetro.';
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };


    //=============================================================================================
    //Renderizado
    //============================================================================================

    return (
        <form onSubmit={handleSubmit} className="p-2">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Parámetro' : 'Crear Nuevo Registro de Parámetro'}
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
                <div className="mb-4">
                    {/* Select Ubicación */}
                    <label className="block text-gray-700 text-sm font-bold mb-2">Ubicación Asociada</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={async (inputValue) => {
                            const opciones = await buscarUbicacionesSelect(inputValue, 1, 50);
                            setOpcionesUbicacion(opciones);
                            return opciones;
                        }}
                        value={
                            form.idUbicacion
                                ? OpcionesUbicacion.find((o) => o.value === safeParseInt(form.idUbicacion))
                                || { value: safeParseInt(form.idUbicacion), label: parametro?.descripcionUbicacion }
                                : null
                        }
                        onChange={(opcion) => {
                            setForm((prev) => ({ ...prev, idUbicacion: opcion?.value?.toString() ?? '' }));
                            setOpcionesUbicacion((prev) => {
                                if (opcion && !prev.some(o => o.value === opcion.value)) {
                                    return [...prev, opcion];
                                }
                                return prev;
                            });
                        }}
                        placeholder="Buscar y seleccionar ubicacion..."
                        isClearable
                        className="mb-4"
                    />

                    {/* Select Usuario */}
                    <label className="block text-gray-700 text-sm font-bold mb-2">Técnico Asociado</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={async (inputValue) => {
                            const opciones = await buscarUsuarioSelect(inputValue, 1, 50);
                            setOpcionesUsuario(opciones);
                            return opciones;
                        }}
                        value={
                            form.idUsuario
                                ? OpcionesUsuario.find((o) => o.value === safeParseInt(form.idUsuario))
                                || { value: safeParseInt(form.idUsuario), label: parametro?.nombreApellido }
                                : null
                        }
                        onChange={(opcion) => {
                            setForm((prev) => ({ ...prev, idUsuario: opcion?.value?.toString() ?? '' }));
                            setOpcionesUsuario((prev) => {
                                if (opcion && !prev.some(o => o.value === opcion.value)) {
                                    return [...prev, opcion];
                                }
                                return prev;
                            });
                        }}
                        placeholder="Buscar y seleccionar Técnico..."
                        isClearable
                        className="mb-4"
                    />
                </div>

                {/* Input Fecha Lectura */}
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Recorrido</label>
                <input
                    type="date"
                    name="fechaRecorrido"
                    value={form.fechaRecorrido}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 mb-4"
                />

                {/* Input temperatura */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="temperatura">Temperatura</label>
                <input
                    id="temperatura"
                    type="number"
                    name="temperatura"
                    value={form.temperatura}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {/* Input humedad */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="humedad">Humedad</label>
                <input
                    id="humedad"
                    type="number"
                    name="humedad"
                    value={form.humedad}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {/* Input Comentarios */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comentarios">Comentarios</label>
                <input
                    id="comentarios"
                    type="text"
                    name="comentarios"
                    value={form.comentarios}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

            </div>


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

export default ParametroForm;