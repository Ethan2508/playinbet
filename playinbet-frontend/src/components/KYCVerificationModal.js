import React, { useState, useEffect } from 'react';
import './KYCVerificationModal.css';

const KYCVerificationModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        nationality: '',
        phone_number: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        bank_name: '',
        iban: '',
        bic: '',
        identity_document: 'Carte d\'identité française',
        proof_of_address: 'Facture électricité',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [kycStatus, setKycStatus] = useState(null);

    useEffect(() => {
        if (isOpen) {
            checkKYCStatus();
        }
    }, [isOpen]);

    const checkKYCStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8001/api/kyc/status/', {
                headers: {
                    'Authorization': `Token ${token}`,
                }
            });
            const data = await response.json();
            setKycStatus(data);
            
            if (data.is_verified) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut KYC:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep = (stepNumber) => {
        const newErrors = {};
        
        if (stepNumber === 1) {
            if (!formData.first_name.trim()) newErrors.first_name = 'Le prénom est obligatoire';
            if (!formData.last_name.trim()) newErrors.last_name = 'Le nom est obligatoire';
            if (!formData.date_of_birth) newErrors.date_of_birth = 'La date de naissance est obligatoire';
            if (!formData.nationality.trim()) newErrors.nationality = 'La nationalité est obligatoire';
            if (!formData.phone_number.trim()) newErrors.phone_number = 'Le numéro de téléphone est obligatoire';
        } else if (stepNumber === 2) {
            if (!formData.address.trim()) newErrors.address = 'L\'adresse est obligatoire';
            if (!formData.city.trim()) newErrors.city = 'La ville est obligatoire';
            if (!formData.postal_code.trim()) newErrors.postal_code = 'Le code postal est obligatoire';
            if (!formData.country.trim()) newErrors.country = 'Le pays est obligatoire';
        } else if (stepNumber === 3) {
            if (!formData.bank_name.trim()) newErrors.bank_name = 'Le nom de la banque est obligatoire';
            if (!formData.iban.trim()) newErrors.iban = 'L\'IBAN est obligatoire';
            if (!formData.bic.trim()) newErrors.bic = 'Le BIC est obligatoire';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const submitKYC = async () => {
        if (!validateStep(3)) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8001/api/kyc/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setStep(4); // Étape de confirmation
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 3000);
            } else {
                setErrors(data);
            }
        } catch (error) {
            console.error('Erreur lors de la soumission KYC:', error);
            setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="kyc-modal-overlay">
            <div className="kyc-modal">
                <div className="kyc-modal-header">
                    <h2>Vérification de votre identité</h2>
                    <p>Pour accéder aux fonctionnalités de PlayinBet, vous devez vérifier votre identité</p>
                    <div className="kyc-steps">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
                        <div className={`step ${step >= 4 ? 'active' : ''}`}>✓</div>
                    </div>
                </div>

                <div className="kyc-modal-content">
                    {step === 1 && (
                        <div className="kyc-step">
                            <h3>Informations personnelles</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Prénom *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className={errors.first_name ? 'error' : ''}
                                    />
                                    {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Nom *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className={errors.last_name ? 'error' : ''}
                                    />
                                    {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Date de naissance *</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        className={errors.date_of_birth ? 'error' : ''}
                                    />
                                    {errors.date_of_birth && <span className="error-text">{errors.date_of_birth}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Nationalité *</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleInputChange}
                                        className={errors.nationality ? 'error' : ''}
                                        placeholder="Française"
                                    />
                                    {errors.nationality && <span className="error-text">{errors.nationality}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Numéro de téléphone *</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className={errors.phone_number ? 'error' : ''}
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                    {errors.phone_number && <span className="error-text">{errors.phone_number}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="kyc-step">
                            <h3>Adresse de résidence</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Adresse *</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className={errors.address ? 'error' : ''}
                                        placeholder="123 Rue de la République"
                                    />
                                    {errors.address && <span className="error-text">{errors.address}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Ville *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={errors.city ? 'error' : ''}
                                        placeholder="Paris"
                                    />
                                    {errors.city && <span className="error-text">{errors.city}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Code postal *</label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        className={errors.postal_code ? 'error' : ''}
                                        placeholder="75001"
                                    />
                                    {errors.postal_code && <span className="error-text">{errors.postal_code}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Pays *</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className={errors.country ? 'error' : ''}
                                        placeholder="France"
                                    />
                                    {errors.country && <span className="error-text">{errors.country}</span>}
                                </div>
                            </div>
                            <div className="documents-section">
                                <h4>Documents requis</h4>
                                <div className="document-item">
                                    <span>✓ Pièce d'identité (simulation)</span>
                                    <select name="identity_document" value={formData.identity_document} onChange={handleInputChange}>
                                        <option value="Carte d'identité française">Carte d'identité française</option>
                                        <option value="Passeport français">Passeport français</option>
                                        <option value="Permis de conduire">Permis de conduire</option>
                                    </select>
                                </div>
                                <div className="document-item">
                                    <span>✓ Justificatif de domicile (simulation)</span>
                                    <select name="proof_of_address" value={formData.proof_of_address} onChange={handleInputChange}>
                                        <option value="Facture électricité">Facture électricité</option>
                                        <option value="Facture gaz">Facture gaz</option>
                                        <option value="Relevé bancaire">Relevé bancaire</option>
                                        <option value="Quittance de loyer">Quittance de loyer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="kyc-step">
                            <h3>Informations bancaires</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Nom de la banque *</label>
                                    <input
                                        type="text"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleInputChange}
                                        className={errors.bank_name ? 'error' : ''}
                                        placeholder="Crédit Agricole"
                                    />
                                    {errors.bank_name && <span className="error-text">{errors.bank_name}</span>}
                                </div>
                                <div className="form-group full-width">
                                    <label>IBAN *</label>
                                    <input
                                        type="text"
                                        name="iban"
                                        value={formData.iban}
                                        onChange={handleInputChange}
                                        className={errors.iban ? 'error' : ''}
                                        placeholder="FR14 2004 1010 0505 0001 3M02 606"
                                    />
                                    {errors.iban && <span className="error-text">{errors.iban}</span>}
                                </div>
                                <div className="form-group">
                                    <label>BIC/SWIFT *</label>
                                    <input
                                        type="text"
                                        name="bic"
                                        value={formData.bic}
                                        onChange={handleInputChange}
                                        className={errors.bic ? 'error' : ''}
                                        placeholder="AGRIFRPP"
                                    />
                                    {errors.bic && <span className="error-text">{errors.bic}</span>}
                                </div>
                            </div>
                            <div className="info-box">
                                <p><strong>Pourquoi ces informations ?</strong></p>
                                <p>Ces informations bancaires sont nécessaires pour vous permettre de retirer vos gains. Vos données sont sécurisées et ne seront utilisées que pour les transactions.</p>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="kyc-step kyc-success">
                            <div className="success-icon">✓</div>
                            <h3>Vérification envoyée !</h3>
                            <p>Votre dossier de vérification a été soumis avec succès.</p>
                            <p>Vous recevrez une notification une fois votre compte validé.</p>
                            <div className="loading-spinner"></div>
                            <p><small>Validation automatique en cours... (simulation)</small></p>
                        </div>
                    )}

                    {errors.general && (
                        <div className="error-message">
                            {errors.general}
                        </div>
                    )}
                </div>

                <div className="kyc-modal-footer">
                    {step > 1 && step < 4 && (
                        <button 
                            type="button" 
                            onClick={prevStep}
                            className="btn-secondary"
                        >
                            Précédent
                        </button>
                    )}
                    
                    {step < 3 && (
                        <button 
                            type="button" 
                            onClick={nextStep}
                            className="btn-primary"
                        >
                            Suivant
                        </button>
                    )}
                    
                    {step === 3 && (
                        <button 
                            type="button" 
                            onClick={submitKYC}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Envoi en cours...' : 'Soumettre la vérification'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KYCVerificationModal;
