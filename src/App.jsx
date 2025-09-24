import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, doc, onSnapshot, addDoc, deleteDoc, setDoc, getDoc, updateDoc, arrayUnion, query, orderBy, limit } from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { marked } from 'marked';
// --- IMPORTANT ---
// To run this app locally with a tool like Vite, you should use environment variables
// to keep your API keys secure.
// 1. Create a file named `.env` in the root of your project.
// 2. Add your keys to this file, prefixed with `VITE_`.
//    Example: VITE_FIREBASE_API_KEY="your-key-here"
// 3. In your code, you would access them like this: `import.meta.env.VITE_FIREBASE_API_KEY`
//
// For compatibility with this environment, we are using placeholders below.
// You MUST replace them with your actual keys for the app to work.

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- SVG ICONS ---
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12a5 5 0 0 1 5-5" /><path d="M12 17a5 5 0 0 0 5-5" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;


// --- HELPER & UTILITY COMPONENTS ---

const Toast = ({ message, show }) => (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-teal-400 text-gray-900 font-semibold shadow-lg transition-all duration-300 ${show ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {message}
    </div>
);

const Loader = ({ size = 'w-8 h-8' }) => (
    <div className={`loader border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin ${size}`}></div>
);

const Preloader = () => (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <h1 className="text-4xl font-bold tracking-wider text-emerald-400 mb-4">ForeFunds</h1>
        <Loader />
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose}></div>
        <div className={`bg-gray-800 rounded-lg p-8 shadow-xl max-w-sm w-full mx-4 z-10 transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="text-gray-300 mb-6">
                {children}
            </div>
            <div className="flex justify-end space-x-4">
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition transform hover:-translate-y-px"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition transform hover:-translate-y-px"
                >
                    Logout
                </button>
            </div>
        </div>
    </div>
);


// --- UI COMPONENTS ---

const LandingView = () => (
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
                    <img src="src\assets\dashboard_preview.png" alt="ForeFunds Finance Dashboard Preview" className="w-full h-auto block" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/900x450/1F2937/F3F4F6?text=Dashboard+Preview'; }} />
                </div>
            </section>
        </main>
        <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm mt-24">
            <p>&copy; {new Date().getFullYear()} ForeFunds Finance. All Rights Reserved.</p>
        </footer>
    </div>
);

const FeaturesView = () => (
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
);

const AboutView = () => (
    <div className="container mx-auto px-4 sm:px-8 py-16">
        <section id="about" className="py-24 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">Our Vision: Financial Clarity for Everyone</h3>
            <p className="text-gray-400 max-w-3xl mx-auto">
                We believe managing your finances shouldn't be a chore. ForeFunds was born from a simple idea: to create a smart, intuitive, and automated financial tool that understands the way you transact today. By leveraging the power of AI to read documents you already have, we're making financial tracking accessible, effortless, and even a little fun for everyone in India. Our goal is to empower you with clear insights so you can make confident financial decisions.
            </p>
        </section>
    </div>
);


const TrendChart = ({ transactions }) => {
    const chartData = useMemo(() => {
        if (!transactions) return [];
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dayOfMonth = today.getDate();

        const monthlyExpenses = transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        });

        const expensesTotal = monthlyExpenses.reduce((acc, t) => acc + t.amount, 0);
        const avgDaily = (dayOfMonth > 0 && expensesTotal > 0) ? expensesTotal / dayOfMonth : 0;
        let cumulativeSpending = 0;
        const data = [];
        for (let day = 1; day <= daysInMonth; day++) {
            let dailyTotal = 0;
            if (day <= dayOfMonth) {
                dailyTotal = monthlyExpenses.filter(t => new Date(t.date).getDate() === day).reduce((acc, t) => acc + t.amount, 0);
                cumulativeSpending += dailyTotal;
            }
            data.push({
                name: `Day ${day}`,
                actual: day <= dayOfMonth ? cumulativeSpending : null,
                projected: day > dayOfMonth && data[dayOfMonth - 1] ? data[dayOfMonth - 1].actual + (avgDaily * (day - dayOfMonth)) : cumulativeSpending
            });
        }
        return data;
    }, [transactions]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563', borderRadius: '0.5rem' }} labelStyle={{ color: '#d1d5db' }} />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Line type="monotone" dataKey="actual" name="Actual Spending" stroke="#34d399" strokeWidth={2} dot={false} connectNulls={true} />
                <Line type="monotone" dataKey="projected" name="Projected Trend" stroke="#fb923c" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};

const DashboardView = ({ user, transactions, goal, onShowToast, onAwardAchievement }) => {

    const [fileToAnalyze, setFileToAnalyze] = useState({ type: null, data: null });
    const [fileName, setFileName] = useState('No image selected.');
    const [pdfFileName, setPdfFileName] = useState('No PDF selected.');
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [insights, setInsights] = useState('<p class="text-gray-400">Add a transaction to get your first financial analysis.</p>');
    const [isFetchingInsights, setIsFetchingInsights] = useState(false);

    const formatCurrency = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const { income, expenses, balance } = useMemo(() => {
        const today = new Date();
        const currentMonthTxs = transactions.filter(t => {
            if (!t.date) return false;
            const tDate = new Date(t.date);
            return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        });
        const income = currentMonthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        return { income, expenses, balance: income - expenses };
    }, [transactions]);

    const projectedSpending = useMemo(() => {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dayOfMonth = today.getDate();
        const averageDailySpending = (dayOfMonth > 0 && expenses > 0) ? expenses / dayOfMonth : 0;
        return averageDailySpending * daysInMonth;
    }, [expenses]);

    const transactionsCol = useMemo(() => collection(db, 'transactions', user.uid, 'history'), [user.uid]);
    const goalDoc = useMemo(() => doc(db, 'goals', user.uid), [user.uid]);

    const addNewTransactions = useCallback(async (newTxs) => {
        try {
            const promises = newTxs.map(tx => addDoc(transactionsCol, { ...tx, amount: parseFloat(tx.amount) }));
            await Promise.all(promises);
            onShowToast(`${newTxs.length} transaction(s) added successfully!`);
        } catch (error) {
            console.error("Error adding transactions:", error);
            onShowToast("Failed to add transactions.");
        }
    }, [transactionsCol, onShowToast]);

    const removeTransaction = async (id) => {
        await deleteDoc(doc(db, 'transactions', user.uid, 'history', id));
    };

    const setGoal = async (e) => {
        e.preventDefault();
        const newGoal = {
            description: e.target.elements['goal-description'].value,
            amount: parseFloat(e.target.elements['goal-amount'].value),
            reward: e.target.elements['goal-reward'].value
        };
        await setDoc(goalDoc, newGoal);
        e.target.reset();
    };

    const removeGoal = async () => await deleteDoc(goalDoc);

    const addManualTransaction = async (e) => {
        e.preventDefault();
        const form = e.target;
        const newTransaction = {
            description: form.elements.description.value,
            amount: parseFloat(form.elements.amount.value),
            date: form.elements.date.value,
            type: form.elements.type.value,
            category: form.elements.category.value
        };
        await addDoc(transactionsCol, newTransaction);
        form.reset();
        form.elements.date.value = new Date().toISOString().slice(0, 10);
    };

    const getGeminiInsights = useCallback(async () => {

        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
            setInsights(`<p class="text-orange-400">Add your Gemini API key to enable AI insights.</p>`);
            return;
        }
        if (transactions.length === 0) {
            setInsights(`<p class="text-gray-400">Add a transaction for analysis.</p>`);
            return;
        }
        setIsFetchingInsights(true);
        const prompt = `You are ForeFunds, a friendly financial assistant for a user in India. Analyze these JSON transactions for the current month. Today's Date: ${new Date().toLocaleDateString()}. Current Net Balance: ${formatCurrency(balance)}. \n\n ${JSON.stringify(transactions)} \n\n Provide a concise, easy-to-read summary of the analysis in well-structured Markdown. The summary should include:\n\n### Spending Summary\n- A brief overview of the top 2-3 spending categories.\n\n### Savings Suggestions\n- 2-3 actionable savings tips based on their specific spending.\n\n### Future Forecast\n- A narrative forecast for their end-of-month spending.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) { const err = await response.json(); throw new Error(err.error.message); }
            const result = await response.json();
            let text = result.candidates[0].content.parts[0].text;
            let html = '';
            text.split('\n').forEach(line => {
                if (line.startsWith('### ')) html += `<h3 class="text-lg font-semibold mt-4">${line.substring(4)}</h3>`;
                else if (line.startsWith('* ') || line.startsWith('- ')) html += `<li class="ml-5 list-disc">${line.substring(2)}</li>`;
                else if (line.trim() !== '') html += `<p>${line}</p>`;
            });
            html = marked(text);
            setInsights(html);
        } catch (error) {
            setInsights(`<p class="text-red-400">Error: ${error.message}</p>`);
        } finally {
            setIsFetchingInsights(false);
        }
    }, [transactions, balance]);

    useEffect(() => {
        const handler = setTimeout(() => { if (transactions.length > 0) getGeminiInsights(); }, 1500);
        return () => clearTimeout(handler);
    }, [getGeminiInsights, transactions]);

    const handleFileSelect = (event, type) => {
        const file = event.target.files[0];
        if (!file) {
            if (type === 'image') { setFileName('No image selected.'); setImagePreview(null); }
            else { setPdfFileName('No PDF selected.'); }
            setFileToAnalyze({ type: null, data: null }); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'image') {
                setFileToAnalyze({ type: 'image', data: reader.result.split(',')[1], mime: file.type });
                setFileName(file.name); setImagePreview(reader.result); setPdfFileName('No PDF selected.');
                if (document.getElementById('pdf-statement')) document.getElementById('pdf-statement').value = '';
            } else {
                setFileToAnalyze({ type: 'pdf', data: new Uint8Array(reader.result) });
                setPdfFileName(file.name); setFileName('No image selected.'); setImagePreview(null);
                if (document.getElementById('upi-screenshot')) document.getElementById('upi-screenshot').value = '';
            }
        };
        if (type === 'pdf') reader.readAsArrayBuffer(file); else reader.readAsDataURL(file);
    };

    const analyzeDocument = useCallback(async () => {
        if (!fileToAnalyze.data) { onShowToast('Please select a file to analyze.'); return; }
        if (!window.pdfjsLib) { onShowToast('PDF library is not loaded yet. Please try again in a moment.'); return; }
        setIsAnalyzing(true);
        const categories = "'Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Income', 'Other'";
        let parts = [];
        if (fileToAnalyze.type === 'image') {
            parts = [
                { text: `Analyze the UPI screenshot. Extract all transactions into a valid JSON array. Each object needs keys: "amount" (number), "description" (string), "date" (string, "YYYY-MM-DD"), "type" (string, "expense" or "income"), and "category" (infer from ${categories}). Today is ${new Date().toISOString().slice(0, 10)}. Example: [{"amount": 150.75, "description": "Zomato", "date": "2025-09-24", "type": "expense", "category": "Food"}]` },
                { inlineData: { mimeType: fileToAnalyze.mime, data: fileToAnalyze.data } }
            ];
        } else {
            try {
                const pdf = await window.pdfjsLib.getDocument(fileToAnalyze.data).promise;
                let pdfText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    pdfText += (await page.getTextContent()).items.map(item => item.str).join(' ');
                }
                parts = [{ text: `Analyze this bank statement text. Extract all transactions into a valid JSON array. Each object needs keys: "amount" (number, always positive), "description" (string), "date" (string, "YYYY-MM-DD"), "type" (string, "income" for credits, "expense" for debits), and "category" (infer from ${categories}). Current year is ${new Date().getFullYear()}. Ignore summaries. Text: \n\n ${pdfText}` }];
            } catch (error) { onShowToast("Error reading PDF file."); setIsAnalyzing(false); return; }
        }
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts }] })
            });
            if (!response.ok) throw new Error('API request failed');
            const result = await response.json();
            const textResponse = result.candidates[0].content.parts[0].text;
            const jsonMatch = textResponse.match(/\[.*\]/s);
            if (!jsonMatch) throw new Error("Could not find JSON array in the AI's response.");
            const data = JSON.parse(jsonMatch[0]);
            addNewTransactions(data);
            onAwardAchievement('first_scan');
        } catch (error) {
            console.error("Error analyzing document:", error);
            onShowToast("Could not extract details. Please try another file.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [fileToAnalyze, onShowToast, addNewTransactions, onAwardAchievement]);

    useEffect(() => {
        if (goal && balance >= goal.amount) {
            onAwardAchievement('goal_achieved');
        }
    }, [goal, balance, onAwardAchievement]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-10 mt-8">
                <h1 className="text-4xl md:text-5xl font-bold">Welcome, {user.displayName.split(' ')[0]}!</h1>
                <p className="text-gray-400 mt-2">Here's your financial overview for the month.</p>
            </header>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Add Transaction</h2>
                        <div className="mb-4 border border-dashed border-gray-600 rounded-lg p-4 text-center space-y-3">
                            <h3 className="font-semibold text-lg">Scan Document</h3>
                            <input type="file" id="upi-screenshot" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
                            <label htmlFor="upi-screenshot" className="file-input-label block">Upload UPI Screenshot</label>
                            <p className="text-xs text-gray-400">{fileName}</p>
                            {imagePreview && <div className="mt-2"><img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-md" /></div>}
                            <input type="file" id="pdf-statement" accept=".pdf" className="hidden" onChange={e => handleFileSelect(e, 'pdf')} />
                            <label htmlFor="pdf-statement" className="file-input-label block">Upload Bank Statement (PDF)</label>
                            <p className="text-xs text-gray-400">{pdfFileName}</p>
                            <button onClick={analyzeDocument} disabled={!fileToAnalyze.data || isAnalyzing} className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 transform hover:-translate-y-0.5">
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
                            </button>
                            {isAnalyzing && <div className="flex justify-center items-center mt-2"><Loader size="w-6 h-6" /></div>}
                        </div>
                        <p className="text-center text-gray-500 my-2">OR</p>
                        <form onSubmit={addManualTransaction} className="space-y-4">
                            <input type="text" name="description" placeholder="Description" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            <input type="number" name="amount" placeholder="Amount" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0.01" step="0.01" />
                            <input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            <select name="type" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="expense">Expense</option> <option value="income">Income</option>
                            </select>
                            <select name="category" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="Other">Category: Other</option><option value="Food">Food</option><option value="Transport">Transport</option><option value="Shopping">Shopping</option><option value="Utilities">Utilities</option><option value="Entertainment">Entertainment</option><option value="Income">Income</option>
                            </select>
                            <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-bold py-3 rounded-lg transition transform hover:-translate-y-0.5">
                                Add Manually
                            </button>
                        </form>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Monthly Goal</h2>
                        {goal ? (
                            <div>
                                <p className="font-semibold text-lg">{goal.description}</p>
                                <p className="text-gray-400">Target: {formatCurrency(goal.amount)}</p>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min((balance > 0 ? balance / goal.amount : 0) * 100, 100)}%` }}></div>
                                </div>
                                <div className="mt-2">
                                    {(balance > 0 ? balance / goal.amount : 0) >= 1 ?
                                        <p className="text-lg text-green-400 font-bold">🎉 Goal Achieved! Reward: {goal.reward}</p> :
                                        <p>You are {((balance > 0 ? balance / goal.amount : 0) * 100).toFixed(1)}% towards your goal.</p>
                                    }
                                </div>
                                <button onClick={removeGoal} className="text-red-500 hover:text-red-400 text-xs mt-3 transition-colors">Remove Goal</button>
                            </div>
                        ) : (
                            <form onSubmit={setGoal}>
                                <div className="space-y-3">
                                    <input type="text" name="goal-description" placeholder="Goal (e.g., Save for vacation)" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="number" name="goal-amount" placeholder="Target Amount" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required min="1" />
                                    <input type="text" name="goal-reward" placeholder="Reward (e.g., Fancy Dinner)" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition transform hover:-translate-y-0.5">Set Goal</button>
                            </form>
                        )}
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">History</h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{tx.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()} <span className="ml-2 px-2 py-0.5 bg-gray-600 rounded-full text-xs">{tx.category}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>{tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount)}</p>
                                        <button onClick={() => removeTransaction(tx.id)} className="text-gray-500 hover:text-white text-xs mt-1 transition-colors">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-800/50 p-5 rounded-2xl shadow-lg border border-gray-700/50">
                            <h3 className="text-sm font-medium text-emerald-400">MONTHLY INCOME</h3>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(income)}</p>
                        </div>
                        <div className="bg-gray-800/50 p-5 rounded-2xl shadow-lg border border-gray-700/50">
                            <h3 className="text-sm font-medium text-red-400">MONTHLY EXPENSES</h3>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(expenses)}</p>
                        </div>
                        <div className="bg-gray-800/50 p-5 rounded-2xl shadow-lg border border-gray-700/50">
                            <h3 className="text-sm font-medium text-blue-400">NET BALANCE</h3>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(balance)}</p>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">Spending Trend</h2>
                            <div className="text-right">
                                <h3 className="text-sm font-medium text-gray-400">PROJECTED MONTHLY SPEND</h3>
                                <p className="text-xl font-bold text-orange-400">{formatCurrency(projectedSpending)}</p>
                            </div>
                        </div>
                        <TrendChart transactions={transactions} />
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h2 className="text-2xl font-semibold mb-4">Your AI Financial Assistant</h2>
                        {isFetchingInsights ? <div className="flex justify-center items-center mt-4"><Loader /></div>
                            : <div className="mt-4 space-y-4 prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-gray-100" dangerouslySetInnerHTML={{ __html: insights }}></div>
                        }
                    </div>
                </div>
            </main>
        </div>
    );
};


const LeaderboardView = ({ leaderboardData, currentUser }) => {
    const getFallbackAvatar = (name) => {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff`;
    };

    const truncateName = (name) => name.length > 10 ? `${name.substring(0, 8)}...` : name;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-4 bg-gray-700/80 backdrop-blur-sm rounded-lg border border-gray-600 shadow-xl">
                    <p className="font-bold text-gray-100">{`${label}`}</p>
                    <p className="text-yellow-400">{`Points: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-10 mt-8">
                <h1 className="text-4xl md:text-5xl font-bold">Leaderboard</h1>
                <p className="text-gray-400 mt-2">See how you stack up against other savers!</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="lg:col-span-1 bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700/50">
                    <h2 className="text-2xl font-semibold mb-4">Top 10 Savers</h2>
                    <div className="space-y-3">
                        {leaderboardData.map((user, index) => (
                            <div key={user.id} className={`flex items-center p-3 rounded-lg ${user.id === currentUser.uid ? 'bg-blue-500/20' : 'bg-gray-700/50'}`}>
                                <span className="font-bold text-lg w-8">{index + 1}</span>
                                <img
                                    src={user.photoURL || getFallbackAvatar(user.name)}
                                    loading='lazy'
                                    onError={(e) => { e.currentTarget.src = getFallbackAvatar(user.name); }}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full mx-3 bg-gray-600 object-cover"
                                />
                                <span className="flex-grow font-semibold truncate">{user.name}</span>
                                <span className="font-bold text-yellow-400">{user.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700/50">
                    <h2 className="text-2xl font-semibold mb-4">Points Distribution</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={leaderboardData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
                            <XAxis type="category" dataKey="name" stroke="#9ca3af" interval={0} angle={-45} textAnchor="end" tickFormatter={truncateName} />
                            <YAxis type="number" stroke="#9ca3af" />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                            <Bar dataKey="points" name="Points" barSize={20} radius={[4, 4, 0, 0]}>
                                {leaderboardData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.id === currentUser.uid ? '#3b82f6' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const SpendingHeatmap = ({ transactions }) => {
    const [date, setDate] = useState(new Date());

    const { year, month, dailyData, maxAmount } = useMemo(() => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const dataMap = new Map();
        let max = 1;

        transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return tDate.getFullYear() === year && tDate.getMonth() === month;
            })
            .forEach(t => {
                const day = new Date(t.date).getDate();
                const dayData = dataMap.get(day) || { income: 0, expense: 0 };
                if(t.type === 'income'){
                    dayData.income += t.amount;
                } else {
                    dayData.expense += t.amount;
                }
                dataMap.set(day, dayData);
                max = Math.max(max, dayData.income, dayData.expense);
            });

        return { year, month, dailyData: dataMap, maxAmount: max };
    }, [transactions, date]);
    
    const getSpendingColor = (income, expense, max) => {
        if (income === 0 && expense === 0) return 'bg-gray-700/50 hover:bg-gray-600/50';
       
        if (income > expense) {
            const percentage = income / max;
            if (percentage > 0.75) return 'bg-emerald-700 hover:bg-emerald-600';
            if (percentage > 0.5) return 'bg-emerald-600 hover:bg-emerald-500';
            if (percentage > 0.25) return 'bg-emerald-500 hover:bg-emerald-400';
            return 'bg-emerald-400 hover:bg-emerald-300';
        } else {
            const percentage = expense / max;
            if (percentage > 0.75) return 'bg-red-700 hover:bg-red-600';
            if (percentage > 0.5) return 'bg-red-600 hover:bg-red-500';
            if (percentage > 0.25) return 'bg-red-500 hover:bg-red-400';
            return 'bg-red-400 hover:bg-red-300';
        }
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`}></div>);

    for (let day = 1; day <= daysInMonth; day++) {
        const data = dailyData.get(day) || { income: 0, expense: 0 };
        const colorClass = getSpendingColor(data.income, data.expense, maxAmount);
        
        calendarDays.push(
            <div key={day} className="relative group flex items-center justify-center">
                <div className={`aspect-square w-full rounded-md flex items-center justify-center text-xs text-gray-300 transition-colors ${colorClass}`}>
                  {day}
                </div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                    <p className="text-emerald-400">In: ₹{data.income.toFixed(2)}</p>
                    <p className="text-red-400">Out: ₹{data.expense.toFixed(2)}</p>
                </div>
            </div>
        );
    }

    const changeMonth = (offset) => {
        const newDate = new Date(date);
        newDate.setMonth(date.getMonth() + offset);
        setDate(newDate);
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">&lt;</button>
                <h3 className="text-xl font-semibold text-center">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-xs text-gray-400 text-center font-bold">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-2">
                {calendarDays}
            </div>
            <div className="flex justify-end items-center space-x-2 mt-4 text-xs text-gray-400">
                <span className="text-red-500">Expense</span>
                <div className="w-3 h-3 rounded-sm bg-red-400/40"></div>
                <div className="w-3 h-3 rounded-sm bg-red-700"></div>
                <div className="w-1 h-3 mx-1 bg-gray-600"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-700"></div>
                <div className="w-3 h-3 rounded-sm bg-emerald-400/40"></div>
                <span className="text-emerald-500">Income</span>
            </div>
        </div>
    );
};


const ProfileView = ({ user, userProfile, onSetDailyGoal, onShowToast, transactions }) => {
    
    const handleGoalSubmit = (e) => {
        e.preventDefault();
        const goalAmount = parseFloat(e.target.elements.dailyGoal.value);
        if (isNaN(goalAmount) || goalAmount <= 0) {
            onShowToast("Please enter a valid goal amount.");
            return;
        }
        onSetDailyGoal(goalAmount);
    };

    return(
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-10 mt-8">
                <img src={user.photoURL} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-emerald-400" alt="User Profile"/>
                <h1 className="text-4xl md:text-5xl font-bold">{user.displayName}</h1>
                <p className="text-gray-400 mt-2">{user.email}</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
                <div className="lg:col-span-2 flex flex-col space-y-8">
                    <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h2 className="text-2xl font-semibold mb-2 text-center">Your Progress</h2>
                         <div className="text-center mb-6">
                            <span className="text-6xl font-bold text-amber-400">{userProfile?.streakCount || 0}</span>
                            <span className="text-4xl ml-2">🔥</span>
                            <p className="text-gray-400">Day Streak</p>
                        </div>
                        <form onSubmit={handleGoalSubmit}>
                            <label htmlFor="dailyGoal" className="block text-sm font-medium text-gray-300 mb-2">Set Your Daily Spending Goal</label>
                            <div className="flex items-center space-x-2">
                                 <input
                                    type="number"
                                    name="dailyGoal"
                                    id="dailyGoal"
                                    defaultValue={userProfile?.dailySpendingGoal}
                                    className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 500"
                                    min="1"
                                    step="any"
                                    required
                                 />
                                 <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:-translate-y-0.5">
                                    Set
                                 </button>
                            </div>
                        </form>
                    </div>
                     <SpendingHeatmap transactions={transactions} />
                </div>
                <div className="lg:col-span-3">
                    <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700/50 h-full">
                        <h2 className="text-2xl font-semibold mb-6">Achievements</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {ACHIEVEMENTS_LIST.map(ach => (
                                <div key={ach.id} className={`p-6 rounded-xl border transition-all duration-300 ${userProfile?.achievements?.includes(ach.id) ? 'bg-emerald-500/10 border-emerald-500' : 'bg-gray-800/50 border-gray-700'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-3xl">{ach.icon}</span>
                                        {userProfile?.achievements?.includes(ach.id) ? <CheckCircleIcon /> : <LockIcon />}
                                    </div>
                                    <h3 className="text-lg font-semibold">{ach.title}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{ach.description}</p>
                                    <p className="text-xs text-yellow-400 font-semibold mt-3">{ach.points} Points</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AppNavbar = ({ user, onSignOut, currentView, setCurrentView, onSignIn }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLinkClick = (view) => {
        setCurrentView(view);
        setIsMenuOpen(false);
    };

    const NavButton = ({ view, children }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`font-semibold transition transform hover:-translate-y-0.5 ${currentView === view ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}
        >
            {children}
        </button>
    );

    return (
        <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">
                    <button onClick={() => setCurrentView(user ? 'dashboard' : 'home')} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">ForeFunds</button>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {user ? (
                            <>
                                <NavButton view="dashboard">Dashboard</NavButton>
                                <NavButton view="leaderboard">Leaderboard</NavButton>
                                <NavButton view="features">Features</NavButton>
                                <NavButton view="about">About</NavButton>
                            </>
                        ) : (
                            <>
                                <NavButton view="home">Home</NavButton>
                                <NavButton view="features">Features</NavButton>
                                <NavButton view="about">About</NavButton>
                            </>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <button onClick={() => setCurrentView('profile')} className="rounded-full transition transform hover:scale-110">
                                    <img src={user.photoURL} className="rounded-full w-9 h-9" alt="User avatar" />
                                </button>
                                <button onClick={onSignOut} className="hidden sm:block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition transform hover:-translate-y-0.5">Logout</button>
                            </>
                        ) : (
                             <button id="google-signin-btn" onClick={onSignIn} className="transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.552,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                </svg>
                                <span>Sign in</span>
                            </button>
                        )}
                         {/* Hamburger Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none z-50 relative">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-screen Mobile Menu */}
            <div className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-95 backdrop-blur-sm transition-opacity duration-300 ease-in-out md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex flex-col items-center justify-center h-full space-y-8">
                    {user ? (
                         <>
                            <button onClick={() => handleLinkClick('dashboard')} className={`text-2xl font-semibold transition-colors ${currentView === 'dashboard' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}>Dashboard</button>
                            <button onClick={() => handleLinkClick('leaderboard')} className={`text-2xl font-semibold transition-colors ${currentView === 'leaderboard' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}>Leaderboard</button>
                            <button onClick={() => handleLinkClick('profile')} className={`text-2xl font-semibold transition-colors ${currentView === 'profile' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}>Profile</button>
                            <button onClick={onSignOut} className="absolute bottom-16 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md text-base font-medium transition transform hover:-translate-y-0.5">Logout</button>
                         </>
                    ) : (
                        <>
                             <button onClick={() => handleLinkClick('home')} className={`text-2xl font-semibold transition-colors ${currentView === 'home' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}>Home</button>
                             <button onClick={() => handleLinkClick('features')} className={`text-2xl font-semibold transition-colors ${currentView === 'features' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}>Features</button>
                             <button onClick={() => handleLinkClick('about')} className={`text-2xl font-semibold transition-colors ${currentView === 'about' ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'}`}>About</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};


const ACHIEVEMENTS_LIST = [
    { id: 'first_transaction', title: 'Getting Started', description: 'Add your very first transaction.', points: 10, icon: '🎉' },
    { id: 'ten_transactions', title: 'Budget Beginner', description: 'Add 10 transactions to your history.', points: 50, icon: '📈' },
    { id: 'fifty_transactions', title: 'Record Keeper', description: 'Add 50 transactions to your history.', points: 150, icon: '📚' },
    { id: 'first_scan', title: 'Scanner Pro', description: 'Scan your first document.', points: 75, icon: '📸' },
    { id: 'first_goal', title: 'Goal Setter', description: 'Set your first financial goal.', points: 100, icon: '🎯' },
    { id: 'goal_achieved', title: 'Goal Achiever', description: 'Successfully complete a financial goal.', points: 250, icon: '🏆' },
    { id: 'power_saver', title: 'Power Saver', description: 'Reach a net balance of over ₹10,000.', points: 200, icon: '💰' },
    { id: 'big_earner', title: 'Big Earner', description: 'Log a single income transaction over ₹20,000.', points: 150, icon: '💼' },
];

export default function App() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [goal, setGoal] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState('home');

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
        };
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) { document.body.removeChild(script); } };
    }, []);

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const awardAchievement = useCallback(async (achievementId) => {
        if (!user || userProfile?.achievements?.includes(achievementId)) return;
        const achievement = ACHIEVEMENTS_LIST.find(a => a.id === achievementId);
        if (!achievement) return;
        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
            points: (userProfile.points || 0) + achievement.points,
            achievements: arrayUnion(achievementId)
        });
        showToast(`Achievement Unlocked: ${achievement.title}! +${achievement.points} Points`);
    }, [user, userProfile]);

    const setDailyGoal = useCallback(async (goalAmount) => {
        if (!user) return;
        const profileRef = doc(db, 'profiles', user.uid);
        try {
            await updateDoc(profileRef, {
                dailySpendingGoal: goalAmount
            });
            showToast("Daily goal updated!");
        } catch (error) {
            console.error("Error setting daily goal:", error);
            showToast("Failed to update daily goal.");
        }
    }, [user]);
    
    const checkStreak = useCallback(async () => {
        if (!user || !userProfile || !transactions.length > 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const lastCheck = userProfile.lastStreakCheck ? new Date(userProfile.lastStreakCheck) : null;

        if (lastCheck && lastCheck.getTime() === today.getTime()) {
            return; // Already checked today
        }
        
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const expensesYesterday = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' &&
                       tDate.getFullYear() === yesterday.getFullYear() &&
                       tDate.getMonth() === yesterday.getMonth() &&
                       tDate.getDate() === yesterday.getDate();
            })
            .reduce((acc, t) => acc + t.amount, 0);
            
        let newStreak = userProfile.streakCount || 0;
        
        if (userProfile.dailySpendingGoal && expensesYesterday <= userProfile.dailySpendingGoal) {
            newStreak++;
            showToast(`Goal met! Streak: ${newStreak} 🔥`);
        } else {
            if (newStreak > 0) showToast(`Streak reset. Keep trying!`);
            newStreak = 0;
        }

        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
            streakCount: newStreak,
            lastStreakCheck: today.toISOString().split('T')[0]
        });

    }, [user, userProfile, transactions]);

    useEffect(() => {
        if(userProfile) checkStreak();
    }, [userProfile, checkStreak]);


    useEffect(() => {
        if (user && transactions.length > 0) {
            if (transactions.length >= 1) awardAchievement('first_transaction');
            if (transactions.length >= 10) awardAchievement('ten_transactions');
            if (transactions.length >= 50) awardAchievement('fifty_transactions');
            if (transactions.some(t => t.type === 'income' && t.amount >= 20000)) awardAchievement('big_earner');
        }
        if (user && goal) awardAchievement('first_goal');
        const balance = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        if (balance >= 10000) awardAchievement('power_saver');
    }, [user, transactions, goal, awardAchievement]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const profileRef = doc(db, 'profiles', currentUser.uid);
                const profileSnap = await getDoc(profileRef);
                if (!profileSnap.exists()) {
                    await setDoc(profileRef, { 
                        email: currentUser.email, 
                        name: currentUser.displayName, 
                        points: 0, 
                        achievements: [], 
                        photoURL: currentUser.photoURL, 
                        id: currentUser.uid,
                        streakCount: 0,
                        lastStreakCheck: null,
                        dailySpendingGoal: null
                    });
                }
                 setCurrentView('dashboard');
            } else {
                 setCurrentView('home');
            }
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        let unsubscribers = [];
        if (user) {
            const profileRef = doc(db, 'profiles', user.uid);
            unsubscribers.push(onSnapshot(profileRef, (doc) => setUserProfile(doc.data())));

            const transactionsCol = collection(db, 'transactions', user.uid, 'history');
            unsubscribers.push(onSnapshot(transactionsCol, (snapshot) => setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))));

            const goalDocRef = doc(db, 'goals', user.uid);
            unsubscribers.push(onSnapshot(goalDocRef, (doc) => setGoal(doc.exists() ? doc.data() : null)));

            const profilesQuery = query(collection(db, 'profiles'), orderBy('points', 'desc'), limit(10));
            unsubscribers.push(onSnapshot(profilesQuery, (snapshot) => setLeaderboardData(snapshot.docs.map(d => d.data()))));

        } else {
            setTransactions([]); setGoal(null); setUserProfile(null); setLeaderboardData([]);
        }
        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]);

    const handleSignIn = () => {
        signInWithPopup(auth, provider).catch(error => {
            console.error("Sign in error", error);
            showToast('Failed to sign in.');
        });
    };

    const handleSignOut = () => {
        signOut(auth).catch(error => {
            console.error("Sign out error", error);
            showToast('Failed to sign out.');
        });
        setIsLogoutModalOpen(false);
    };

    const promptLogout = () => {
        setIsLogoutModalOpen(true);
    };

    if (isLoading) {
        return <Preloader />;
    }
    
    const renderView = () => {
        switch(currentView) {
            case 'home': return <LandingView />;
            case 'features': return <FeaturesView />;
            case 'about': return <AboutView />;
            case 'dashboard': return <DashboardView user={user} transactions={transactions} goal={goal} onShowToast={showToast} onAwardAchievement={awardAchievement} />;
            case 'leaderboard': return <LeaderboardView leaderboardData={leaderboardData} currentUser={user} />;
            case 'profile': return <ProfileView user={user} userProfile={userProfile} onSetDailyGoal={setDailyGoal} onShowToast={showToast} transactions={transactions}/>;
            default: return <LandingView />;
        }
    }

    return (
        <>
            <style>{`
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; }
.gradient-bg { background-color: #111827; background-image: radial-gradient(at 47% 33%, hsl(200.00, 0%, 100%, 0.03) 0, transparent 59%), radial-gradient(at 82% 65%, hsl(215.00, 19%, 24%, 0.03) 0, transparent 55%); }
::-webkit-calendar-picker-indicator { filter: invert(1); }
.loader { border: 4px solid #f3f3f330; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.file-input-label { cursor: pointer; padding: 0.75rem 1rem; border-radius: 0.5rem; background-color: rgba(75, 85, 99, 0.5); transition: background-color 0.2s; }
.file-input-label:hover { background-color: rgba(107, 114, 128, 0.5); }
#google-signin-btn { background-color: #4285F4; color: white; border: none; padding: 8px 16px; font-size: 14px; border-radius: 8px; display: flex; align-items: center; cursor: pointer; transition: all 0.2s ease-in-out; }
#google-signin-btn:hover { background-color: #357ae8; }
#google-signin-btn svg { margin-right: 10px; background-color: white; border-radius: 50%; padding: 2px; }
#google-signin-btn span { margin-left: 0px; }
.feature-card { background-color: rgba(31, 41, 55, 0.5); border: 1px solid rgba(55, 65, 81, 0.7); padding: 2rem; border-radius: 1rem; transition: all 0.3s ease; }
.feature-card:hover { transform: translateY(-5px); border-color: rgba(34, 197, 94, 0.5); }
.prose { --tw-prose-body: #d1d5db; --tw-prose-headings: #f9fafb; }
button, .cursor-pointer, a { cursor: pointer; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-transition {
  animation: fadeIn 0.4s ease-in-out;
}
`}</style>
            <div className="gradient-bg text-gray-200 min-h-screen">
                <AppNavbar user={user} onSignOut={promptLogout} onSignIn={handleSignIn} currentView={currentView} setCurrentView={setCurrentView} />
                <div key={currentView} className="page-transition">
                    {renderView()}
                </div>
                <Toast message={toast.message} show={toast.show} />
                <ConfirmationModal
                    isOpen={isLogoutModalOpen}
                    onClose={() => setIsLogoutModalOpen(false)}
                    onConfirm={handleSignOut}
                    title="Confirm Logout"
                >
                    <p>Are you sure you want to log out?</p>
                </ConfirmationModal>
            </div>
        </>
    );
}

