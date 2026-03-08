/**
 * use-pricing-worker.ts — Hook para gestionar el ciclo de vida del Web Worker de precios.
 *
 * Lanza el worker en background, expone progreso y resultados.
 * Solo funciona en el cliente (usa useEffect).
 */
'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
export function usePricingWorker() {
    const workerRef = useRef(null);
    const [state, setState] = useState({
        status: 'idle',
        progress: 0,
        prices: {},
        error: null,
    });
    // Limpiar worker al desmontar
    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
        };
    }, []);
    const calculate = useCallback((products, materials) => {
        // Terminar worker previo si existe
        workerRef.current?.terminate();
        setState({ status: 'calculating', progress: 0, prices: {}, error: null });
        const worker = new Worker(new URL('../workers/pricing.worker.ts', import.meta.url));
        workerRef.current = worker;
        worker.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'PROGRESS') {
                setState((prev) => ({
                    ...prev,
                    progress: msg.percentage,
                }));
            }
            else if (msg.type === 'RESULT') {
                setState({
                    status: 'done',
                    progress: 100,
                    prices: msg.prices,
                    error: null,
                });
                worker.terminate();
                workerRef.current = null;
            }
            else if (msg.type === 'ERROR') {
                setState({
                    status: 'error',
                    progress: 0,
                    prices: {},
                    error: msg.message,
                });
                worker.terminate();
                workerRef.current = null;
            }
        };
        worker.onerror = (err) => {
            setState({
                status: 'error',
                progress: 0,
                prices: {},
                error: err.message,
            });
            worker.terminate();
            workerRef.current = null;
        };
        worker.postMessage({
            type: 'CALCULATE_PRICES',
            products,
            materials,
        });
    }, []);
    const reset = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        setState({ status: 'idle', progress: 0, prices: {}, error: null });
    }, []);
    return {
        ...state,
        calculate,
        reset,
        isCalculating: state.status === 'calculating',
        isDone: state.status === 'done',
    };
}
