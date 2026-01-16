"use client";

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Terms of Service</h1>
                    <p className="text-gray-500 text-sm mb-8">Last updated: January 2025</p>

                    <div className="prose prose-gray max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Welcome to ILAN Shop. By accessing and using our website, 
                                you agree to comply with the terms and conditions outlined below.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. User Accounts</h2>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>You must provide accurate and complete information when creating an account.</li>
                                <li>You are responsible for maintaining the security of your login credentials.</li>
                                <li>Each person may only use one personal account.</li>
                                <li>We reserve the right to suspend accounts that violate our policies.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Orders & Payment</h2>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Product prices are displayed in USD.</li>
                                <li>Orders are confirmed only after successful payment or seller acceptance for COD.</li>
                                <li>We reserve the right to cancel orders if fraud is detected.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Return Policy</h2>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Products can be returned within 7 days if defective or not as described.</li>
                                <li>Products must be in original condition with tags intact and unused.</li>
                                <li>Return shipping costs are covered by the party at fault.</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Intellectual Property</h2>
                            <p className="text-gray-600 leading-relaxed">
                                All content on this website including logos, images, and text are the property 
                                of ILAN Shop or authorized parties. Copying or distribution without written 
                                permission is prohibited.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Limitation of Liability</h2>
                            <p className="text-gray-600 leading-relaxed">
                                ILAN Shop is a marketplace connecting buyers and sellers. We are not responsible 
                                for product quality provided by sellers, but we will assist in resolving disputes 
                                between parties.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Changes to Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may update these terms at any time. Changes will be communicated via email 
                                or displayed on the website. Continued use of our services means you accept 
                                the updated terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Contact</h2>
                            <p className="text-gray-600 leading-relaxed">
                                If you have any questions about these Terms of Service, please contact us at:<br />
                                <strong>Email:</strong> legal@ilanshop.com<br />
                                <strong>Hotline:</strong> 1-800-XXX-XXXX
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
