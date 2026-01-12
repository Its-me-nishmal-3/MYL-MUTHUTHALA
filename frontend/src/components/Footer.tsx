

import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-8 mt-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">

                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">MYL MUTHUTHALA</h3>
                        <p className="text-sm mb-2">
                            Empowering the community with quality products and services.
                        </p>
                        <div className="text-sm text-gray-500">
                            <p>Email: dev.nishmal@gmail.com</p>
                            <p>Phone: +91 8592887385</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
                            <li><Link to="/contact-us" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Policies</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms-and-conditions" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link></li>
                            <li><Link to="/shipping-policy" className="hover:text-emerald-400 transition-colors">Shipping Policy</Link></li>
                            <li><Link to="/return-policy" className="hover:text-emerald-400 transition-colors">Return Policy</Link></li>
                            <li><Link to="/cancellation-refund" className="hover:text-emerald-400 transition-colors">Cancellation & Refund</Link></li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs">
                    <p>&copy; {new Date().getFullYear()} MYL MUTHUTHALA. All rights reserved.</p>
                </div>
            </div>
        </footer >
    );
};

export default Footer;
