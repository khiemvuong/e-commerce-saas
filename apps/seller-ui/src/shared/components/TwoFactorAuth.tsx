'use client';

import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { use2FAStatus, useEnable2FA, useVerify2FA, useDisable2FA, Enable2FAResponse } from 'apps/seller-ui/src/hooks/use2FA';
import QRCode from 'qrcode';

const TwoFactorAuth = () => {
    const { data: status, isLoading: statusLoading } = use2FAStatus();
    const enable2FA = useEnable2FA();
    const verify2FA = useVerify2FA();
    const disable2FA = useDisable2FA();

    const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
    const [setupData, setSetupData] = useState<Enable2FAResponse | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [verifyCode, setVerifyCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
    const [error, setError] = useState('');

    const handleEnable2FA = async () => {
        setError('');
        try {
            const data = await enable2FA.mutateAsync();
            setSetupData(data);
            
            // Generate QR code
            const qrUrl = await QRCode.toDataURL(data.qrCodeUri);
            setQrCodeUrl(qrUrl);
            setStep('setup');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to enable 2FA');
        }
    };

    const handleVerify2FA = async () => {
        if (verifyCode.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }
        setError('');
        try {
            await verify2FA.mutateAsync(verifyCode);
            setStep('idle');
            setSetupData(null);
            setVerifyCode('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid code');
        }
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) {
            setError('Password is required');
            return;
        }
        setError('');
        try {
            await disable2FA.mutateAsync(disablePassword);
            setShowDisableModal(false);
            setDisablePassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disable 2FA');
        }
    };

    const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
        await navigator.clipboard.writeText(text);
        if (type === 'secret') {
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        } else {
            setCopiedBackupCodes(true);
            setTimeout(() => setCopiedBackupCodes(false), 2000);
        }
    };

    if (statusLoading) {
        return (
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-blue-500" />
                    <div>
                        <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-400">
                            Add an extra layer of security to your account
                        </p>
                    </div>
                </div>
                
                {status?.enabled ? (
                    <div className="flex items-center gap-2 text-green-500">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-medium">Enabled</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                        <ShieldOff className="w-5 h-5" />
                        <span className="text-sm font-medium">Disabled</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Idle State - Show enable/disable button */}
            {step === 'idle' && (
                <div className="mt-4">
                    {status?.enabled ? (
                        <button
                            onClick={() => setShowDisableModal(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Disable 2FA
                        </button>
                    ) : (
                        <button
                            onClick={handleEnable2FA}
                            disabled={enable2FA.isPending}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {enable2FA.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enable 2FA
                        </button>
                    )}
                </div>
            )}

            {/* Setup State - Show QR code and backup codes */}
            {step === 'setup' && setupData && (
                <div className="mt-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* QR Code */}
                        <div className="bg-slate-800 rounded-lg p-4">
                            <h4 className="text-white font-medium mb-3">1. Scan QR Code</h4>
                            <p className="text-sm text-slate-400 mb-4">
                                Use Google Authenticator, Authy, or any TOTP app
                            </p>
                            {qrCodeUrl && (
                                <div className="flex justify-center bg-white p-4 rounded-lg">
                                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                            )}
                            
                            {/* Manual entry option */}
                            <div className="mt-4">
                                <p className="text-xs text-slate-400 mb-2">Or enter manually:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-slate-700 px-3 py-2 rounded text-sm text-slate-300 break-all">
                                        {setupData.secret}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(setupData.secret, 'secret')}
                                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                                    >
                                        {copiedSecret ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Backup Codes */}
                        <div className="bg-slate-800 rounded-lg p-4">
                            <h4 className="text-white font-medium mb-3">2. Save Backup Codes</h4>
                            <p className="text-sm text-slate-400 mb-4">
                                Store these codes securely. You can use them if you lose access to your authenticator.
                            </p>
                            <div className="bg-slate-700 rounded-lg p-3 mb-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {setupData.backupCodes.map((code, index) => (
                                        <code key={index} className="text-sm text-slate-300 font-mono">
                                            {code}
                                        </code>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'backup')}
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                {copiedBackupCodes ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy all codes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Verify Code */}
                    <div className="bg-slate-800 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-3">3. Verify Setup</h4>
                        <p className="text-sm text-slate-400 mb-4">
                            Enter the 6-digit code from your authenticator app to complete setup
                        </p>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 max-w-[200px] bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-center text-lg tracking-widest font-mono focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleVerify2FA}
                                disabled={verify2FA.isPending || verifyCode.length !== 6}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {verify2FA.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Verify & Activate
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setStep('idle');
                            setSetupData(null);
                            setVerifyCode('');
                        }}
                        className="text-sm text-slate-400 hover:text-white"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Disable Modal */}
            {showDisableModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-white mb-2">Disable Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Enter your password to confirm disabling 2FA. This will make your account less secure.
                        </p>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-blue-500"
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDisableModal(false);
                                    setDisablePassword('');
                                    setError('');
                                }}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDisable2FA}
                                disabled={disable2FA.isPending || !disablePassword}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {disable2FA.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Disable 2FA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TwoFactorAuth;
