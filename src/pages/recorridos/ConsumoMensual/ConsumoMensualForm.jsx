import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarDispositivosSelect,
    generarConsolidado,
    getDispositivoById,
    updateConsumoMensual
} from "../../../services/api";

const ConsumoMensualForm = ({ consumoMensual, onClose }) => {
    const [OpcionesDispositivo, setOpcionesDispositivo] = useState([]);
    const [form, setFormData] = useState(
        consumoMensual || {
            idDispositivo: "",
            fechaCorte: "",
            contadorInicialMono: 0,
            contadorFinalMono: 0,
            contadorInicialColor: 0,
            contadorFinalColor: 0,
            totalMono: 0,
            totalColor: 0,
        }
    );

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeInfo, setMensajeInfo] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!consumoMensual;

    useEffect(() => {
        if (consumoMensual) {
            const formatDate = (fecha) => {
                if (!fecha) return '';
                const date = new Date(fecha);
                return date.toISOString().split('T')[0];
            };

            setFormData(prev => ({
                ...prev,
                idDispositivo: consumoMensual.idDispositivo?.toString() ?? '',
                fechaCorte: formatDate(consumoMensual.fechaCorte) ?? '',
                contadorInicialMono: consumoMensual.contadorInicialMono ?? 0,
                contadorFinalMono: consumoMensual.contadorFinalMono ?? 0,
                totalMono: consumoMensual.totalMono ?? 0,
                contadorInicialColor: consumoMensual.contadorInicialColor ?? 0,
                contadorFinalColor: consumoMensual.contadorFinalColor ?? 0,
                totalColor: consumoMensual.totalColor ?? 0,
            }));

            const cargarDatosForaneos = async () => {
                try {
                    const dispositivo = await getDispositivoById(consumoMensual.idDispositivo);
                    setOpcionesDispositivo([{ value: dispositivo.idDispositivo, label: dispositivo.nombreIdentificador }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [consumoMensual]);

    const handleGenerarConsolidado = async () => {
        try {
            const consolidado = await generarConsolidado(form.idDispositivo, form.fechaCorte);
            if (consolidado) {
                setFormData(prev => ({
                    ...prev,
                    contadorInicialMono: consolidado.contadorInicialMono,
                    contadorFinalMono: consolidado.contadorFinalMono,
                    totalMono: consolidado.totalMono,
                    contadorInicialColor: consolidado.contadorInicialColor,
                    contadorFinalColor: consolidado.contadorFinalColor,
                    totalColor: consolidado.totalColor,
                }));
                setMensajeInfo("Consolidado generado y guardado automáticamente.");
                setMensajeExito(null);
                setTimeout(() => onClose(true), 1500);

            } else {
                setError("No se pudo generar el consolidado.");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.mensaje || err.message || 'Error al generar el consolidado.';
            setError(`Error al generar consolidado: ${errorMessage}`);
        }

    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.idDispositivo) return setError("Debe seleccionar un dispositivo.");
        if (!form.fechaCorte.trim()) return setError("La fecha de corte no puede estar vacía.");

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        try {
            if (isEditing) {
                await updateConsumoMensual(consumoMensual.idConsumoMensual, form);
                setMensajeExito("Registro actualizado con éxito.");
                setTimeout(() => onClose(true), 1500);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Error al guardar el registro de consumo.';
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };

    //=============================================================================================================================
    //Renderizado
    //=============================================================================================================================
    return (
        <form onSubmit={handleSubmit} noValidate className="p-2">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 border-b pb-2">

                {isEditing ? 'Editar Consumo Mensual' : 'Generar Consumo Mensual'}

            </h2>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

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
                options={OpcionesDispositivo}
                value={
                    form.idDispositivo
                        ? OpcionesDispositivo.find((o) => o.value === parseInt(form.idDispositivo)) || null
                        : null
                }
                onChange={(opcion) => {
                    setFormData((prev) => ({ ...prev, idDispositivo: opcion?.value?.toString() ?? '' }));
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

            <div>
                <input
                    type="date"
                    name="fechaCorte"
                    value={form.fechaCorte?.slice(0, 10) || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                />

            </div>

            <button
                type="button"
                onClick={handleGenerarConsolidado}
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs mt-2"
            >
                Generar Consolidado
            </button>

            {/* Mensajes */}
            {mensajeInfo && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                    {mensajeInfo}
                </div>
            )}

            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
                    {mensajeExito}
                </div>
            )}

            {/* Campos calculados */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Inicial B/N</label>
                    <input
                        type="number"
                        name="contadorInicialMono"
                        value={form.contadorInicialMono}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Inicial Color</label>
                    <input
                        type="number"
                        name="contadorInicialColor"
                        value={form.contadorInicialColor}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Final B/N</label>
                    <input
                        type="number"
                        name="contadorFinalMono"
                        value={form.contadorFinalMono}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Final Color</label>
                    <input
                        type="number"
                        name="contadorFinalColor"
                        value={form.contadorFinalColor}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total B/N</label>
                    <input
                        type="number"
                        name="totalMono"
                        value={form.totalMono}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Color</label>
                    <input
                        type="number"
                        name="totalColor"
                        value={form.totalColor}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                        readOnly
                    />
                </div>

            </div>

            <div className="flex justify-end gap-2 mt-6">

                {isEditing && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                        disabled={cargando || !!mensajeExito}
                    >
                        {cargando ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                )}


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

export default ConsumoMensualForm;
