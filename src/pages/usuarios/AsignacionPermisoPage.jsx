// src/pages/usuarios/AsignacionPermisoPage.jsx
import React, { useState } from "react";
import AsyncSelect from "react-select/async";
import { asignarPermisosUsuario, getUsuariosPaginados, buscarPermisosSelect } from "../../services/api";

const AsignacionPermisoPage = () => {
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);

    // Cargar usuarios dinámicamente usando getUsuariosPaginados
    const loadUsuarios = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const data = await getUsuariosPaginados(1, 20, inputValue); // búsqueda por login/nombre
            return data.items.map((u) => ({
                value: u.idUsuario,
                label: `${u.login} - ${u.nombreApellido}`,
            }));
        } catch (err) {
            console.error("Error buscando usuarios:", err);
            return [];
        }
    };

    // Cargar permisos dinámicamente usando buscarPermisosSelect
    const loadPermisos = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const data = await buscarPermisosSelect(inputValue); // ya devuelve { value, label }
            return data;
        } catch (err) {
            console.error("Error buscando permisos:", err);
            return [];
        }
    };

    const handleAsignar = async () => {
        if (!usuarioSeleccionado || permisosSeleccionados.length === 0) {
            alert("Debes seleccionar un usuario y al menos un permiso.");
            return;
        }

        try {
            await asignarPermisosUsuario(
                usuarioSeleccionado.value,
                permisosSeleccionados.map((p) => p.value)
            );
            alert("Permisos asignados con éxito.");
            setUsuarioSeleccionado(null);
            setPermisosSeleccionados([]);
        } catch (err) {
            alert("Error al asignar permisos: " + err.message);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Asignación de Permisos</h1>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Seleccionar Usuario</label>
                <AsyncSelect
                    cacheOptions
                    loadOptions={loadUsuarios}
                    defaultOptions
                    value={usuarioSeleccionado}
                    onChange={setUsuarioSeleccionado}
                    placeholder="Buscar usuario por login o nombre..."
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Seleccionar Permisos</label>
                <AsyncSelect
                    isMulti
                    cacheOptions
                    loadOptions={loadPermisos}
                    defaultOptions
                    value={permisosSeleccionados}
                    onChange={setPermisosSeleccionados}
                    placeholder="Buscar permisos..."
                />
            </div>

            <button
                onClick={handleAsignar}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Asignar Permisos
            </button>
        </div>
    );
};

export default AsignacionPermisoPage;
