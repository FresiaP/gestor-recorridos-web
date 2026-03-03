import { useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    buscarDispositivosSelect,
    generarConsolidado
} from "../../../services/api";

const ConsumoMensualForm = ({ onClose }) => {

    const [opcionesDispositivo, setOpcionesDispositivo] = useState([]);
    const [idDispositivo, setIdDispositivo] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);
    const [error, setError] = useState(null);

    const handleGenerarConsolidado = async () => {
        if (!idDispositivo) {
            setError("Debe seleccionar un dispositivo.");
            return;
        }

        try {
            setCargando(true);
            setError(null);
            setMensajeExito(null);

            await generarConsolidado(idDispositivo);

            setMensajeExito("Consolidado generado correctamente.");

            // 👇 limpiar selección de dispositivo para permitir elegir otro
            setIdDispositivo("");

            // borrar mensaje de éxito después de 1.5s
            setTimeout(() => {
                setMensajeExito(null);
            }, 1500);

        } catch (err) {
            console.log("DATA ERROR:", err);

            let errorMessage = "Error al generar el consolidado.";

            if (err.response) {
                if (typeof err.response.data === "string") {
                    errorMessage = err.response.data;
                } else {
                    errorMessage =
                        err.response.data?.mensaje ||
                        err.response.data?.error ||
                        err.response.data?.message ||
                        errorMessage;
                }
            } else if (err.request) {
                errorMessage = "No se pudo conectar con el servidor.";
            }

            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                Generar Consolidado Mensual
            </h2>

            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
                    {mensajeExito}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <label className="block text-gray-700 text-sm font-bold mb-2">
                Dispositivo
            </label>

            <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={async (inputValue) => {
                    const opciones = await buscarDispositivosSelect(inputValue, 1, 50);
                    setOpcionesDispositivo(opciones);
                    return opciones;
                }}
                options={opcionesDispositivo}
                value={
                    opcionesDispositivo.find(o => o.value === parseInt(idDispositivo)) || null
                }
                onChange={(opcion) => {
                    setIdDispositivo(opcion?.value?.toString() ?? "");
                }}
                placeholder="Buscar y seleccionar dispositivo..."
                isClearable
                className="mb-4"
            />

            <button
                type="button"
                onClick={handleGenerarConsolidado}
                disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition"
            >
                {cargando ? "Generando..." : "Generar Consolidado"}
            </button>

            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
                    disabled={cargando}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default ConsumoMensualForm;
