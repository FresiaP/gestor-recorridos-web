// src/pages/recorridos/Consumibles/ConsumibleForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarOtrosDispositivosSelect,
    buscarUsuarioSelect,
    createEstadoDispositivo,
    getOtrosDispositivoById,
    getUsuarioById,
    updateEstadoDispositivo
} from '../../../services/api';

const EstadoDispositivoForm = ({ estadodispositivo, onClose }) => {
    const [OpcionesOtrosDispositivos, setOpcionesOtrosDispositivos] = useState([]);
    const [OpcionesUsuario, setOpcionesUsuario] = useState([]);

    // 1. ESTADO INICIAL: Usamos el string '0' como valor inicial seguro
    const [form, setForm] = useState({
        idOtrosDispositivos: '',
        idUsuario: '',
        fechaEstado: '',
        detalles: '',
        comentarios: '',
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!estadodispositivo;

    // Carga de datos si estamos editando
    useEffect(() => {
        if (estadodispositivo) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
            };


            setForm({
                idOtrosDispositivos: estadodispositivo.idOtrosDispositivos?.toString() ?? '',
                idUsuario: estadodispositivo.idUsuario?.toString() ?? '',
                fechaEstado: formatDate(estadodispositivo.fechaEstado) ?? '',
                detalles: estadodispositivo.detalles?.toString() ?? '',
                comentarios: estadodispositivo.comentarios?.toString() ?? ''
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [otrosdispositivos, usuario] = await Promise.all([
                        getOtrosDispositivoById(estadodispositivo.idOtrosDispositivo),
                        getUsuarioById(estadodispositivo.idUsuario)
                    ]);

                    setOpcionesOtrosDispositivos([{ value: otrosdispositivos.idOtrosDispositivos, label: otrosdispositivos.nombre }]);
                    setOpcionesUsuario([{ value: usuario.idUsuario, label: usuario.nombreApellido }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [estadodispositivo]);


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
        if (!form.idOtrosDispositivos) return setError("Debe seleccionar un dispositivo.");
        if (!form.idUsuario) return setError("Debe seleccionar un usuario.");
        if (!form.fechaEstado.trim()) return setError("La fecha no puede estar vacía.");


        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // PAYLOAD: Usamos la función safeParseInt para los campos numéricos opcionales.
        const payload = {
            idOtrosDispositivos: safeParseInt(form.idOtrosDispositivos),
            idUsuario: safeParseInt(form.idUsuario),
            fechaEstado: form.fechaEstado,
            detalles: form.detalles,
            comentarios: form.comentarios
        };

        try {
            if (isEditing) {
                await updateEstadoDispositivo(estadodispositivo.idEstadoDispositivo, payload);
            } else {
                await createEstadoDispositivo(payload);
            }

            setMensajeExito(`Registro ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el registro de estado del dispositivo.';
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
                {isEditing ? 'Editar Estado de Dispositivo' : 'Crear Nuevo Registro'}
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
                            const opciones = await buscarOtrosDispositivosSelect(inputValue, 1, 50);
                            setOpcionesOtrosDispositivos(opciones);
                            return opciones;
                        }}
                        value={
                            form.idOtrosDispositivos
                                ? OpcionesOtrosDispositivos.find((o) => o.value === safeParseInt(form.idOtrosDispositivos)) || null
                                : null
                        }
                        onChange={(opcion) => {
                            setForm((prev) => ({ ...prev, idOtrosDispositivos: opcion?.value?.toString() ?? '' }));
                            setOpcionesOtrosDispositivos((prev) => {
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
                <input
                    type="date"
                    name="fechaEstado"
                    value={form.fechaEstado}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 mb-4"
                />

                {/* Input: Detalles */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detalles">Detalles</label>
                <input
                    id="detalles"
                    type="text"
                    name="detalles"
                    value={form.detalles}
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

export default EstadoDispositivoForm;