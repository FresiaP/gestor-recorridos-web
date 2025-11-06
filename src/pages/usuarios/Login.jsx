// src/pages/usuarios/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import LogoImage from '../../images/pescanova_logo.png';

const Login = () => {
    const [form, setForm] = useState({ login: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(form.login, form.password);
            navigate('/home'); // Redirige al dashboard
        } catch (err) {
            setError('Credenciales inválidas');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="flex justify-center mb-8"> {/* Contenedor para centrar el logo y darle margen */}
                    <img
                        src={LogoImage}
                        alt="Logo de la Aplicación"
                        // Ajusta las clases de Tailwind según el tamaño que desees.
                        // Ejemplo: h-20 para una altura de 20 unidades de Tailwind.
                        className="h-16 w-auto object-contain"
                    />
                </div>
                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

                <div className="mb-4">
                    <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                    <input
                        type="text"
                        id="login"
                        name="login"
                        value={form.login}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: admin"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-150"
                >
                    Ingresar
                </button>
            </form>
        </div>
    );
};

export default Login;
