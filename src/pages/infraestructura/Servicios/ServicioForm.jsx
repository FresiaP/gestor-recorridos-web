import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarActivosSelect,
    buscarContratosSelect,
    buscarEstadoSelect,
    buscarTiposSelect,
    createServicio,
    getActivosById,
    getContratoById,
    getEstadosById,
    getTipoById,
    updateServicio
} from '../../../services/api';

const ServicioForm = ({ servicio, onClose }) => {
    const [OpcionesTipo, setOpcionesTipo] = useState([]);
    const [OpcionesActivo, setOpcionesActivo] = useState([]);
    const [OpcionesEstado, setOpcionesEstado] = useState([]);
    const [OpcionesContrato, setOpcionesContrato] = useState([]);
    const [form, setForm] = useState({
        idActivo: '',
        idTipo: '',
        idContrato: '',
        idEstado: '',
        capacidad: '',
        detalles: '',
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!servicio;

    //Carga de datos foráneos para editar
    useEffect(() => {
        if (servicio) {
            setForm({
                idActivo: servicio.idActivo?.toString() || '',
                idTipo: servicio.idTipo?.toString() || '',
                idContrato: servicio.idContrato?.toString() || '',
                capacidad: servicio.capacidad?.toString() || '',
                detalles: servicio.detalles?.toString() || '',
                idEstado: servicio.IdEstado?.toString() || ''
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [activo, tipo, contrato, estado] = await Promise.all([
                        getActivosById(servicio.idActivo),
                        getTipoById(servicio.idTipo),
                        getContratoById(servicio.idContrato),
                        getEstadosById(servicio.idEstado)
                    ]);

                    setOpcionesActivo([{ value: activo.idActivo, label: activo.nombreIdentificador }]);
                    setOpcionesTipo([{ value: tipo.idTipo, label: tipo.nombreTipo }]);
                    setOpcionesContrato([{ value: contrato.idContrato, label: contrato.numeroContrato }]);
                    setOpcionesEstado([{ value: estado.idEstado, label: estado.nombreEstado }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [servicio]);



    // Carga de datos si estamos editando
    useEffect(() => {
        if (servicio) {
            setForm({
                idActivo: servicio.idActivo?.toString() || '',
                idTipo: servicio.idTipo?.toString() || '',
                idContrato: servicio.idContrato?.toString() || '',
                capacidad: servicio.capacidad?.toString() || '',
                detalles: servicio.detalles?.toString() || '',
                idEstado: servicio.idEstado?.toString() || ''
            });
        }
    }, [servicio]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.idActivo) return setError("Debe seleccionar un activo.");
        if (!form.capacidad.trim()) return setError("La capacidad no puede estar vacía.");
        if (!form.detalles.trim()) return setError("Debe escribir algún detalle.");
        if (!form.idTipo) return setError("Debe seleccionar el tipo.");
        if (!form.idContrato) return setError("Debe seleccionar un contrato.");
        if (!form.idEstado) return setError("Debe seleccionar un estado.");



        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const payload = {
            ...form,
            idActivo: parseInt(form.idActivo),
            idTipo: parseInt(form.idTipo),
            idContrato: parseInt(form.idContrato),
            idEstado: parseInt(form.idEstado),
            capacidad: form.capacidad.trim(),
            detalles: form.detalles.trim(),

        };

        try {
            if (isEditing) {
                await updateServicio(servicio.idServicio, payload);
            } else {
                await createServicio(payload);
            }

            setMensajeExito(`Servicio ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el servicio.';
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };

    //=============================================================================================
    //Renderizado
    //============================================================================================

    return (
        <form onSubmit={handleSubmit} noValidate className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
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


            <label className="block text-gray-700 text-sm font-bold mb-2">Activo Asociado</label>
            <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={async (inputValue) => {
                    const opciones = await buscarActivosSelect(inputValue, 1, 50);
                    setOpcionesActivo(opciones);
                    return opciones;
                }}
                value={
                    form.idActivo
                        ? OpcionesActivo.find((o) => o.value === parseInt(form.idActivo)) || {
                            value: form.idActivo
                                ? OpcionesActivo.find((o) => o.value === parseInt(form.idActivo)) || null
                                : null
                        }
                        : null
                }
                onChange={(opcion) => {
                    setForm((prev) => ({ ...prev, idActivo: opcion?.value || '' }));
                    setOpcionesActivo((prev) => {
                        // si no existe en la lista, la agregamos
                        if (opcion && !prev.some(o => o.value === opcion.value)) {
                            return [...prev, opcion];
                        }
                        return prev;
                    });
                }}
                placeholder="Buscar y seleccionar Activo..."
                isClearable
                className="mb-2"
            />

            <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="capacidad">Capacidad</label>
                <input
                    id="capacidad"
                    type="text"
                    name="capacidad"
                    value={form.capacidad}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />

                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="detalles">Detalles</label>
                <input
                    id="detalles"
                    type="text"
                    name="detalles"
                    value={form.detalles}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />

                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">Tipo Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarTiposSelect(inputValue, 1, 50);
                        setOpcionesTipo(opciones);
                        return opciones;
                    }}
                    value={
                        form.idTipo
                            ? OpcionesTipo.find((o) => o.value === parseInt(form.idTipo)) || {
                                value: form.idTipo
                                    ? OpcionesTipo.find((o) => o.value === parseInt(form.idTipo)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idTipo: opcion?.value || '' }));
                        setOpcionesTipo((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar tipo..."
                    isClearable
                    className="mb-2"
                />


                <label className="block text-gray-700 text-sm font-bold mb-2">Contrato Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarContratosSelect(inputValue, 1, 50);
                        setOpcionesContrato(opciones);
                        return opciones;
                    }}
                    value={
                        form.idContrato
                            ? OpcionesContrato.find((o) => o.value === parseInt(form.idContrato)) || {
                                value: form.idContrato
                                    ? OpcionesContrato.find((o) => o.value === parseInt(form.idContrato)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idContrato: opcion?.value || '' }));
                        setOpcionesContrato((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar contrato..."
                    isClearable
                    className="mb-2"
                />

                {/* Estado */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">Estado Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarEstadoSelect(inputValue, 1, 50);
                        setOpcionesEstado(opciones);
                        return opciones;
                    }}
                    value={
                        form.idEstado
                            ? OpcionesEstado.find((o) => o.value === parseInt(form.idEstado)) || {
                                value: form.idEstado
                                    ? OpcionesEstado.find((o) => o.value === parseInt(form.idEstado)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idEstado: opcion?.value || '' }));
                        setOpcionesEstado((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar estado..."
                    isClearable
                    className="mb-4"
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

export default ServicioForm;
