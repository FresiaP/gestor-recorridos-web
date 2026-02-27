// src/pages/recorridos/Consumibles/ConsumibleForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarDispositivosSelect,
    buscarUsuarioSelect,
    createConsumible,
    extraerConsumible,
    extraerYGuardarConsumible,
    getDispositivoById,
    getUsuarioById,
    updateConsumible
} from '../../../services/api';

const ConsumibleForm = ({ consumible, onClose }) => {
    const [OpcionesDispositivo, setOpcionesDispositivo] = useState([]);
    const [OpcionesUsuario, setOpcionesUsuario] = useState([]);

    // 1. ESTADO INICIAL: Usamos el string '0' como valor inicial seguro
    const [form, setForm] = useState({
        idDispositivo: '',
        idUsuario: '',
        fechaLectura: '',
        cartuchoAmarillo: '0',
        cartuchoMagenta: '0',
        cartuchoCian: '0',
        cartuchoNegro: '0',
        contenedorResiduos: '0',
        kitAlimentador: '0',
        kitMantenimiento: '0',
        ip: ''
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!consumible;


    // Carga de datos si estamos editando
    useEffect(() => {
        if (consumible) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
            };


            setForm({
                idDispositivo: consumible.idDispositivo?.toString() ?? '',
                idUsuario: consumible.idUsuario?.toString() ?? '',
                fechaLectura: formatDate(consumible.fechaLectura) ?? '',
                cartuchoAmarillo: consumible.cartuchoAmarillo?.toString() ?? '0',
                cartuchoMagenta: consumible.cartuchoMagenta?.toString() ?? '0',
                cartuchoCian: consumible.cartuchoCian?.toString() ?? '0',
                cartuchoNegro: consumible.cartuchoNegro?.toString() ?? '0',
                contenedorResiduos: consumible.contenedorResiduos?.toString() ?? '0',
                kitAlimentador: consumible.kitAlimentador?.toString() ?? '',
                kitMantenimiento: consumible.kitMantenimiento?.toString() ?? ''

            });

            const cargarDatosForaneos = async () => {
                try {
                    const [dispositivo, usuario] = await Promise.all([
                        getDispositivoById(consumible.idDispositivo),
                        getUsuarioById(consumible.idUsuario)
                    ]);

                    setOpcionesDispositivo([{ value: dispositivo.idDispositivo, label: dispositivo.nombreIdentificador }]);
                    setOpcionesUsuario([{ value: usuario.idUsuario, label: usuario.nombreApellido }]);

                    setForm(prev => ({ ...prev, ip: dispositivo.ip ?? '' }));

                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [consumible]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Convierte a entero; si está vacío o null, devuelve 0.
    const safeParseInt = (value) => {
        if (value == null) return 0;

        if (typeof value === "number") {
            return value; // ya es número
        }

        if (typeof value === "string") {
            const trimmedValue = value.trim();
            if (trimmedValue === "") return 0;
            return parseInt(trimmedValue, 10) || 0;
        }

        return 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // VALIDACIÓN DE CAMPOS REQUERIDOS MÍNIMOS
        if (!form.idDispositivo) return setError("Debe seleccionar un dispositivo.");
        if (!form.idUsuario) return setError("Debe seleccionar un usuario.");

        // La validación de cartuchos de color se relaja para permitir el envío de "" (vacío) o "0"

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // PAYLOAD: Usamos la función safeParseInt para los campos numéricos opcionales.
        const payload = {
            idDispositivo: safeParseInt(form.idDispositivo),
            idUsuario: safeParseInt(form.idUsuario),
            cartuchoAmarillo: safeParseInt(form.cartuchoAmarillo),
            cartuchoMagenta: safeParseInt(form.cartuchoMagenta),
            cartuchoCian: safeParseInt(form.cartuchoCian),
            cartuchoNegro: safeParseInt(form.cartuchoNegro),
            contenedorResiduos: safeParseInt(form.contenedorResiduos),
            kitAlimentador: safeParseInt(form.kitAlimentador),
            kitMantenimiento: safeParseInt(form.kitMantenimiento)// ContenedorResiduos SIEMPRE debe ser un número (o 0).
        };

        try {
            if (isEditing) {
                await updateConsumible(consumible.idConsumible, payload);
            } else {
                await createConsumible(payload);
            }

            setMensajeExito(`Registro ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el registro de consumibles.';
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };

    //=============================================================================================
    //Renderizado
    //=============================================================================================
    return (
        <form onSubmit={handleSubmit} className="p-4 max-w-3xl mx-auto bg-white rounded-md shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Consumible' : 'Crear Nuevo Registro de Consumible'}
            </h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                    {error}
                </div>
            )}

            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2 animate-pulse">
                    {mensajeExito}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna 1 */}
                <div>
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
                        onChange={async (opcion) => {
                            setForm((prev) => ({ ...prev, idDispositivo: opcion?.value?.toString() ?? '' }));
                            if (opcion) {
                                try {
                                    const dispositivo = await getDispositivoById(opcion.value);
                                    setForm((prev) => ({ ...prev, ip: dispositivo.ip ?? '' }));
                                } catch (error) {
                                    console.error("Error al obtener IP del dispositivo:", error);
                                }
                            }
                        }}
                        placeholder="Buscar y seleccionar dispositivo..."
                        isClearable
                        className="mb-2"
                    />

                    {/* Select Usuario */}
                    <label className="block text-gray-700 text-sm font-bold">Técnico Asociado</label>
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
                    />

                    {/* Botón Extraer */}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const data = await extraerConsumible(form.ip);
                                setForm(prev => ({
                                    ...prev,
                                    cartuchoAmarillo: data.cartuchoAmarillo,
                                    cartuchoMagenta: data.cartuchoMagenta,
                                    cartuchoCian: data.cartuchoCian,
                                    cartuchoNegro: data.cartuchoNegro,
                                    contenedorResiduos: data.contenedorResiduos,
                                    kitAlimentador: data.kitAlimentador,
                                    kitMantenimiento: data.kitMantenimiento
                                }));
                            } catch (err) {
                                setError(err.response?.data?.error || "No se pudo establecer conexión con el recurso solicitado.");
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded mb-3"
                        disabled={!form.idDispositivo || !form.idUsuario}
                    >
                        Extraer desde impresora
                    </button>

                    {/* Botón Extraer y Guardar */}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const creado = await extraerYGuardarConsumible(
                                    form.ip,
                                    safeParseInt(form.idDispositivo),
                                    safeParseInt(form.idUsuario)
                                );
                                setMensajeExito(`Consumible guardado automáticamente con ID ${creado.idConsumible}`);
                                setTimeout(() => onClose(true), 1500);
                            } catch (err) {
                                setError(err.response?.data?.error || "No se pudo establecer conexión con el recurso solicitado.");
                            }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        disabled={!form.idDispositivo || !form.idUsuario}
                    >
                        Extraer y Guardar
                    </button>


                    {/* Input Cartucho Amarillo */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="cartuchoAmarillo">C. Amarillo (Opcional)</label>
                    <input
                        id="cartuchoAmarillo"
                        type="number"
                        name="cartuchoAmarillo"
                        value={form.cartuchoAmarillo}
                        onChange={handleChange}
                        // Quité 'required' para permitir dejar vacío o '0'
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />

                    {/* Input Cartucho Magenta */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="cartuchoMagenta">C. Magenta (Opcional)</label>
                    <input
                        id="cartuchoMagenta"
                        type="number"
                        name="cartuchoMagenta"
                        value={form.cartuchoMagenta}
                        onChange={handleChange}
                        // Quité 'required'
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>

                {/* Columna 2 */}
                <div>
                    {/* Input Cartucho Cian */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="cartuchoCian">C. Cian (Opcional)</label>
                    <input
                        id="cartuchoCian"
                        type="number"
                        name="cartuchoCian"
                        value={form.cartuchoCian}
                        onChange={handleChange}
                        // Quité 'required'
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />

                    {/* Input Cartucho Negro */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="cartuchoNegro">C. Negro</label>
                    <input
                        id="cartuchoNegro"
                        type="number"
                        name="cartuchoNegro"
                        value={form.cartuchoNegro}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />

                    {/* Input Contenedor Residuos */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="contenedorResiduos">C. Residuos</label>
                    <input
                        id="contenedorResiduos"
                        type="number"
                        name="contenedorResiduos"
                        value={form.contenedorResiduos}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />

                    {/* Input Kit Alimentador */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="kitAlimentador">K. Alim.</label>
                    <input
                        id="kitAlimentador"
                        type="number"
                        name="kitAlimentador"
                        value={form.kitAlimentador}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />

                    {/* Input Kit Mantenimiento */}
                    <label className="block text-gray-700 text-sm font-bold" htmlFor="kitMantenimiento">K. Mantto.</label>
                    <input
                        id="kitMantenimiento"
                        type="number"
                        name="kitMantenimiento"
                        value={form.kitMantenimiento}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-2 py-2"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mt-2">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition duration-150"
                    disabled={cargando || !!mensajeExito}
                >
                    {cargando ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar')}
                </button>
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-2 rounded transition duration-150"
                    disabled={cargando}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );

};

export default ConsumibleForm;