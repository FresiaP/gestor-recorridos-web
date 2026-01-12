import React, { useState, useEffect } from 'react';
import { createUsuario, updateUsuario } from '../../services/api';

const UsuarioForm = ({ usuario, onClose }) => {
  const [nombreApellido, setNombreApellido] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [estado, setEstado] = useState(true);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const isEditing = !!usuario;

  useEffect(() => {
    if (isEditing) {
      setNombreApellido(usuario.nombreApellido || '');
      setLogin(usuario.login || '');
      setEstado(usuario.estado ?? true);
      setPassword('');
      setConfirmPassword('');
    } else {
      setNombreApellido('');
      setLogin('');
      setPassword('');
      setConfirmPassword('');
      setEstado(true);
    }
  }, [usuario, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de campos obligatorios
    if (!nombreApellido.trim() || !login.trim()) {
      setError("Nombre y login son obligatorios.");
      return;
    }

    // En creación, la contraseña es obligatoria
    if (!isEditing && !password.trim()) {
      setError("La contraseña es obligatoria al crear un usuario.");
      return;
    }

    // En edición, si se escribe contraseña, debe coincidir con confirmPassword
    if (isEditing && password.trim() && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    setError(null);
    setMensajeExito(null);

    const dataToSend = {
      nombreApellido: nombreApellido.trim(),
      login: login.trim(),
      estado: estado,
      // Solo enviamos password si se escribió algo
      ...(password.trim() ? { password: password.trim() } : {})
    };

    try {
      if (isEditing) {
        await updateUsuario(usuario.idUsuario, dataToSend);
      } else {
        await createUsuario(dataToSend);
      }

      const mensaje = `Usuario ${isEditing ? 'actualizado' : 'creado'} con éxito.`;
      setMensajeExito(mensaje);

      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err) {
      console.error("Error completo:", err);
      let errorMessage = 'Error al guardar el usuario.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setCargando(false);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4" autoComplete="off">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        {isEditing ? `Editar Usuario: ${usuario.nombreApellido}` : 'Crear Nuevo Usuario'}
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

      {/* Campo NOMBRE APELLIDO */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombreApellido">
          Nombre del Usuario
        </label>
        <input
          id="nombreApellido"
          type="text"
          name="nombreApellido"
          value={nombreApellido}
          onChange={(e) => setNombreApellido(e.target.value)}
          required
          maxLength={100}
          disabled={cargando || !!mensajeExito}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {/* Campo LOGIN */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login">
          Login
        </label>
        <input
          id="login"
          type="text"
          name="login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
          maxLength={20}
          disabled={cargando || !!mensajeExito}
          autoComplete="username"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {/* Campo PASSWORD */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
          {isEditing ? "Nueva contraseña (opcional)" : "Contraseña (Min 8, Max 256 dígitos)"}
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={isEditing ? undefined : 8}
          maxLength={256}
          disabled={cargando || !!mensajeExito}
          autoComplete="new-password"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {/* Campo CONFIRM PASSWORD */}
      {isEditing && password.trim() && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirmar Nueva Contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            maxLength={256}
            disabled={cargando || !!mensajeExito}
            autoComplete="new-password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      )}

      {isEditing && (
        <div className="mb-4 flex items-center">
          <input
            id="estado"
            type="checkbox"
            checked={estado}
            onChange={(e) => setEstado(e.target.checked)}
            disabled={cargando || !!mensajeExito}
            className="mr-2 leading-tight h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="estado" className="text-gray-700 text-sm font-bold">
            Usuario Activo
            <span className="text-gray-500 text-xs ml-2">
              ({estado ? 'Visible' : 'Oculto/Desactivado'})
            </span>
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={() => onClose(null)}
          disabled={cargando}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando || !!mensajeExito}
          className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ${cargando || !!mensajeExito
            ? 'bg-indigo-300'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
        >
          {cargando ? 'Guardando...' : 'Guardar Usuario'}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm;
