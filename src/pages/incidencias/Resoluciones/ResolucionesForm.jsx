// src/pages/recorridos/Consumibles/ConsumibleForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarIncidenciasSelect,
    buscarUsuarioSelect,
    createResolucion,
    getIncidenciaById,
    getUsuarioById,
    updateResolucion
} from '../../../services/api';

const ResolucionForm = ({ resolucion, onClose }) => {
    const [OpcionesIncidencia, setOpcionesIncidencia] = useState([]);
    const [OpcionesUsuario, setOpcionesUsuario] = useState([]);

    // 1. ESTADO INICIAL
    const [form, setForm] = useState({
        idIncidencia: '',
        idUsuario: '',
        fechaResolucion: '',
        comentarios: '',
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!resolucion;

    // Carga de datos si estamos editando
    useEffect(() => {
        if (resolucion) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
            };


            setForm({
                idIncidencia: resolucion.idIncidencia?.toString() ?? '',
                fechaResolucion: formatDate(resolucion.fechaResolucion) ?? '',
                comentarios: resolucion.comentarios?.toString() ?? '0',
                idUsuario: resolucion.idUsuario?.toString() ?? '',
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [incidencia, usuario] = await Promise.all([
                        getIncidenciaById(resolucion.idIncidencia),
                        getUsuarioById(resolucion.idUsuario)
                    ]);

                    setOpcionesIncidencia([{ value: incidencia.idIncidencia, label: incidencia.detalle }]);
                    setOpcionesUsuario([{ value: usuario.idUsuario, label: usuario.nombreApellido }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [resolucion]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // FUNCIÓN HELPER: Convierte la cadena a entero, si está vacía, devuelve 0.
    const safeParseInt = (value) => {
        const trimmedValue = value?.trim();
        if (trimmedValue === '' || trimmedValue === null || trimmedValue === undefined) {
            return 0; // Monocromática: se envía 0 si el campo está vacío.
        }
        return parseInt(trimmedValue, 10) || 0; // Parsea a int o devuelve 0 si no es un número.
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // VALIDACIÓN DE CAMPOS REQUERIDOS MÍNIMOS
        if (!form.idIncidencia) return setError("Debe seleccionar una incidencia.");
        if (!form.idUsuario) return setError("Debe seleccionar un usuario.");
        if (!form.fechaResolucion.trim()) return setError("La fecha de resolucion no puede estar vacía.");


        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // PAYLOAD: Usamos la función safeParseInt para los campos numéricos opcionales.
        const payload = {
            idIncidencia: form.idIncidencia ? safeParseInt(form.idIncidencia) : null,
            fechaResolucion: form.fechaResolucion,
            idUsuario: form.idUsuario ? safeParseInt(form.idUsuario) : null,
            comentarios: form.comentarios || ''
        };
        try {
            if (isEditing) {
                await updateResolucion(resolucion.idResolucion, payload);
            } else {
                await createResolucion(payload);
            }

            setMensajeExito(`Registro ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el registro de resolucion.';
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
                {isEditing ? 'Editar Resolución' : 'Crear Nuevo Registro de Resolución'}
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
                    {/* Select Incidencia */}
                    <label className="block text-gray-700 text-sm font-bold mb-2">Incidencia Asociada</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={async (inputValue) => {
                            const opciones = await buscarIncidenciasSelect(inputValue, 1, 50);
                            setOpcionesIncidencia(opciones);
                            return opciones;
                        }}
                        value={
                            form.idIncidencia
                                ? OpcionesIncidencia.find((o) => o.value === parseInt(form.idIncidencia)) || null
                                : null
                        }
                        onChange={(opcion) => {
                            setForm((prev) => ({ ...prev, idIncidencia: opcion?.value?.toString() ?? '' }));
                            setOpcionesIncidencia((prev) => {
                                if (opcion && !prev.some(o => o.value === opcion.value)) {
                                    return [...prev, opcion];
                                }
                                return prev;
                            });
                        }}
                        placeholder="Buscar y seleccionar incidencia..."
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
                                ? OpcionesUsuario.find((o) => o.value === safeParseInt(form.idUsuario)) || null
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

                {/* Input Fecha Resolución */}
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Resolución</label>
                <input
                    type="date"
                    name="fechaResolucion"
                    value={form.fechaResolucion}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 mb-4"
                />

                {/* Comentarios */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cartuchoAmarillo">Comentarios</label>
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

export default ResolucionForm;