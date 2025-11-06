import React from 'react';
// Importamos los iconos desde el nuevo archivo centralizado de componentes/Icons
import { IconoRuta, IconoUsuario, IconoReporte, IconoConfig } from '../../components/ui/Icons';

// --- Componente InfoBox (Card de métricas) - Clave del estilo AdminLTE ---
const InfoBox = ({ title, value, icon: Icon, bgColor }) => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-xl`}>
        <div className={`p-4 flex items-center justify-between ${bgColor} rounded-t-xl`}>
            {/* Texto y valor */}
            <div>
                <div className="text-3xl font-bold text-white">{value}</div>
                <div className="text-sm font-medium text-white opacity-90 uppercase">{title}</div>
            </div>
            {/* Ícono grande */}
            <div className="text-white opacity-70">
                <Icon className="h-10 w-10" />
            </div>
        </div>
        {/* Enlace al pie (simulación) */}
        <div className="bg-gray-50 text-center py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer">
            Ver detalles &rarr;
        </div>
    </div>
);

const Home = () => {
    return (
        <main>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Métricas Clave del Gestor</h2>

            {/* Fila de Info Boxes (4 columnas en desktop, 2 en tablet, 1 en móvil) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <InfoBox
                    title="Recorridos Activos"
                    value="45"
                    icon={IconoRuta}
                    bgColor="bg-blue-600"
                />
                <InfoBox
                    title="Usuarios Registrados"
                    value="1.2K"
                    icon={IconoUsuario}
                    bgColor="bg-green-600"
                />
                <InfoBox
                    title="Recorridos Completados"
                    value="89%"
                    icon={IconoReporte}
                    bgColor="bg-yellow-600"
                />
                <InfoBox
                    title="Nuevas Peticiones"
                    value="12"
                    icon={IconoConfig}
                    bgColor="bg-red-600"
                />
            </div>

            {/* Panel de Contenido Principal (Estilo Card) */}
            <div className="bg-white rounded-xl shadow-2xl p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">
                    Listado General de Recorridos
                </h3>

                <p className="text-gray-600 italic">
                    Aquí se integrará la tabla de datos real.
                </p>

                {/* Simulación de una tabla o lista de recorridos */}
                <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg hover:shadow-sm transition duration-150">
                        <span className="font-semibold">Ruta Histórica del Centro (ID: 001)</span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg hover:shadow-sm transition duration-150">
                        <span className="font-semibold">Tour Gastronómico Nocturno (ID: 002)</span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
                    </div>
                </div>

                <div className="mt-8 text-right">
                    <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transition duration-150">
                        Añadir Nuevo Recorrido
                    </button>
                </div>
            </div>
        </main>
    );
};

export default Home;