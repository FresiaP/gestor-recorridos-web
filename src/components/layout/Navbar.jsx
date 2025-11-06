import React from 'react';
//import { eliminarToken } from '../../services/api.js';
//import { useNavigate } from 'react-router-dom';

// Aceptamos una nueva prop: 'usuario'
const Navbar = ({ setIsMenuOpen, pageTitle, usuario, onLogout }) => {
    // const navigate = useNavigate();

    /* const handleLogout = () => {
         eliminarToken();
         navigate('/login');
     };*/

    // Usamos el nombre del usuario (usuario?.nombre) o mostramos el rol si el nombre no está
    const nombreUsuarioVisible = usuario?.nombre || usuario?.rol || 'Usuario';
    const iniciales = nombreUsuarioVisible.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white shadow-md z-20 flex items-center justify-between px-4 lg:px-6">
            {/* Botón de Menú (Visible solo en móvil) */}
            <button
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 lg:hidden"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menú"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            <h1 className="text-xl font-semibold text-gray-800 hidden lg:block">{pageTitle}</h1>

            {/* Perfil de Usuario / Logout */}
            <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600 hidden sm:block">
                    {nombreUsuarioVisible}
                </span>
                <button
                    onClick={onLogout}
                    className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition hover:ring-2 hover:ring-red-300"
                    title="Cerrar sesión"
                >
                    {/* Usamos las iniciales del nombre como avatar simple */}
                    {iniciales}                   ⎋
                </button>
            </div>
        </header >
    );
};


export default Navbar;
