import { motion } from 'framer-motion';


const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12a5 5 0 0 1 5-5" /><path d="M12 17a5 5 0 0 0 5-5" /></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;

const Features = () => (
    <motion.div 
        
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
    <div className="container mx-auto px-4 sm:px-8 py-16">
        <section className="py-20 bg-gray-800/20 rounded-2xl">
            <div className="container mx-auto px-4 sm:px-8 text-center">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-emerald-400">From Image to Insight</h3>
                <p className="text-gray-300 mb-12 max-w-3xl mx-auto">Stop typing, start seeing. ForeFunds' unique scanning technology turns your UPI screenshots and bank PDFs directly into categorized data, saving you time and effort.</p>
                <div className="flex justify-center items-center space-x-4 sm:space-x-8 text-gray-400">
                    <div className="flex flex-col items-center text-center">
                        <img src="https://img.icons8.com/plasticine/100/000000/image.png" alt="Screenshot Icon" className="h-20 w-20 mb-2" />
                        <p className="font-semibold text-white">1. Upload Screenshot</p>
                        <p className="text-sm">Share a UPI payment confirmation.</p>
                    </div>
                    <div className="text-2xl font-light text-emerald-500">&rarr;</div>
                    <div className="flex flex-col items-center text-center">
                        <img src="https://img.icons8.com/plasticine/100/000000/pdf.png" alt="PDF Icon" className="h-20 w-20 mb-2" />
                        <p className="font-semibold text-white">2. Upload PDF</p>
                        <p className="text-sm">Or upload a bank statement.</p>
                    </div>
                    <div className="text-2xl font-light text-emerald-500">&rarr;</div>
                    <div className="flex flex-col items-center text-center">
                        <img src="https://img.icons8.com/plasticine/100/000000/bar-chart.png" alt="Chart Icon" className="h-20 w-20 mb-2" />
                        <p className="font-semibold text-white">3. Get Insights</p>
                        <p className="text-sm">Receive instant analysis.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="features" className="container mx-auto px-4 sm:px-8 py-24 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Succeed</h3>
            <p className="text-gray-400 mb-12 max-w-2xl mx-auto">ForeFunds provides powerful, easy-to-use tools to help you master your money.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="feature-card">
                    <div className="mb-4 text-emerald-400"><ScanIcon /></div>
                    <h4 className="text-xl font-semibold mb-2">Automated Scanning</h4>
                    <p className="text-gray-400">Turn UPI screenshots and bank statement PDFs into categorized transactions automatically. No more manual entry.</p>
                </div>
                <div className="feature-card">
                    <div className="mb-4 text-emerald-400"><BotIcon /></div>
                    <h4 className="text-xl font-semibold mb-2">AI-Powered Insights</h4>
                    <p className="text-gray-400">Our smart assistant analyzes your spending, identifies trends, and provides actionable advice to help you save.</p>
                </div>
                <div className="feature-card">
                    <div className="mb-4 text-emerald-400"><TargetIcon /></div>
                    <h4 className="text-xl font-semibold mb-2">Goal Tracking & Rewards</h4>
                    <p className="text-gray-400">Set financial goals, track your progress, and earn rewards for staying on track. Making finance fun!</p>
                </div>
            </div>
        </section>
    </div>
    </motion.div>
);

export default Features;