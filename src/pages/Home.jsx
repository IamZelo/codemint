import { motion } from 'framer-motion';
import preview from "../assets/dashboard_preview.png"

const Home = () => (
    <motion.div 
        
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)]">
        <main className="flex-grow pt-24">
            <section className="hero text-center flex flex-col items-center gap-6 mt-12 px-4">
                <h2 className="text-4xl sm:text-6xl font-bold max-w-3xl leading-tight">Track Your Spending, Forecast Your Future with AI.</h2>
                <p className="text-base sm:text-lg max-w-3xl mb-4 text-gray-400">
                    Effortlessly analyze your UPI screenshots and bank statements. Gain insights, spot trends, and let our
                    AI-powered forecasts guide you to financial clarity.
                </p>
                <div className="dashboard-preview w-full max-w-5xl mt-8 rounded-xl border border-gray-700 overflow-hidden shadow-2xl bg-gray-800 shadow-emerald-500/10">
                    <div className="h-8 bg-gray-700 flex items-center px-4 space-x-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                    <img src={preview} alt="ForeFunds Finance Dashboard Preview" className="w-full h-auto block" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/900x450/1F2937/F3F4F6?text=Dashboard+Preview'; }} />
                </div>
            </section>
        </main>
        <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm mt-24">
            <p>&copy; {new Date().getFullYear()} ForeFunds Finance. All Rights Reserved.</p>
        </footer>
    </div>
    </motion.div>
);

export default Home;