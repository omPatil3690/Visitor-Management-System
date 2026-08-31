import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    ShieldCheck,
    ClipboardList,
    BarChart2,
    CheckCircle2,
    ArrowRight,
    Building2,
    Twitter,
    Linkedin,
    Github
} from "lucide-react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { useAuthStore } from "../store/auth";

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();
    
    // Parallax effect for hero
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fadeInUp: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-sky-200">
            {/* Navigation */}
            <nav
                className={`w-full flex items-center justify-between px-6 lg:px-12 py-4 fixed top-0 z-50 transition-all duration-300 border-b ${
                    scrolled 
                    ? "bg-white/90 backdrop-blur-md shadow-sm border-gray-200" 
                    : "bg-transparent border-transparent"
                }`}
            >
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate("/")}
                >
                    <div className="bg-sky-600 rounded-lg p-1.5 transition-transform group-hover:scale-105">
                        <Building2 className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-slate-800' : 'text-slate-800 lg:text-white'}`}>
                        Campus<span className="text-sky-600">VMS</span>
                    </span>
                </div>

                <div className="flex gap-4">
                    {isAuthenticated ? (
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-full text-sm transition-all duration-300 shadow-lg shadow-sky-600/20 hover:shadow-sky-600/40 flex items-center gap-2"
                        >
                            Go to Dashboard <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-white text-sky-700 hover:bg-sky-50 font-bold py-2.5 px-6 rounded-full text-sm transition-all duration-300 shadow-md flex items-center gap-2"
                        >
                            Log In <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-b from-sky-50 to-white">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-sky-200/40 blur-[80px] mix-blend-multiply animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] rounded-full bg-indigo-200/40 blur-[80px] mix-blend-multiply"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] opacity-[0.04]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
                    {/* Left Content */}
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-100 shadow-sm text-sky-600 text-sm font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                            Next-Gen Visitor Management
                        </div>
                        
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                            Secure your premises with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">confidence.</span>
                        </h1>
                        
                        <p className="text-slate-600 text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            The complete solution for modern campuses. Streamline check-ins, enhance security, and track visitors in real-time with our intuitive platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <button
                                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-xl shadow-sky-600/20 hover:shadow-sky-600/40 hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                {isAuthenticated ? "Go to Dashboard" : "Get Started Now"}
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            <button className="px-8 py-4 rounded-xl font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all bg-white shadow-sm">
                                Learn More
                            </button>
                        </div>

                        <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span>Instant Notifications</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span>Real-time Tracking</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual (Abstract Dashboard Representation) */}
                    <div className="relative hidden lg:block h-[600px] w-full perspective-1000">
                        <motion.div 
                            style={{ y: y2 }}
                            className="relative w-full h-full flex justify-center items-center"
                        >
                            {/* Abstract System Container */}
                            <div className="relative w-[500px] h-[500px]">
                                
                                {/* Central Pulse/Orbit */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Outer Ring */}
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                        className="w-[450px] h-[450px] rounded-full border border-dashed border-slate-200/80 absolute"
                                    ></motion.div>
                                    
                                    {/* Middle Ring */}
                                    <motion.div 
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                        className="w-[350px] h-[350px] rounded-full border border-slate-100 absolute"
                                    ></motion.div>

                                    {/* Inner Pulse */}
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-[250px] h-[250px] rounded-full bg-blue-50/50 absolute blur-2xl"
                                    ></motion.div>
                                    
                                    {/* Core Node */}
                                    <div className="w-32 h-32 rounded-full bg-white shadow-2xl shadow-blue-100 flex items-center justify-center relative z-20 border border-white/50 backdrop-blur-xl">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20"></div>
                                            <Building2 className="h-10 w-10 text-blue-600 relative z-10" />
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Card 1: Access Status */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                                    transition={{ 
                                        opacity: { delay: 0.5, duration: 0.8 },
                                        y: { repeat: Infinity, duration: 5, ease: "easeInOut" }
                                    }}
                                    className="absolute top-[20%] right-[0%] bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/60 flex items-center gap-3 z-30 w-48"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Status</div>
                                        <div className="text-sm font-bold text-slate-800">Secure</div>
                                    </div>
                                </motion.div>

                                {/* Floating Card 2: Visitor Badge (Abstract) */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
                                    transition={{ 
                                        opacity: { delay: 0.8, duration: 0.8 },
                                        y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }
                                    }}
                                    className="absolute bottom-[20%] left-[0%] bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/60 flex items-center gap-3 z-30 w-56"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Check-in</div>
                                        <div className="text-sm font-bold text-slate-800">Visitor Processed</div>
                                    </div>
                                    <div className="ml-auto flex gap-1">
                                        <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                                    </div>
                                </motion.div>

                                {/* Floating Card 3: Real-time Stats */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1, y: [0, 5, 0] }}
                                    transition={{ 
                                        opacity: { delay: 1.1, duration: 0.8 },
                                        y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }
                                    }}
                                    className="absolute -bottom-[5%] right-[15%] bg-white/90 backdrop-blur-md py-3 px-4 rounded-full shadow-lg border border-white/60 flex items-center gap-3 z-20"
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-xs font-semibold text-slate-600">Active Monitoring</span>
                                </motion.div>

                                    {/* Connection Lines (SVG) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-30">
                                    <circle cx="50%" cy="50%" r="150" fill="none" stroke="url(#gradient-line)" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow" />
                                    <defs>
                                        <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </motion.div>
                        
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100 via-indigo-50 to-white rounded-full blur-3xl -z-10 opacity-60"></div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <section className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to manage visitors securely.</h2>
                        <p className="text-slate-600 text-lg">Our platform provides comprehensive tools to streamline your front desk operations while ensuring maximum security compliant with modern standards.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<ShieldCheck className="h-8 w-8 text-purple-600" />}
                            title="Enterprise Security"
                            description="Advanced verification logic and secure data handling ensure that only authorized personnel can access your premises."
                            color="bg-purple-50"
                        />
                        <FeatureCard 
                            icon={<ClipboardList className="h-8 w-8 text-blue-600" />}
                            title="Streamlined Entry"
                            description="Digital check-in flows reduce wait times and eliminate paper logs, creating a professional first impression."
                            color="bg-blue-50"
                        />
                        <FeatureCard 
                            icon={<BarChart2 className="h-8 w-8 text-emerald-600" />}
                            title="Real-Time Insights"
                            description="Monitor traffic patterns and visitor history with our intuitive dashboard and reporting tools."
                            color="bg-emerald-50"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 blur-[128px] opacity-20 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 blur-[128px] opacity-20 rounded-full"></div>

                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your campus?</h2>
                    <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">Join hundreds of institutions that trust CampusVMS for their visitor management needs.</p>
                    <button
                        onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
                        className="bg-white text-slate-900 hover:bg-blue-50 font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 shadow-xl hover:scale-105"
                    >
                        Get Started Today
                    </button>
                    </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 font-sans">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
                        {/* Brand Column */}
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-1.5 bg-blue-900/30 rounded-lg border border-blue-800">
                                    <Building2 className="text-blue-500 h-6 w-6" />
                                </div>
                                <span className="text-2xl font-bold text-white tracking-tight">Campus<span className="text-blue-500">VMS</span></span>
                            </div>
                            <p className="text-slate-400 text-lg mb-8 max-w-sm leading-relaxed">
                                Modern visitor management for forward-thinking campuses. Secure, fast, and reliable.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300">
                                    <Twitter size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300">
                                    <Linkedin size={18} />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300">
                                    <Github size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Links Columns */}
                        <div>
                            <h4 className="text-white font-bold mb-6">Product</h4>
                            <ul className="space-y-4">
                                {['Features', 'How It Works', 'Pricing', 'Security'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-blue-400 transition-colors duration-200">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Company</h4>
                            <ul className="space-y-4">
                                {['About Us', 'Contact', 'Careers', 'Blog'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-blue-400 transition-colors duration-200">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Legal</h4>
                            <ul className="space-y-4">
                                {['Privacy Policy', 'Terms of Service', 'Data Protection'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-blue-400 transition-colors duration-200">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm">
                            &copy; {new Date().getFullYear()} CampusVMS. Secure visitor management built for campuses.
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            All Systems Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300"
        >
            <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </motion.div>
    );
};

export default Home;
