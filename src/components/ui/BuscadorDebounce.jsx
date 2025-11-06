import React, { useState, useEffect, useRef } from 'react';

const BuscadorDebounce = ({
    value,
    onDebouncedChange,
    delay = 300,
    disabled = false,
    placeholder = 'Buscar...',
    enableClear = true,
}) => {
    const [inputValue, setInputValue] = useState(value);
    const timeoutRef = useRef(null);
    const inputRef = useRef(null);

    // Sincroniza el valor externo
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Debounce
    useEffect(() => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onDebouncedChange(inputValue);
        }, delay);

        return () => clearTimeout(timeoutRef.current);
    }, [inputValue, delay, onDebouncedChange]);

    // Mantener el foco
    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            inputRef.current?.focus();
        }
    }, [value]);

    const handleClear = () => {
        setInputValue('');
        onDebouncedChange('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-64">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="border border-gray-300 rounded-lg p-2 pr-10 focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm transition duration-150"
            />
            {enableClear && inputValue && (
                <button
                    onClick={handleClear}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                    title="Limpiar búsqueda"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default BuscadorDebounce;
