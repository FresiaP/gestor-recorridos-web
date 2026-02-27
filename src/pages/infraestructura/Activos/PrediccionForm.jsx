import { useState } from "react";
import { generarPrediccion, guardarPrediccion } from "../../../services/api";

const PrediccionForm = ({ idActivo, onPrediccionGenerada, onPrediccionGuardada }) => {
    const [umbral, setUmbral] = useState(0.7);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);


    const handleGenerar = async () => {
        if (!idActivo) return;
        setCargando(true);
        setError(null);

        try {
            const prediccion = await generarPrediccion(idActivo, parseFloat(umbral));

            if (onPrediccionGenerada) onPrediccionGenerada(prediccion);
        } catch (err) {
            setError(err.message || "Error al generar la predicción.");
        } finally {
            setCargando(false);
        }
    };

    const handleGuardar = async () => {
        if (!idActivo) return;
        setCargando(true);
        setError(null);

        try {
            const payload = { idActivo, umbral: parseFloat(umbral) };
            const nuevaPrediccion = await guardarPrediccion(payload);
            if (onPrediccionGuardada) onPrediccionGuardada(nuevaPrediccion);

        } catch (err) {
            setError(err.message || "Error al guardar la predicción.");
        } finally {
            setCargando(false);
        }
    };



    return (
        <div className="space-y-2">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium">Umbral</label>
                <input
                    type="number"
                    step="0.01"
                    value={umbral}
                    onChange={(e) => setUmbral(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                />
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleGenerar}
                    disabled={cargando}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {cargando ? "Calculando..." : "Calcular Predicción"}
                </button>

                <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={cargando}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {cargando ? "Guardando..." : "Guardar Predicción"}
                </button>
            </div>
        </div>
    );
};

export default PrediccionForm;
