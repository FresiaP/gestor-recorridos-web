import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarCategoriasSelect,
    buscarContratosSelect,
    buscarModelosSelect,
    buscarTiposSelect,
    buscarUbicacionesSelect,
    createDispositivo,
    getCategoriaById,
    getContratoById,
    getModeloById,
    getTipoById,
    getUbicacionesById,
    updateDispositivo,
} from '../../../services/api';

const DispositivoForm = ({ dispositivo, onClose }) => {
    const [OpcionesCategoria, setOpcionesCategoria] = useState([]);
    const [OpcionesTipo, setOpcionesTipo] = useState([]);
    const [OpcionesModelo, setOpcionesModelo] = useState([]);
    const [OpcionesUbicacion, setOpcionesUbicacion] = useState([]);
    const [OpcionesContrato, setOpcionesContrato] = useState([]);
    const [form, setForm] = useState({
        nombre: '',
        serie: '',
        idCategoria: '',
        idTipo: '',
        idModelo: '',
        idUbicacion: '',
        idContrato: '',
        estado: true,
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!dispositivo;

    //Carga de datos foráneos para editar
    useEffect(() => {
        if (dispositivo) {
            setForm({
                idCategoria: dispositivo.idCategoria?.toString() || '',
                idTipo: dispositivo.idTipo?.toString() || '',
                idModelo: dispositivo.idModelo?.toString() || '',
                idUbicacion: dispositivo.idUbicacion?.toString() || '',
                idContrato: dispositivo.idContrato?.toString() || '',
                nombre: dispositivo.nombre || '',
                serie: dispositivo.serie?.toString() || '',
                estado: dispositivo.estado ?? true
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [categoria, tipo, modelo, ubicacion, contrato] = await Promise.all([
                        getCategoriaById(dispositivo.idCategoria),
                        getTipoById(dispositivo.idTipo),
                        getModeloById(dispositivo.idModelo),
                        getUbicacionesById(dispositivo.idUbicacion),
                        getContratoById(dispositivo.idContrato)
                    ]);

                    setOpcionesCategoria([{ value: categoria.idCategoria, label: categoria.descripcion }]);
                    setOpcionesTipo([{ value: tipo.idTipo, label: tipo.nombre }]);
                    setOpcionesModelo([{ value: modelo.idModelo, label: modelo.descripcion }]);
                    setOpcionesUbicacion([{ value: ubicacion.idUbicacion, label: ubicacion.descripcion }]);
                    setOpcionesContrato([{ value: contrato.idContrato, label: contrato.numeroContrato }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [dispositivo]);



    // Carga de datos si estamos editando
    useEffect(() => {
        if (dispositivo) {
            setForm({
                idCategoria: dispositivo.idCategoria?.toString() || '',
                idTipo: dispositivo.idTipo?.toString() || '',
                idModelo: dispositivo.idModelo?.toString() || '',
                idUbicacion: dispositivo.idUbicacion?.toString() || '',
                idContrato: dispositivo.idContrato?.toString() || '',
                nombre: dispositivo.nombre || '',
                serie: dispositivo.serie?.toString() || '',
                estado: dispositivo.estado ?? true
            });
        }
    }, [dispositivo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.nombre.trim()) return setError("El nombre del dispositivo no puede estar vacío.");
        if (!form.serie.trim()) return setError("El número de serie no puede estar vacío.");
        if (!form.idTipo) return setError("Debe seleccionar el tipo.");
        if (!form.idCategoria) return setError("Debe seleccionar una categoría.");
        if (!form.idModelo) return setError("Debe seleccionar un modelo.");
        if (!form.idUbicacion) return setError("Debe seleccionar una ubicación.");
        if (!form.idContrato) return setError("Debe seleccionar un contrato.");

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const payload = {
            ...form,
            idCategoria: parseInt(form.idCategoria),
            idTipo: parseInt(form.idTipo),
            idModelo: parseInt(form.idModelo),
            idUbicacion: parseInt(form.idUbicacion),
            idContrato: parseInt(form.idContrato),
            nombre: form.nombre.trim(),
            serie: form.serie.trim(),
            estado: form.estado ?? true
        };

        try {
            if (isEditing) {
                await updateDispositivo(dispositivo.idDispositivo, payload);
            } else {
                await createDispositivo(payload);
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
        <form onSubmit={handleSubmit} className="p-4">
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

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">Nombre del Dispositivo</label>
                <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />

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
                            ? OpcionesCategoria.find((o) => o.value === parseInt(form.idCategoria)) || {
                                value: form.idCategoria
                                    ? OpcionesCategoria.find((o) => o.value === parseInt(form.idCategoria)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idCategoria: opcion?.value || '' }));
                        setOpcionesCategoria((prev) => {
                            // si no existe en la lista, la agregamos
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
                            ? OpcionesModelo.find((o) => o.value === parseInt(form.idModelo)) || {
                                value: form.idModelo
                                    ? OpcionesModelo.find((o) => o.value === parseInt(form.idModelo)) || null
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
                    className="mb-4"
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
                    className="mb-4"
                />

            </div>

            {isEditing && (
                <div className="mt-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={form.estado}
                        onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.checked }))}
                        className="mr-2"
                    />
                    <label className="text-sm text-gray-700 font-bold">
                        Dispositivo Activo
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

export default DispositivoForm;
