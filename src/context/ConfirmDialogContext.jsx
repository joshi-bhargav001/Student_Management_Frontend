import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

const ConfirmDialogContext = createContext();

export function useConfirm() {
    return useContext(ConfirmDialogContext);
}

export function ConfirmDialogProvider({ children }) {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        successMessage: 'Transaction completed',
        isProcessing: false,
        isSuccess: false,
        isAlert: false,
        onConfirm: null,
        onCancel: null,
    });

    const confirm = (options) => {
        return new Promise((resolve, reject) => {
            setModalState({
                isOpen: true,
                title: options.title || 'Delete?',
                message: options.message || 'Are you sure you want to delete this item?\nThis action cannot be undone.',
                confirmText: options.confirmText || 'Delete',
                cancelText: options.cancelText || 'Cancel',
                confirmBtnClass: options.confirmBtnClass || 'btn-danger',
                successMessage: options.successMessage || 'Transaction completed',
                isProcessing: false,
                isSuccess: false,
                isAlert: false,
                onConfirm: async () => {
                    setModalState(s => ({ ...s, isProcessing: true, isSuccess: true }));
                    try {
                        // Display the Transaction completed banner first for 1 second
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        if (options.onConfirm) {
                            await options.onConfirm();
                        }
                        setModalState(s => ({ ...s, isProcessing: false, isSuccess: false, isOpen: false }));
                        resolve(true);
                    } catch (e) {
                        setModalState(s => ({ ...s, isProcessing: false, isSuccess: false, isOpen: false }));
                        reject(e);
                    }
                },
                onCancel: () => {
                    setModalState(s => ({ ...s, isOpen: false }));
                    resolve(false);
                }
            });
        });
    };

    confirm.success = (title, message) => {
        return new Promise((resolve) => {
            // Phase 1: show modal with title only
            setModalState({
                isOpen: true,
                title: title || '',
                message: '',
                confirmText: '',
                cancelText: '',
                confirmBtnClass: 'btn-danger',
                successMessage: message || 'Transaction completed',
                isProcessing: false,
                isSuccess: false,
                isAlert: true,
                onConfirm: null,
                onCancel: null,
            });
            // Phase 2: after 1s, reveal the green success banner
            setTimeout(() => {
                setModalState(s => ({ ...s, isSuccess: true }));
                // Phase 3: close the modal after another 1.5s
                setTimeout(() => {
                    setModalState(s => ({ ...s, isOpen: false }));
                    resolve(true);
                }, 1500);
            }, 1000);
        });
    };

    confirm.alert = (title, message = '') => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                title: title || 'Notice',
                message: message || '',
                confirmText: 'OK',
                cancelText: '',
                confirmBtnClass: 'btn-primary',
                successMessage: '',
                isProcessing: false,
                isSuccess: false,
                isAlert: true,
                onConfirm: () => {
                    setModalState(s => ({ ...s, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setModalState(s => ({ ...s, isOpen: false }));
                    resolve(true);
                }
            });
        });
    };

    return (
        <ConfirmDialogContext.Provider value={confirm}>
            {children}
            {modalState.isOpen && createPortal(
                <>
                    <div className="modal-backdrop fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99990 }}></div>
                    <div className="modal fade show d-flex align-items-center justify-content-center" tabIndex="-1" style={{ display: 'block', zIndex: 99995, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
                        <div className="modal-dialog modal-dialog-centered w-100" style={{ maxWidth: '400px' }}>
                            <div className="modal-content text-center p-3 p-sm-4 border-0 shadow-lg" style={{ borderRadius: '14px', backgroundColor: '#ffffff' }}>
                                {modalState.title && (
                                    <h4 className="mb-2 mt-1 fw-bold" style={{ fontSize: '1.22rem', color: '#1e293b', letterSpacing: '-0.01em' }}>
                                        {modalState.title}
                                    </h4>
                                )}
                                {modalState.message && (
                                    <p className="text-secondary mb-3" style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: '1.45', color: '#64748b' }}>
                                        {modalState.message}
                                    </p>
                                )}

                                {modalState.isSuccess && (
                                    <div className="alert alert-success d-flex align-items-center text-start border-0 mx-auto w-100" style={{ backgroundColor: '#198754', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontWeight: '400', fontSize: '0.82rem', lineHeight: '1.3', minHeight: 'unset', marginBottom: '0.85rem' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="me-2" style={{ flexShrink: 0 }}>
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                        <span>{modalState.successMessage}</span>
                                    </div>
                                )}

                                <hr style={{ margin: '0 0 16px 0', borderColor: '#e9ecef' }} />

                                {modalState.isAlert ? (
                                    <div className="d-flex justify-content-center w-100">
                                        <button
                                            className={`btn ${modalState.confirmBtnClass || 'btn-primary'} w-50 fw-medium`}
                                            style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '7px 12px' }}
                                            onClick={modalState.onConfirm || modalState.onCancel}
                                        >
                                            {modalState.confirmText || 'OK'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-center gap-2 w-100">
                                        <button
                                            className="btn btn-outline-secondary w-50 fw-medium"
                                            style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '7px 12px' }}
                                            onClick={modalState.onCancel}
                                            disabled={modalState.isProcessing || modalState.isSuccess}
                                        >
                                            {modalState.cancelText}
                                        </button>
                                        <button
                                            className={`btn ${modalState.confirmBtnClass || 'btn-danger'} w-50 fw-medium`}
                                            style={{ borderRadius: '8px', fontSize: '0.88rem', padding: '7px 12px' }}
                                            onClick={modalState.onConfirm}
                                            disabled={modalState.isProcessing || modalState.isSuccess}
                                        >
                                            {modalState.isProcessing ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            ) : (
                                                modalState.confirmText
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </ConfirmDialogContext.Provider>
    );
}
