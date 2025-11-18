// src/pages/usuarios/UsuarioForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import AsyncSelect from 'react-select/async';
import {
    createUsuario,
    updateUsuario,
    buscarPermisosSelect,
    asignarPermisosUsuario,
    getPermisosUsuario
} from '../../services/api';

const UsuarioForm = ({ usuario, onClose }) => {
    const isEditing = !!usuario;

    const emptyForm = useMemo(() => ({
        login: '',
        nombreApellido: '',
        password: '',
        estado: true,
        permisos: []
    }), []);

    const [form, setForm] = useState(emptyForm);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);

    // Inicializa limpio al crear y carga datos solo al editar
    useEffect(() => {
        let cancel = false;

        const init = async () => {
            // Crear → siempre limpiar
            if (!isEditing) {
                setForm(emptyForm);
                return;
            }

            // Editar → cargar datos actuales + permisos
            try {
                const permisosActuales = await getPermisosUsuario(usuario.idUsuario);
                if (cancel) return;

                setForm({
                    login: usuario.login || '',
                    nombreApellido: usuario.nombreApellido || '',
                    password: '',
                    estado: usuario.estado ?? true,
                    permisos: (permisosActuales || []).map(p => ({
                        value: p.idPermiso,
                        label: p.descripcion
                    }))
                });
            } catch (err) {
                // Si falla cargar permisos, al menos carga los campos básicos
                if (cancel) return;
                setForm({
                    login: usuario.login || '',
                    nombreApellido: usuario.nombreApellido || '',
                    password: '',
                    estado: usuario.estado ?? true,
                    permisos: []
                });
            }
        };

        init();
        return () => { cancel = true; };
    }, [usuario, isEditing, emptyForm]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.login.trim() || !form.nombreApellido.trim()) {
            setError('Login y Nombre son obligatorios.');
            return;
        }
        if (!isEditing && !form.password.trim()) {
            setError('La contraseña es obligatoria al crear un usuario.');
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        const payload = {
            login: form.login.trim(),
            nombreApellido: form.nombreApellido.trim(),
            estado: form.estado,
            ...(isEditing ? {} : { password: form.password.trim() }),
            permisos: form.permisos.map(p => p.value)
        };

        try {
            let resultado;
            if (isEditing) {
                resultado = await updateUsuario(usuario.idUsuario, payload);
                await asignarPermisosUsuario(usuario.idUsuario, payload.permisos);
            } else {
                resultado = await createUsuario(payload);
                await asignarPermisosUsuario(resultado.idUsuario, payload.permisos);
            }

            setMensajeExito(`Usuario ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
            setTimeout(() => onClose(true), 1000);
        } catch (err) {
            const errorMessage =
                err?.response?.data?.error ||
                err?.message ||
                'Error al guardar el usuario.';
            setError(errorMessage);
        } finally {
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            {mensajeExito && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {mensajeExito}
                </div>
            )}

            {/* Login */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Login</label>
                <input
                    type="text"
                    name="login"
                    value={form.login}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>

            {/* Nombre */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nombre y Apellido</label>
                <input
                    type="text"
                    name="nombreApellido"
                    value={form.nombreApellido}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>

            {/* Contraseña (solo al crear) */}
            {!isEditing && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        disabled={cargando || !!mensajeExito}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>
            )}

            {/* Estado (solo al editar) */}
            {isEditing && (
                <div className="mt-4 flex items-center">
                    <input
                        type="checkbox"
                        name="estado"
                        checked={form.estado}
                        onChange={handleChange}
                        disabled={cargando || !!mensajeExito}
                        className="mr-2"
                    />
                    <label className="text-sm text-gray-700 font-bold">
                        Usuario Activo
                        <span className="text-gray-500 text-xs ml-2">
                            ({form.estado ? 'Activo' : 'Inactivo'})
                        </span>
                    </label>
                </div>
            )}

            {/* Permisos (multi selección, sin valores por defecto al crear) */}
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Permisos</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    isMulti
                    loadOptions={buscarPermisosSelect}
                    value={form.permisos}
                    onChange={(selected) =>
                        setForm(prev => ({ ...prev, permisos: selected || [] }))
                    }
                    placeholder="Buscar y seleccionar permisos..."
                    className="mb-4"
                    isDisabled={!!mensajeExito}
                />
            </div>

            <div className="flex items-center justify-between mt-6">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition duration-150"
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

export default UsuarioForm;

