import { useState } from 'react';
import BuscadorDebounce from '../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../hooks/useFiltroPaginado';
import {
  exportarAsignaciones,
  getAsignacionesPaginadas,
} from '../../services/api';
import AsignacionPermisoForm from './AsignacionPermisoForm';

const AsignacionesPermisosPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);


  const {
    items: asignaciones,
    cargando,
    error,
    searchTerm,
    setSearchTerm,
    paginaActual,
    setPaginaActual,
    tamanoPagina,
    setTamanoPagina,
    totalPaginas,
    fetchData,
    handleExport,
    handleNextPage,
    handlePrevPage
  } = useFiltroPaginado({
    fetchFunction: getAsignacionesPaginadas,
    exportFunction: exportarAsignaciones
  });

  // Manejadores
  const handleCreate = () => {
    // Cuando se crea, simplemente abrimos el modal para que el usuario seleccione el usuario.
    setIsModalOpen(true);
  };



  const handleDelete = async (idUsuarioPermiso, nombre) => {
    // NOTA: Esta función ELIMINA UNA SOLA ASIGNACIÓN (una fila de la tabla).
    if (!window.confirm(`¿Eliminar la asignación de permiso de "${nombre}"?`)) return;
    try {

      alert('Asignación eliminada con éxito.');
      fetchData(paginaActual);
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleCloseModal = (actualizado = false) => {
    setIsModalOpen(false);

    if (actualizado) fetchData(paginaActual);
  };

  // Renderizado
  if (cargando) return <div className="p-12 text-gray-500">Cargando asignaciones...</div>;
  if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

  return (
    <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Asignaciones de Permisos</h1>

      <div className="flex justify-between items-center">
        <button
          onClick={handleCreate} // Este botón centraliza toda la gestión de permisos por usuario
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow transition duration-150"
        >
          ➕ Nueva Asignación
        </button>

        <div className="flex items-center space-x-4">
          <BuscadorDebounce
            value={searchTerm}
            onDebouncedChange={(val) => setSearchTerm(val)}
            disabled={cargando}
            placeholder="Buscar por Usuario o Permiso..."
          />
          {/*  botones (Exportar, Select tamaño página) ... */}
          <button
            onClick={handleExport}
            disabled={cargando}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg flex items-center shadow disabled:opacity-50 transition duration-150"
            title="Exportar toda la lista a Excel"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>

          <select
            value={tamanoPagina}
            onChange={(e) => setTamanoPagina(Number(e.target.value))}
            disabled={cargando}
            className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow overflow-x-auto sm:rounded-lg mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permiso</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {asignaciones.map((a) => (
              <tr key={a.idUsuarioPermiso}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.idUsuarioPermiso}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{a.nombreApellido}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{a.descripcion}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">

                  <button onClick={() => handleDelete(a.idUsuarioPermiso, a.nombreApellido)} className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            ))}
            {asignaciones.length === 0 && !cargando && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No se encontraron asignaciones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200 space-x-1 flex-wrap">
        {/* ... Paginación ... */}
        <button
          onClick={handlePrevPage}
          disabled={paginaActual === 1 || cargando}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-l disabled:opacity-50 transition duration-150"
        >
          &lt;
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setPaginaActual(num)}
            className={`py-2 px-3 font-medium border ${num === paginaActual ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition duration-150`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleNextPage}
          disabled={paginaActual === totalPaginas || cargando}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-r disabled:opacity-50 transition duration-150"
        >
          &gt;
        </button>
      </div>


      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 flex justify-center items-center backdrop-blur-sm transition duration-300">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
            <AsignacionPermisoForm
              // Ya no pasamos 'asignacion' ni 'asignacionEditando'
              onClose={handleCloseModal}
              onSuccess={() => handleCloseModal(true)} // Llama a handleCloseModal y recarga la tabla
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignacionesPermisosPage;