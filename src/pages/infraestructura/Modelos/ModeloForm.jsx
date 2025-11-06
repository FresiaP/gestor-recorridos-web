// src/pages/infraestructura/Modelos/ModeloForm.jsx
import React, { useState, useEffect } from 'react';
import { createModelo, updateModelo, getMarcas } from '../../../services/api';

const ModeloForm = ({ modelo, onClose }) => {

    const [modelos, setMarcas] = useState([]);
    const [form, setForm] = useState({
        descripcion: '',
        idMarca: '',
        estado: true,
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!modelo;

    //Carga inicial de datos
    useEffect(() => {
        const cargarMarcas = async () => {
            try {
                const data = await getMarcas();
                const lista = Array.isArray(data.datos) ? data.datos : Array.isArray(data) ? data : [];
                setMarcas(lista);
            } catch (err) {
                setError('Error al cargar proveedores.');
                setMarcas([]);
            }
        };
        cargarMarcas();
    }, []);

    //Función para recargar datos
    useEffect(() => {
        if (modelo) {
            setForm({
                idMarca: modelo.idMarca?.toString() || '',
                descripcion: modelo.descripcion || '',
                estado: modelo.estado ?? true
            });
        }
    }, [modelo]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.descripcion.trim()) {
            setError("La descripción del modelo no puede estar vacía.");
            return;
        }
        if (!form.idMarca) {
            setError("Debe seleccionar una marca.");
            return;
        }

        setCargando(true);
        setError(null);
        setMensajeExito(null);

        // Conversión segura de tipos
        const payload = {
            ...form,
            idMarca: parseInt(form.idMarca),
            descripcion: form.descripcion.trim(),
            estado: form.estado ?? false
        };

        try {
            if (isEditing) {
                await updateModelo(modelo.idModelo, payload);
            } else {
                await createModelo(payload);
            }

            setMensajeExito(`Modelo ${isEditing ? 'actualizado' : 'creado'} con éxito.`);

            // Cierra el modal y fuerza recarga en la tabla
            setTimeout(() => onClose(true), 1500);
        } catch (err) {
            let errorMessage = 'Error al guardar el modelo.';
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? 'Editar Modelo' : 'Crear Nuevo Modelo'}
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcion"> Descripción del Modelo</label>
                <input
                    id="descripcion"
                    type="text"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idMarca">Marca Asociada</label>
                <select
                    id="idMarca"
                    name="idMarca"
                    value={form.idMarca}
                    onChange={handleChange}
                    required
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                >
                    <option value="">-- Seleccione una marca --</option>
                    {modelos.map((marca) => (
                        <option key={marca.idMarca} value={marca.idMarca.toString()}>
                            {marca.descripcion}
                        </option>
                    ))}
                </select>
            </div>

            {/* Estado (solo en edición) */}
            {isEditing && (
                <div className="mt-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={form.estado}
                        onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.checked }))}
                        className="mr-2"
                    />
                    <label className="text-sm text-gray-700 font-bold">
                        Modelo Activo
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

export default ModeloForm;
