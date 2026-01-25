import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load current profile on open
    useEffect(() => {
        if (isOpen) {
            loadProfile();
        }
    }, [isOpen]);

    const loadProfile = async () => {
        try {
            const response = await apiClient.getProfile();
            const userData = response?.data?.user;
            if (userData?.first_name) {
                setDisplayName(userData.first_name);
            } else {
                setDisplayName('');
            }
        } catch (err) {
            console.warn('Failed to load profile:', err);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError('Display name cannot be empty');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.updateProfile(displayName.trim(), null);
            if (response?.success) {
                setSuccess('Profile updated successfully!');
                // Notify parent component about the update
                if (onProfileUpdate) {
                    onProfileUpdate(displayName.trim());
                }
                // Auto close after success
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                }, 1500);
            }
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleSave();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profile-modal-header">
                    <h2>Edit Profile</h2>
                    <button className="profile-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="profile-modal-body">
                    {/* User Avatar */}
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-large">
                            {(displayName || user?.email)?.charAt(0).toUpperCase()}
                        </div>
                        <p className="profile-email">{user?.email}</p>
                    </div>

                    {/* Display Name Input */}
                    <div className="profile-field">
                        <label htmlFor="displayName">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={user?.email?.split('@')[0] || 'Enter display name'}
                            maxLength={50}
                            autoFocus
                        />
                        <p className="profile-hint">
                            This name will be shown instead of your email
                        </p>
                    </div>

                    {/* Messages */}
                    {error && <p className="profile-error">{error}</p>}
                    {success && <p className="profile-success">{success}</p>}
                </div>

                <div className="profile-modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
