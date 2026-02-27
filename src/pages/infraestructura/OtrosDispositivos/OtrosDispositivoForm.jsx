import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarActivosSelect,
    buscarEstadoSelect,
    buscarModelosSelect,
    buscarTiposSelect,
    createOtrosDispositivo,
    getActivosById,
    getEstadosById,
    getModeloById,
    getTipoById,
    updateOtrosDispositivo
} from '../../../services/api';

const OtrosDispositivoForm = ({ otrosdispositivo, onClose }) => {
    const [OpcionesTipo, setOpcionesTipo] = useState([]);
    const [opcionesModelo, setOpcionesModelo] = useState([]);
    const [OpcionesActivo, setOpcionesActivo] = useState([]);
    const [OpcionesEstado, setOpcionesEstado] = useState([]);
    const [form, setForm] = useState({
        serie: '',
        idTipo: '',
        idModelo: '',
        idActivo: '',
        idEstado: '',
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!otrosdispositivo;

    //Carga de datos foráneos para editar
    useEffect(() => {
        if (otrosdispositivo) {
            setForm({
                idTipo: otrosdispositivo.idTipo?.toString() || '',
                idModelo: otrosdispositivo.idModelo?.toString() || '',
                idActivo: otrosdispositivo.idActivo?.toString() || '',
                serie: otrosdispositivo.serie?.toString() || '',
                idEstado: otrosdispositivo.idEstado?.toString() || '',
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [tipo, modelo, activo, estado] = await Promise.all([
                        getTipoById(otrosdispositivo.idTipo),
                        getModeloById(otrosdispositivo.idModelo),
                        getActivosById(otrosdispositivo.idActivo),
                        getEstadosById(otrosdispositivo.idEstado),
                    ]);

                    setOpcionesTipo([{ value: tipo.idTipo, label: tipo.nombreTipo }]);
                    setOpcionesModelo([{ value: modelo.idModelo, label: modelo.descripcionModelo }]);
                    setOpcionesActivo([{ value: activo.idActivo, label: activo.nombreIdentificador }]);
                    setOpcionesEstado([{ value: estado.idEstado, label: estado.nombreEstado }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [otrosdispositivo]);



    // Carga de datos si estamos editando
    useEffect(() => {
        if (otrosdispositivo) {
            setForm({
                idTipo: otrosdispositivo.idTipo?.toString() || '',
                idModelo: otrosdispositivo.idModelo?.toString() || '',
                idActivo: otrosdispositivo.idActivo?.toString() || '',
                serie: otrosdispositivo.serie?.toString() || '',
                idEstado: otrosdispositivo.idEstado?.toString() || '',
            });
        }
    }, [otrosdispositivo]);

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
        if (!form.serie.trim()) return setError("El número de serie no puede estar vacío.");
        if (!form.idTipo) return setError("Debe seleccionar un tipo.");
        if (!form.idModelo) return setError("Debe seleccionar un modelo.");
        if (!form.idEstado) return setError("Debe seleccionar un estado.");


        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const payload = {
            ...form,
            idActivo: parseInt(form.idActivo),
            idTipo: parseInt(form.idTipo),
            idModelo: parseInt(form.idModelo),
            serie: form.serie.trim(),
            idEstado: parseInt(form.idEstado)
        };

        try {
            if (isEditing) {
                await updateOtrosDispositivo(otrosdispositivo.idOtrosDispositivos, payload);
            } else {
                await createOtrosDispositivo(payload);
            }

            setMensajeExito(`Dispositivo ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el dispositivo.';
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
                {isEditing ? 'Editar Dispositivo' : 'Crear Nuevo Dispositivo'}
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
                placeholder="Buscar y seleccionar Activos..."
                isClearable
                className="mb-4"
            />

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serie">Serie</label>
                <input
                    id="serie"
                    type="text"
                    name="serie"
                    value={form.serie}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />

            </div>

            <div className="mb-4">
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
                    className="mb-4"
                />

                <label className="block text-gray-700 text-sm font-bold mb-2">Modelo Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarModelosSelect(inputValue, 1, 50);
                        setOpcionesModelo(opciones);
                        return opciones;
                    }}
                    value={
                        form.idModelo
                            ? opcionesModelo.find((o) => o.value === parseInt(form.idModelo)) || {
                                value: form.idModelo
                                    ? opcionesModelo.find((o) => o.value === parseInt(form.idModelo)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idModelo: opcion?.value || '' }));
                        setOpcionesModelo((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar Modelo..."
                    isClearable
                    className="mb-4"
                />

                <label className="block text-gray-700 text-sm font-bold mb-2">Estado Asociado</label>
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
                    placeholder="Buscar y seleccionar Estado..."
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

export default OtrosDispositivoForm;
