// src/pages/recorridos/Consumibles/ConsumibleForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarCategoriasSelect,
    buscarDispositivosSelect,
    buscarUsuarioSelect,
    createIncidencia,
    getCategoriaById,
    getDispositivoById,
    getUsuarioById,
    updateIncidencia
} from '../../../services/api';

const IncidenciaForm = ({ incidencia, onClose }) => {
    const [OpcionesDispositivo, setOpcionesDispositivo] = useState([]);
    const [OpcionesCategoria, setOpcionesCategoria] = useState([]);
    const [OpcionesUsuario, setOpcionesUsuario] = useState([]);

    // 1. ESTADO INICIAL: Usamos el string '0' como valor inicial seguro
    const [form, setForm] = useState({
        idDispositivo: '',
        idCategoria: '',
        idUsuario: '',
        fechaNotificacion: '',
        detalle: '',
        resuelta: false,

    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!incidencia;

    // Carga de datos si estamos editando
    useEffect(() => {
        if (incidencia) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
            };


            setForm({
                idDispositivo: incidencia.idDispositivo?.toString() ?? '',
                idCategoria: incidencia.idCategoria?.toString() ?? '',
                idUsuario: incidencia.idUsuario?.toString() ?? '',
                fechaNotificacion: formatDate(incidencia.fechaNotificacion) ?? '',
                detalle: incidencia.detalle?.toString() ?? '',
                resuelta: incidencia.resuelta ?? false
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [dispositivo, categoria, usuario] = await Promise.all([
                        getDispositivoById(incidencia.idDispositivo),
                        getCategoriaById(incidencia.idCategoria),
                        getUsuarioById(incidencia.idUsuario)
                    ]);

                    setOpcionesDispositivo([{ value: dispositivo.idDispositivo, label: dispositivo.nombre }]);
                    setOpcionesCategoria([{ value: categoria.idCategoria, label: categoria.descripcion }]);
                    setOpcionesUsuario([{ value: usuario.idUsuario, label: usuario.nombreApellido }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [incidencia]);


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

        // VALIDACIÓN DE CAMPOS REQUERIDOS MÍNIMOS
        if (!form.idDispositivo) return setError("Debe seleccionar un dispositivo.");
        if (!form.idCategoria) return setError("Debe seleccionar una categoria.");
        if (!form.idUsuario) return setError("Debe seleccionar un usuario.");
        if (!form.fechaNotificacion.trim()) return setError("La fecha de notificación no puede estar vacía.");



        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // PAYLOAD: Usamos la función safeParseInt para los campos numéricos opcionales.
        const payload = {
            idDispositivo: safeParseInt(form.idDispositivo),
            idCategoria: safeParseInt(form.idCategoria),
            idUsuario: safeParseInt(form.idUsuario),
            fechaNotificacion: new Date(form.fechaNotificacion).toISOString(),
            detalle: form.detalle,
            resuelta: form.resuelta
        };

        try {
            if (isEditing) {
                await updateIncidencia(incidencia.idIncidencia, payload);
            } else {
                await createIncidencia(payload);
            }

            setMensajeExito(`Registro ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el registro de incidencia.';
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
                {isEditing ? 'Editar incidencia' : 'Crear Nueva Incidencia'}
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
                    {/* Select Dispositivo */}
                    <label className="block text-gray-700 text-sm font-bold mb-2">Dispositivo Asociado</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={async (inputValue) => {
                            const opciones = await buscarDispositivosSelect(inputValue, 1, 50);
                            setOpcionesDispositivo(opciones);
                            return opciones;
                        }}
                        value={
                            form.idDispositivo
                                ? OpcionesDispositivo.find((o) => o.value === safeParseInt(form.idDispositivo)) || null
                                : null
                        }
                        onChange={(opcion) => {
                            setForm((prev) => ({ ...prev, idDispositivo: opcion?.value?.toString() ?? '' }));
                            setOpcionesDispositivo((prev) => {
                                if (opcion && !prev.some(o => o.value === opcion.value)) {
                                    return [...prev, opcion];
                                }
                                return prev;
                            });
                        }}
                        placeholder="Buscar y seleccionar dispositivo..."
                        isClearable
                        className="mb-4"
                    />

                    {/* Select Categoría */}
                    <label className="block text-gray-700 text-sm font-bold mb-2">Categoría Asociada</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={async (inputValue) => {
                            const opciones = await buscarCategoriasSelect(inputValue, 1, 50);
                            setOpcionesCategoria(opciones);
                            return opciones;
                        }}
                        value={
                            form.idCategoria
                                ? OpcionesCategoria.find((o) => o.value === safeParseInt(form.idCategoria)) || null
                                : null
                        }
                        onChange={(opcion) => {
                            setForm((prev) => ({ ...prev, idCategoria: opcion?.value?.toString() ?? '' }));
                            setOpcionesCategoria((prev) => {
                                if (opcion && !prev.some(o => o.value === opcion.value)) {
                                    return [...prev, opcion];
                                }
                                return prev;
                            });
                        }}
                        placeholder="Buscar y seleccionar categoría..."
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

                {/* Input Fecha Lectura */}
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Notificación</label>
                <input
                    type="date"
                    name="fechaNotificacion"
                    value={form.fechaNotificacion}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 mb-4"
                />

                {/* Input Cartucho Amarillo */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detalle">Detalles</label>
                <input
                    id="detalle"
                    type="text"
                    name="detalle"
                    value={form.detalle}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {isEditing && (
                    <div className="mt-4 flex items-center">
                        <input
                            type="checkbox"
                            checked={form.resuelta}
                            onChange={(e) => setForm(prev => ({ ...prev, resuelta: e.target.checked }))}
                            className="mr-2"
                        />
                        <label className="text-sm text-gray-700 font-bold">
                            Incidecia Resuelta
                            <span className="text-gray-500 text-xs ml-2">
                                ({form.resuelta ? 'Actualmente Resuelta' : 'Pendiente de Resolución'})
                            </span>
                        </label>
                    </div>
                )}


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

export default IncidenciaForm;