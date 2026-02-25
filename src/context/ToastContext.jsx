import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const toastsRef = useRef([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = ++idCounter;
        const toast = { id, message, type, exiting: false };
        toastsRef.current = [...toastsRef.current, toast];
        setToasts([...toastsRef.current]);

        setTimeout(() => {
            toastsRef.current = toastsRef.current.map(t =>
                t.id === id ? { ...t, exiting: true } : t
            );
            setToasts([...toastsRef.current]);
            setTimeout(() => {
                toastsRef.current = toastsRef.current.filter(t => t.id !== id);
                setToasts([...toastsRef.current]);
            }, 300);
        }, 4000);
    }, []);

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}>
                        <span className="toast-icon">{icons[t.type] || icons.info}</span>
                        <span className="toast-message">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
