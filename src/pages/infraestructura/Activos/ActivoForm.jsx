import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarCategoriasSelect,
    buscarEstadoSelect,
    buscarPropiedadLegalSelect,
    buscarTiposSelect,
    buscarUbicacionesSelect,
    createActivo,
    getCategoriaById,
    getEstadosById,
    getPropiedadLegalById,
    getTipoById,
    getUbicacionesById,
    updateActivo
} from '../../../services/api';

const ActivoForm = ({ activo, onClose }) => {
    const [OpcionesPropiedadLegal, setOpcionesPropiedadLegal] = useState([]);
    const [opcionesCategoria, setOpcionesCategoria] = useState([]);
    const [OpcionesUbicacion, setOpcionesUbicacion] = useState([]);
    const [OpcionesTipo, setOpcionesTipo] = useState([]);
    const [OpcionesEstado, setOpcionesEstado] = useState([]);
    const [form, setForm] = useState({
        nombreIdentificador: '',
        idPropiedadLegal: '',
        idTipo: '',
        idCategoria: '',
        idUbicacion: '',
        idEstado: '',
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!activo;

    //Carga de datos foráneos para editar
    useEffect(() => {
        if (activo) {
            setForm({
                idPropiedadLegal: activo.idPropiedadLegal?.toString() || '',
                idTipo: activo.idTipo?.toString() || '',
                idCategoria: activo.idCategoria?.toString() || '',
                idUbicacion: activo.idUbicacion?.toString() || '',
                nombreIdentificador: activo.nombreIdentificador || '',
                idEstado: activo.idEstado?.toString() || ''
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [propiedadLegal, tipo, categoria, ubicacion, estado] = await Promise.all([
                        getPropiedadLegalById(activo.idPropiedadLegal),
                        getTipoById(activo.idTipo),
                        getCategoriaById(activo.idCategoria),
                        getUbicacionesById(activo.idUbicacion),
                        getEstadosById(activo.idEstado)
                    ]);

                    setOpcionesPropiedadLegal([{ value: propiedadLegal.idPropiedadLegal, label: propiedadLegal.nombrePropiedadLegal }]);
                    setOpcionesTipo([{ value: tipo.idTipo, label: tipo.nombreTipo }]);
                    setOpcionesCategoria([{ value: categoria.idCategoria, label: categoria.nombreCategoria }]);
                    setOpcionesUbicacion([{ value: ubicacion.idUbicacion, label: ubicacion.descripcionUbicacion }]);
                    setOpcionesEstado([{ value: estado.idEstado, label: estado.nombreEstado }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [activo]);



    // Carga de datos si estamos editando
    useEffect(() => {
        if (activo) {
            setForm({
                idPropiedadLegal: activo.idPropiedadLegal?.toString() || '',
                idTipo: activo.idTipo?.toString() || '',
                idCategoria: activo.idCategoria?.toString() || '',
                idUbicacion: activo.idUbicacion?.toString() || '',
                nombreIdentificador: activo.nombreIdentificador || '',
                idEstado: activo.idEstado?.toString() || ''
            });
        }
    }, [activo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombreIdentificador.trim()) return setError("Debe escribir un nombre identificador.");
        if (!form.idPropiedadLegal) return setError("Debe seleccionar una propiedad Legal.");
        if (!form.idTipo) return setError("Debe seleccionar el tipo.");
        if (!form.idCategoria) return setError("Debe seleccionar una categoria.");
        if (!form.idUbicacion) return setError("Debe seleccionar una ubicación.");
        if (!form.idEstado) return setError("Debe seleccionar un estado.");



        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const payload = {
            ...form,
            idPropiedadLegal: parseInt(form.idPropiedadLegal),
            idTipo: parseInt(form.idTipo),
            idCategoria: parseInt(form.idCategoria),
            idUbicacion: parseInt(form.idUbicacion),
            idEstado: parseInt(form.idEstado),

        };

        try {
            if (isEditing) {
                await updateActivo(activo.idActivo, payload);
            } else {
                await createActivo(payload);
            }

            setMensajeExito(`Activo ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el Activo.';
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
                {isEditing ? 'Editar Activo' : 'Crear Nuevo Activo'}
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


            <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">Nombre Activo</label>
                <input
                    id="nombreIdentificador"
                    type="text"
                    name="nombreIdentificador"
                    value={form.nombreIdentificador}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {/* Tipo */}

                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">Tipo Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarTiposSelect(inputValue, 1, 50);
                        // Filtramos solo los que tengan label "Dispositivo" o "Servicio"
                        const filtradas = opciones.filter(
                            (o) => o.label === "Dispositivo" || o.label === "Servicio"
                        );
                        setOpcionesTipo(filtradas);
                        return filtradas;
                    }}
                    value={
                        form.idTipo
                            ? OpcionesTipo.find((o) => o.value === parseInt(form.idTipo)) || null
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idTipo: opcion?.value || "" }));
                        setOpcionesTipo((prev) => {
                            if (opcion && !prev.some((o) => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar tipo..."
                    isClearable
                    className="mb-2"
                />

                {/* Categoria */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">Categoría Asociada</label>
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
                            ? opcionesCategoria.find((o) => o.value === parseInt(form.idCategoria)) || {
                                value: form.idCategoria
                                    ? opcionesCategoria.find((o) => o.value === parseInt(form.idCategoria)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idCategoria: opcion?.value || '' }));
                        setOpcionesUbicacion((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar Categoría..."
                    isClearable
                    className="mb-2"
                />

                {/* Ubicación */}
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
                            ? OpcionesUbicacion.find((o) => o.value === parseInt(form.idUbicacion)) || {
                                value: form.idUbicacion
                                    ? OpcionesUbicacion.find((o) => o.value === parseInt(form.idUbicacion)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idUbicacion: opcion?.value || '' }));
                        setOpcionesUbicacion((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar ubicación..."
                    isClearable
                    className="mb-2"
                />

                {/* Propiedad Legal */}
                <label className="block text-gray-700 text-sm font-bold mb-2">Propiedad Legal Asociada</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarPropiedadLegalSelect(inputValue, 1, 50);
                        setOpcionesPropiedadLegal(opciones);
                        return opciones;
                    }}
                    value={
                        form.idPropiedadLegal
                            ? OpcionesPropiedadLegal.find((o) => o.value === parseInt(form.idPropiedadLegal)) || {
                                value: form.idPropiedadLegal
                                    ? OpcionesPropiedadLegal.find((o) => o.value === parseInt(form.idPropiedadLegal)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idPropiedadLegal: opcion?.value || '' }));
                        setOpcionesPropiedadLegal((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar Propiedad Legal..."
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

export default ActivoForm;
