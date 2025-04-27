import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    ShieldCheck,
    ClipboardList,
    BarChart2
} from "lucide-react";

const Home = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col scroll-smooth">
            { }
            <nav
                className={`w-full flex items-center justify-between px-6 py-4 fixed top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white bg-opacity-80 backdrop-blur"
                    }`}
            >

                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <img src="/visitor-management.png" alt="Logo" className="h-8 w-8" />
                </div>


                <div className="text-xl md:text-2xl font-bold text-sky-800">
                    Visitor Management System
                </div>


                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/request-visit")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-all duration-300"
                    >
                        Request Visit
                    </button>
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-all duration-300"
                    >
                        Log In
                    </button>
                </div>
            </nav>

            { }
            <div
                className="min-h-[80vh] flex items-center justify-center bg-cover bg-center px-6 pt-24 pb-10"
                style={{
                    backgroundImage: "url('/c8331ead-7366-4dc7-88a9-36ade9571557.jpg')",
                }}
            >
                <div className="bg-white bg-opacity-90 p-10 rounded-xl shadow-2xl max-w-2xl text-center animate-fadeIn">
                    <h1 className="text-5xl font-bold text-sky-800 mb-6">
                        Streamline Your Visitor Experience
                    </h1>
                    <p className="text-gray-700 text-lg mb-8">
                        Modernize your front desk with our easy-to-use visitor management system.
                        Enhance security and efficiency seamlessly.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-300"
                    >
                        Log In
                    </button>
                </div>
            </div>

            { }
            <section className="py-16 bg-gray-100">
                <div className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3 text-center">

                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <div className="flex justify-center text-sky-600 mb-4">
                            <ShieldCheck size={48} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Secure Check-ins</h3>
                        <p className="text-gray-600">Ensure only authorized visitors gain access.</p>
                    </div>


                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <div className="flex justify-center text-sky-600 mb-4">
                            <ClipboardList size={48} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Easy Registration</h3>
                        <p className="text-gray-600">Quick and intuitive visitor registration process.</p>
                    </div>


                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300">
                        <div className="flex justify-center text-sky-600 mb-4">
                            <BarChart2 size={48} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Real-Time Monitoring</h3>
                        <p className="text-gray-600">Track visitor activity with live updates.</p>
                    </div>
                </div>
            </section>


            <footer className="bg-sky-700 text-white py-4 text-center">
                &copy; {new Date().getFullYear()} Visitor Management System. All rights reserved.
            </footer>
        </div>
    );
};

export default Home;
