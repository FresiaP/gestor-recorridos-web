// src/pages/usuarios/AsignacionPermisoForm.jsx
import React, { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import {
    buscarPermisosSelect,
    asignarPermisosAUsuario
} from "../../services/api";

const AsignacionPermisoForm = ({ usuario, onClose }) => {
    const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    useEffect(() => {
        if (usuario?.permisos) {
            setPermisosSeleccionados(
                usuario.permisos.map((p) => ({
                    value: p.idPermiso,
                    label: p.nombre
                }))
            );
        }
    }, [usuario]);

    const loadPermisos = async (inputValue) => {
        try {
            const data = await buscarPermisosSelect(inputValue);
            return data;
        } catch (err) {
            console.error("Error buscando permisos:", err);
            return [];
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usuario) {
            setError("Debes seleccionar un usuario válido.");
            return;
        }
        if (permisosSeleccionados.length === 0) {
            setError("Debes seleccionar al menos un permiso.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        try {
            await asignarPermisosAUsuario(
                usuario.idUsuario,
                permisosSeleccionados.map((p) => p.value)
            );
            setMensajeExito("Permisos asignados con éxito.");
            setTimeout(() => {
                onClose(true); // notifica al padre que se actualizaron los permisos
            }, 1500);
        } catch (err) {
            setError(err.message || "Error al asignar permisos.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t mt-6">
            <h3 className="text-xl font-semibold mb-4">
                Asignar Permisos a {usuario?.login}
            </h3>

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

            <AsyncSelect
                isMulti
                cacheOptions
                loadOptions={loadPermisos}
                defaultOptions
                value={permisosSeleccionados}
                onChange={setPermisosSeleccionados}
                placeholder="Buscar permisos..."
                isDisabled={cargando || !!mensajeExito}
            />

            <div className="flex items-center justify-between mt-6">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    disabled={cargando || !!mensajeExito}
                >
                    {cargando ? "Guardando..." : "Asignar Permisos"}
                </button>
                <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    disabled={cargando || !!mensajeExito}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default AsignacionPermisoForm;
