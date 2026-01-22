'use client';

import React from 'react';
import TwoFactorAuth from '../../../../shared/components/TwoFactorAuth';

const SettingsPage = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
            
            <div className="space-y-6">
                {/* Security Section */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4">Security</h2>
                    <TwoFactorAuth />
                </section>
            </div>
        </div>
    );
};

export default SettingsPage;
