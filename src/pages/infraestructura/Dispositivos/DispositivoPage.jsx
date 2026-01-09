import { useState } from 'react';
import BuscadorDebounce from '../../../components/ui/BuscadorDebounce';
import { useFiltroPaginado } from '../../../hooks/useFiltroPaginado';
import { deleteDispositivo, exportarDispositivos, getDispositivosPaginados, toggleDispositivoEstado } from '../../../services/api';
import DispositivoForm from './DispositivoForm';

const DispositivoPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [DispositivoEditando, setDispositivoEditando] = useState(null);

  const {
    items: dispositivos,
    cargando,
    error,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    paginaActual,
    setPaginaActual,
    tamanoPagina,
    setTamanoPagina,
    totalPaginas,
    fetchData,
    handleExport,
    handleNextPage,
    handlePrevPage,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection
  } = useFiltroPaginado({
    fetchFunction: getDispositivosPaginados,
    exportFunction: exportarDispositivos
  });

const handleSort = (column) => {
  if (sortColumn === column) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortColumn(column);
    setSortDirection('asc');
  }
};

  const handleCreate = () => {
    setDispositivoEditando(null);
    setIsModalOpen(true);
  };

  const handleEdit = (dispositivo) => {
    setDispositivoEditando(dispositivo);
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (dispositivo) => {
    const nuevoEstado = !dispositivo.estado;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que quieres ${accion} el dispositivo "${dispositivo.nombre}"?`)) return;

    try {
      await toggleDispositivoEstado(dispositivo.idDispositivo, nuevoEstado);
      alert(`Dispositivo "${dispositivo.nombre}" ${accion}da con éxito.`);
      await fetchData(paginaActual);
    } catch (err) {
      alert(`Error al ${accion}: ${err.message}`);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el dispositivo "${nombre}"? Esta acción es irreversible.`)) return;

    try {
      await deleteDispositivo(id);
      alert(`Dispositivo "${nombre}" eliminado con éxito.`);
      await fetchData(paginaActual);
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleCloseModal = (dispositivoActualizado = false) => {
    setIsModalOpen(false);
    setDispositivoEditando(null);
    if (dispositivoActualizado) fetchData(paginaActual);
  };

  // --- Renderizado Condicional ---
  if (cargando) return <div className="p-12 text-gray-500">Cargando dispositivos...</div>;
  if (error) return <div className="p-6 text-red-600 border border-red-300 bg-red-50 rounded">Error: {error}</div>;

  return (
    <div className="p-12 border-b border-gray-200 bg-white sticky top-0 z-10">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Dispositivos</h1>
      <div className="flex justify-between items-center">
        <button
          onClick={handleCreate}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow transition duration-150"
        >
          ➕ Crear Nuevo Dispositivo
        </button>

        <div className="flex items-center space-x-4">
          <BuscadorDebounce
            value={searchTerm}
            onDebouncedChange={(val) => setSearchTerm(val)}
            disabled={cargando}
            placeholder="Buscar por Nombre, serie..."
          />

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>

          <button
            onClick={handleExport}
            disabled={cargando}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg flex items-center shadow disabled:opacity-50 transition duration-150"
            title="Exportar toda la lista a Excel"
          >
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

      {/* TABLA DE DATOS */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
  <tr>
    {[
      { title: 'ID', key: 'idDispositivo' },
      { title: 'Nombre', key: 'nombre' },
      { title: 'Serie', key: 'serie' },
      { title: 'Tipo', key: 'tipo' },
      { title: 'Categoría', key: 'categoria' },
      { title: 'Modelo', key: 'modelo' },
      { title: 'Marca', key: 'marca' },
      { title: 'Ubicación', key: 'ubicacion' },
      { title: 'Sitio', key: 'sitio' },
      { title: 'Contrato', key: 'contrato' },
      { title: 'Estado', key: 'estado' }
    ].map(({ title, key }) => (
      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="flex items-center space-x-1">
          <span>{title}</span>
          <button onClick={() => handleSort(key)} className="text-gray-400 hover:text-gray-600">
            {sortColumn === key ? (
              sortDirection === 'asc' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </th>
    ))}

    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
      Acciones
    </th>
  </tr>
</thead>


          <tbody className="bg-white divide-y divide-gray-200">
            {dispositivos.map((d) => (
              <tr key={d.idDispositivo}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.idDispositivo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.serie}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.nombreTipo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.descripcion}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.descripcionModelo}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.descripcionMarca}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.descripcionUbicacion}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.descripcionSitio}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.numeroContrato}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${d.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {d.estado ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button onClick={() => handleEdit(d)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                  <button onClick={() => handleToggleEstado(d)} className={`mr-3 ${d.estado ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}>
                    {d.estado ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => handleDelete(d.idDispositivo, d.nombre)} className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            ))}
             {dispositivos.length === 0 && (
              <tr>
                <td colSpan="12" className="px-6 py-4 text-center text-gray-500">
                  No se encontraron dispositivos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      <div className="flex justify-center items-center mt-6 p-4 border-t border-gray-200 space-x-1 flex-wrap">
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
            className={`py-2 px-3 font-medium border ${
              num === paginaActual
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } transition duration-150`}
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

      {/* MODAL DEL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center backdrop-blur-sm transition duration-300">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition duration-300 scale-100 opacity-100">
            <DispositivoForm
              dispositivo={DispositivoEditando}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DispositivoPage;
