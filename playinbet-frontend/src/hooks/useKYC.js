import { useState, useEffect, createContext, useContext } from 'react';

const KYCContext = createContext();

export const useKYC = () => {
    const context = useContext(KYCContext);
    if (!context) {
        throw new Error('useKYC must be used within a KYCProvider');
    }
    return context;
};

export const KYCProvider = ({ children }) => {
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showKYCModal, setShowKYCModal] = useState(false);

    const checkKYCStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:8001/api/kyc/status/', {
                headers: {
                    'Authorization': `Token ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setKycStatus(data);
                
                // Afficher le modal si l'utilisateur n'est pas vérifié
                if (!data.is_verified && data.verification_status !== 'pending') {
                    setShowKYCModal(true);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut KYC:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkKYCStatus();
    }, []);

    const refreshKYCStatus = () => {
        setLoading(true);
        checkKYCStatus();
    };

    const handleKYCSuccess = () => {
        setShowKYCModal(false);
        refreshKYCStatus();
    };

    const handleKYCClose = () => {
        // Ne permettre la fermeture que si l'utilisateur est vérifié
        if (kycStatus?.is_verified) {
            setShowKYCModal(false);
        }
    };

    const requiresKYC = () => {
        return kycStatus && !kycStatus.is_verified;
    };

    const canPlay = () => {
        return kycStatus?.can_play || false;
    };

    const canWithdraw = () => {
        return kycStatus?.can_withdraw || false;
    };

    const value = {
        kycStatus,
        loading,
        showKYCModal,
        setShowKYCModal,
        checkKYCStatus: refreshKYCStatus,
        handleKYCSuccess,
        handleKYCClose,
        requiresKYC,
        canPlay,
        canWithdraw
    };

    return (
        <KYCContext.Provider value={value}>
            {children}
        </KYCContext.Provider>
    );
};
