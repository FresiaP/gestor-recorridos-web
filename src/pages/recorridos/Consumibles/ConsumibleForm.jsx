// src/pages/recorridos/Consumibles/ConsumibleForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarDispositivosSelect,
    buscarUsuarioSelect,
    createConsumible,
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
                contenedorResiduos: consumible.contenedorResiduos?.toString() ?? '0'
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [dispositivo, usuario] = await Promise.all([
                        getDispositivoById(consumible.idDispositivo),
                        getUsuarioById(consumible.idUsuario)
                    ]);

                    setOpcionesDispositivo([{ value: dispositivo.idDispositivo, label: dispositivo.nombre }]);
                    setOpcionesUsuario([{ value: usuario.idUsuario, label: usuario.nombreApellido }]);
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
        if (!form.idDispositivo) return setError("Debe seleccionar un dispositivo.");
        if (!form.idUsuario) return setError("Debe seleccionar un usuario.");
        if (!form.fechaLectura.trim()) return setError("La fecha de lectura no puede estar vacía.");

        // La validación de cartuchos de color se relaja para permitir el envío de "" (vacío) o "0"

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // PAYLOAD: Usamos la función safeParseInt para los campos numéricos opcionales.
        const payload = {
            idDispositivo: safeParseInt(form.idDispositivo),
            idUsuario: safeParseInt(form.idUsuario),
            fechaLectura: form.fechaLectura,
            cartuchoAmarillo: safeParseInt(form.cartuchoAmarillo),
            cartuchoMagenta: safeParseInt(form.cartuchoMagenta),
            cartuchoCian: safeParseInt(form.cartuchoCian),
            cartuchoNegro: safeParseInt(form.cartuchoNegro),
            contenedorResiduos: safeParseInt(form.contenedorResiduos) // ContenedorResiduos SIEMPRE debe ser un número (o 0).
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
    //============================================================================================

    return (
        <form onSubmit={handleSubmit} className="p-2">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Consumible' : 'Crear Nuevo Registro de Consumible'}
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Lectura</label>
                <input
                    type="date"
                    name="fechaLectura"
                    value={form.fechaLectura}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2 mb-4"
                />

                {/* Input Cartucho Amarillo */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cartuchoAmarillo">C. Amarillo (Opcional)</label>
                <input
                    id="cartuchoAmarillo"
                    type="number"
                    name="cartuchoAmarillo"
                    value={form.cartuchoAmarillo}
                    onChange={handleChange}
                    // Quité 'required' para permitir dejar vacío o '0'
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {/* Input Cartucho Magenta */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cartuchoMagenta">C. Magenta (Opcional)</label>
                <input
                    id="cartuchoMagenta"
                    type="number"
                    name="cartuchoMagenta"
                    value={form.cartuchoMagenta}
                    onChange={handleChange}
                    // Quité 'required'
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {/* Input Cartucho Cian */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cartuchoCian">C. Cian (Opcional)</label>
                <input
                    id="cartuchoCian"
                    type="number"
                    name="cartuchoCian"
                    value={form.cartuchoCian}
                    onChange={handleChange}
                    // Quité 'required'
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {/* Input Cartucho Negro */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cartuchoNegro">C. Negro</label>
                <input
                    id="cartuchoNegro"
                    type="number"
                    name="cartuchoNegro"
                    value={form.cartuchoNegro}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
                />

                {/* Input Contenedor Residuos */}
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contenedorResiduos">C. Residuos</label>
                <input
                    id="contenedorResiduos"
                    type="number"
                    name="contenedorResiduos"
                    value={form.contenedorResiduos}
                    onChange={handleChange}
                    required
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

export default ConsumibleForm;