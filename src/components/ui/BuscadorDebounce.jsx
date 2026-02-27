import { useEffect, useRef, useState } from 'react';

const BuscadorDebounce = ({
    value,
    onDebouncedChange,
    delay = 400,
    disabled = false,
    placeholder = 'Buscar...',
    enableClear = true,
    className = '',
}) => {

    const [inputValue, setInputValue] = useState(value ?? '');
    const timeoutRef = useRef(null); // guarda el temporizador que colocamos en el delay
    const inputRef = useRef(null); //apunta al DOM real del input
    const lastSentValue = useRef(value ?? ''); // ultimo valor enviado al padre

    // sincroniza valor externo
    useEffect(() => {
        setInputValue(value ?? '');
    }, [value]);

    // debounce inteligente (NO envía si es el mismo valor)
    useEffect(() => {

        clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {

            if (lastSentValue.current !== inputValue) {
                lastSentValue.current = inputValue;
                onDebouncedChange(inputValue);
            }

        }, delay);

        return () => clearTimeout(timeoutRef.current);

    }, [inputValue, delay, onDebouncedChange]);

    // ENTER = búsqueda inmediata
    const handleKeyDown = (e) => {

        if (e.key === 'Enter') {

            clearTimeout(timeoutRef.current);

            if (lastSentValue.current !== inputValue) {
                lastSentValue.current = inputValue;
                onDebouncedChange(inputValue);
            }

        }
    };

    const handleClear = () => {

        clearTimeout(timeoutRef.current);

        setInputValue('');
        lastSentValue.current = '';

        onDebouncedChange('');

        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${className}`}>

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                className={`
                    border border-gray-300 rounded-lg p-2 pr-10
                    focus:ring-indigo-500 focus:border-indigo-500
                    w-full shadow-sm transition duration-150
                    ${className}
                `}
            />

            {enableClear && inputValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                    X
                </button>
            )}

        </div>
    );
};

export default BuscadorDebounce;
