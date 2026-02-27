// src/pages/infraestructura/Modelos/ModeloForm.jsx
import { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { buscarMarcasSelect, createModelo, getMarcaById, updateModelo } from '../../../services/api';

const ModeloForm = ({ modelo, onClose }) => {
    const [opcionesMarca, setOpcionesMarca] = useState([]);
    const [form, setForm] = useState({
        idMarca: '',
        descripcionModelo: '',
        caracteristicas: '',
        estado: true,
    });

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [mensajeExito, setMensajeExito] = useState(null);
    const isEditing = !!modelo;

    //Carga inicial de datos
    useEffect(() => {
        if (modelo) {
            setForm({
                idMarca: modelo.idMarca?.toString() || '',
                descripcionModelo: modelo.descripcionModelo || '',
                caracteristicas: modelo.caracteristicas || '',
                estado: modelo.estado ?? true
            });

            const cargarDatosForaneos = async () => {
                try {
                    const [marca] = await Promise.all([
                        getMarcaById(modelo.idMarca),
                    ]);

                    setOpcionesMarca([{ value: marca.idMarca, label: marca.descripcionMarca }]);
                } catch (error) {
                    console.error('Error al cargar datos foráneos:', error);
                }
            };

            cargarDatosForaneos();
        }
    }, [modelo]);

    //Función para recargar datos
    useEffect(() => {
        if (modelo) {
            setForm({
                idMarca: modelo.idMarca?.toString() || '',
                descripcionModelo: modelo.descripcionModelo || '',
                caracteristicas: modelo.caracteristicas || '',
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

        if (!form.descripcionModelo.trim()) {
            setError("La descripción del modelo no puede estar vacía.");
            return;
        }
        if (!form.caracteristicas.trim()) {
            setError("Las caracteristicas del modelo no puede estar vacía.");
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
            descripcionModelo: form.descripcionModelo.trim(),
            caracteristicas: form.caracteristicas.trim(),
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
        <form onSubmit={handleSubmit} noValidate className="p-4">
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
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcionModelo"> Descripción del Modelo</label>
                <input
                    id="descripcionModelo"
                    type="text"
                    name="descripcionModelo"
                    value={form.descripcionModelo}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcionModelo"> Características</label>
                <input
                    id="caracteristicas"
                    type="text"
                    name="caracteristicas"
                    value={form.caracteristicas}
                    onChange={handleChange}
                    disabled={cargando || !!mensajeExito}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="idMarca">Marca Asociada</label>
                <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={async (inputValue) => {
                        const opciones = await buscarMarcasSelect(inputValue, 1, 50);
                        setOpcionesMarca(opciones);
                        return opciones;
                    }}
                    value={
                        form.idMarca
                            ? opcionesMarca.find((o) => o.value === parseInt(form.idMarca)) || {
                                value: form.idMarca
                                    ? opcionesMarca.find((o) => o.value === parseInt(form.idMarca)) || null
                                    : null
                            }
                            : null
                    }
                    onChange={(opcion) => {
                        setForm((prev) => ({ ...prev, idMarca: opcion?.value || '' }));
                        setOpcionesMarca((prev) => {
                            // si no existe en la lista, la agregamos
                            if (opcion && !prev.some(o => o.value === opcion.value)) {
                                return [...prev, opcion];
                            }
                            return prev;
                        });
                    }}
                    placeholder="Buscar y seleccionar marca..."
                    isClearable
                    className="mb-4"
                />
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
