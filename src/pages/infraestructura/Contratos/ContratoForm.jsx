import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarEstadoSelect,
    buscarProveedoresSelect,
    createContrato,
    getProveedorById,
    updateContrato
} from '../../../services/api';

const ContratoForm = ({ contrato, onClose }) => {
    const [opcionesProveedor, setOpcionesProveedor] = useState([]);
    const [form, setForm] = useState({
        idProveedor: '',
        numeroContrato: '',
        montoContrato: '',
        fechaInicio: '',
        fechaFin: '',
        detalles: '',
        nombreEstado: '',
        detalleImpresion: {
            bolsonImpresionesCopiasBw: '',
            bolsonImpresionesCopiasColor: '',
            costoExcedenteBw: '',
            costoExcedenteColor: ''
        }
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!contrato;

    //Carga inicial de datos
    useEffect(() => {
        if (contrato) {
            setForm({
                idProveedor: contrato.idProveedor?.toString() || '',
                numeroContrato: contrato.numeroContrato || '',
                montoContrato: contrato.montoContrato?.toString() || '',
                fechaInicio: contrato.fechaInicio.toString() || '',
                fechaFin: contrato.fechaFin.toString(),
                bolsonImpresionesCopiasBw: contrato.bolsonImpresionesCopiasBw?.toString() || '',
                bolsonImpresionesCopiasColor: contrato.bolsonImpresionesCopiasColor?.toString() || '',
                costoExcedenteBw: contrato.costoExcedenteBw?.toString() || '',
                costoExcedenteColor: contrato.costoExcedenteColor?.toString() || '',
                nombreEstado: contrato.nombreEstado?.toString()
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [proveedor] = await Promise.all([
                        getProveedorById(contrato.idProveedor),
                    ]);

                    setOpcionesProveedor([{ value: proveedor.idProveedor, label: proveedor.nombre }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [contrato]);

    // Carga de datos si estamos editando
    useEffect(() => {
        if (contrato) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
            };

            setForm({
                idProveedor: contrato.idProveedor || '',
                numeroContrato: contrato.numeroContrato || '',
                montoContrato: contrato.montoContrato || '',
                detalles: contrato.detalles || '',
                fechaInicio: formatDate(contrato.fechaInicio),
                fechaFin: formatDate(contrato.fechaFin),
                detalleImpresion: contrato.detalleImpresion || {
                    bolsonImpresionesCopiasBw: '',
                    bolsonImpresionesCopiasColor: '',
                    costoExcedenteBw: '',
                    costoExcedenteColor: '',
                },
                nombreEstado: contrato.nombreEstado || ''
            });
        }
    }, [contrato]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleDetalleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            detalleImpresion: {
                ...prev.detalleImpresion,
                [name]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación básica
        if (
            !form.idProveedor ||
            !form.numeroContrato.trim() ||
            !form.montoContrato ||
            !form.fechaInicio ||
            !form.fechaFin
        ) {
            setError("Todos los campos obligatorios deben estar completos.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // Conversión segura de tipos
        const payload = {
            ...form,
            idProveedor: parseInt(form.idProveedor),
            numeroContrato: form.numeroContrato.trim(),
            detalles: form.detalles?.trim() ?? '',
            montoContrato: parseFloat(form.montoContrato),
            fechaInicio: form.fechaInicio,
            fechaFin: form.fechaFin,
            nombreEstado: form.nombreEstado,
            detalleImpresion: {
                bolsonImpresionesCopiasBw: parseInt(form.detalleImpresion.bolsonImpresionesCopiasBw || 0),
                bolsonImpresionesCopiasColor: parseInt(form.detalleImpresion.bolsonImpresionesCopiasColor || 0),
                costoExcedenteBw: parseFloat(form.detalleImpresion.costoExcedenteBw || 0),
                costoExcedenteColor: parseFloat(form.detalleImpresion.costoExcedenteColor || 0)
            }
        };

        try {
            let resultado;
            if (isEditing) {
                resultado = await updateContrato(contrato.idContrato, payload);
            } else {
                resultado = await createContrato(payload);
            }

            setMensajeExito(`Contrato ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(resultado), 1500);
        } catch (err) {
            let errorMessage = 'Error al guardar el contrato.';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="p-4">
            <h2 className="text-2xl font-semibold mb-4">
                {isEditing ? 'Editar Contrato' : 'Crear Nuevo Contrato'}
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

            {/* Proveedor */}
            <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Proveedor Asociado</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarProveedoresSelect(inputValue, 1, 50);
                        setOpcionesProveedor(opciones);
                        return opciones;
                    }}
                    value={
                        form.idProveedor
                            ? opcionesProveedor.find((o) => o.value === parseInt(form.idProveedor)) || {
                                value: form.idProveedor
                                    ? opcionesProveedor.find((o) => o.value === parseInt(form.idProveedor)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idProveedor: opcion?.value || '' }));
                        setOpcionesProveedor((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar proveedor..."
                    isClearable
                    className="mb-4"
                />
            </div>

            {/* Número y Monto */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Número de Contrato</label>
                    <input
                        type="text"
                        name="numeroContrato"
                        value={form.numeroContrato}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Monto</label>
                    <input
                        type="number"
                        name="montoContrato"
                        value={form.montoContrato}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Inicio</label>
                    <input
                        type="date"
                        name="fechaInicio"
                        value={form.fechaInicio}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Fin</label>
                    <input
                        type="date"
                        name="fechaFin"
                        value={form.fechaFin}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
            </div>

            {/* Detalles */}
            <div className="mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Detalles</label>
                <textarea
                    name="detalles"
                    value={form.detalles}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            {/* Detalle de Impresión */}
            <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Detalle de Impresión</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="number"
                        name="bolsonImpresionesCopiasBw"
                        placeholder="Bolson Copias B/N"
                        value={form.detalleImpresion.bolsonImpresionesCopiasBw}
                        onChange={handleDetalleChange}
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        name="bolsonImpresionesCopiasColor"
                        placeholder="Bolson Copias Color"
                        value={form.detalleImpresion.bolsonImpresionesCopiasColor}
                        onChange={handleDetalleChange}
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        name="costoExcedenteBw"
                        placeholder="Costo Excedente B/N"
                        value={form.detalleImpresion.costoExcedenteBw}
                        onChange={handleDetalleChange}
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        name="costoExcedenteColor"
                        placeholder="Costo Excedente Color"
                        value={form.detalleImpresion.costoExcedenteColor}
                        onChange={handleDetalleChange}
                        className="border rounded px-3 py-2"
                    />
                </div>
            </div>

            {/* Estado del contrato (solo en edición) */}
            <div className="mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    Estado del Contrato
                </label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={buscarEstadoSelect}
                    value={
                        form.nombreEstado
                            ? { value: form.nombreEstado, label: form.nombreEstado }
                            : null
                    }
                    onChange={(opcion) =>
                        setForm((prev) => ({ ...prev, nombreEstado: opcion?.label || '' }))
                    }
                    placeholder="Seleccionar estado del contrato..."
                    isClearable
                    className="mb-4"
                />
            </div>

            {/* Botones */}
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
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
                    disabled={cargando || !!mensajeExito}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
export default ContratoForm;
