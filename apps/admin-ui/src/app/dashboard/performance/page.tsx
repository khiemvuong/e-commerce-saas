'use client';

import React from 'react';
import PerformanceMetricsSection from '../../../shared/components/metrics/PerformanceMetricsSection';

const PerformancePage = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
            <div className="max-w-[1400px] mx-auto">
                <PerformanceMetricsSection />
            </div>
        </div>
    );
};

export default PerformancePage;
