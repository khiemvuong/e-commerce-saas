"use client";

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

                    <div className="prose prose-gray max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                When you use ILAN Shop, we may collect the following information:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li><strong>Personal Information:</strong> Name, email, phone number, shipping address.</li>
                                <li><strong>Account Information:</strong> Username, encrypted password.</li>
                                <li><strong>Transaction Information:</strong> Order history, payment methods.</li>
                                <li><strong>Device Information:</strong> Browser type, IP address, device details.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Process and deliver your orders.</li>
                                <li>Provide customer support services.</li>
                                <li>Send order updates and promotions (with your consent).</li>
                                <li>Improve user experience and services.</li>
                                <li>Detect and prevent fraud.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Information Security</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                We apply industry-standard security measures to protect your information:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>SSL encryption for all connections.</li>
                                <li>One-way password hashing.</li>
                                <li>Automated intrusion detection systems.</li>
                                <li>Regular security audits.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Information Sharing</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                We do not sell your personal information. Information is only shared in these cases:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>With sellers to process your orders (name, shipping address).</li>
                                <li>With shipping partners for delivery.</li>
                                <li>With payment processors to handle transactions.</li>
                                <li>As required by law enforcement.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Cookies & Tracking</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We use cookies to remember your login, shopping cart, and improve your experience. 
                                You can disable cookies in your browser settings, but some features may not work 
                                properly.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Access and view your personal information.</li>
                                <li>Request corrections to inaccurate information.</li>
                                <li>Request deletion of your account and related data.</li>
                                <li>Unsubscribe from marketing emails.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Data Retention</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Your information is stored on secure servers. Transaction data is retained 
                                as required by law (typically 5 years).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Contact</h2>
                            <p className="text-gray-600 leading-relaxed">
                                If you have questions about this Privacy Policy or want to exercise your rights, 
                                please contact us at:<br />
                                <strong>Email:</strong> privacy@ilanshop.com<br />
                                <strong>Hotline:</strong> 1-800-XXX-XXXX
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
