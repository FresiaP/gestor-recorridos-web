
const Navbar = ({ setIsMenuOpen, pageTitle, usuario, onLogout }) => {
    // Nombre visible del usuario (si no hay nombre, mostramos rol o "Usuario")
    const nombreUsuarioVisible = usuario?.nombre || usuario?.rol || 'Usuario';
    const iniciales = nombreUsuarioVisible
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white shadow-md z-20 flex items-center justify-between px-4 lg:px-6">

            {/* Botón de Menú (Visible solo en móvil) */}
            <button
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 lg:hidden"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menú"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Título de la página */}
            <h1 className="text-xl font-semibold text-gray-800 hidden lg:block">{pageTitle}</h1>

            {/* Perfil de Usuario / Logout */}
            <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600 hidden sm:block">
                    {nombreUsuarioVisible}
                </span>

                {/* Avatar con iniciales */}
                <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    {iniciales}
                </div>

                {/* Botón de Logout separado con ícono */}
                <button
                    onClick={onLogout}
                    aria-label="Cerrar sesión"
                    className="p-2 text-gray-600 hover:text-red-600 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
