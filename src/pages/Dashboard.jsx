import { useState, useMemo, useCallback, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { marked } from 'marked';
import { db } from '../firebase'; // Assuming you have a firebase config file
import TrendChart from '../components/TrendChart';
import ForeScoreView from '../components/ForeScoreView';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';


const Dashboard = ({ user, transactions, goal, onShowToast, onAwardAchievement }) => {

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

        if (transactions.length === 0) {
            setInsights(`<p class="text-gray-400">Add a transaction for analysis.</p>`);
            return;
        }
        setIsFetchingInsights(true);
        const prompt = `You are ForeFunds, a friendly financial assistant for a user in India. Analyze these JSON transactions for the current month. Today's Date: ${new Date().toLocaleDateString()}. Current Net Balance: ${formatCurrency(balance)}. 

 ${JSON.stringify(transactions)} 

 Provide a concise, easy-to-read summary of the analysis in well-structured Markdown. The summary should include:

### Spending Summary
- A brief overview of the top 2-3 spending categories.

### Savings Suggestions
- 2-3 actionable savings tips based on their specific spending.

### Future Forecast
- A narrative forecast for their end-of-month spending.`;

        try {
            const response = await fetch('/.netlify/functions/get-insights', {
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
                { text: `Analyze the UPI screenshot. Extract all transactions into a valid JSON array. Each object needs keys: \"amount\" (number), \"description\" (string), \"date\" (string, \"YYYY-MM-DD\"), \"type\" (string, \"expense\" or \"income\"), and \"category\" (infer from ${categories}). Today is ${new Date().toISOString().slice(0, 10)}. Example: [{\"amount\": 150.75, \"description\": \"Zomato\", \"date\": \"2025-09-24\", \"type\": \"expense\", \"category\": \"Food\"}]` },
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
                parts = [{
                    text: `Analyze this bank statement text. Extract all transactions into a valid JSON array. Each object needs keys: \"amount\" (number, always positive), \"description\" (string), \"date\" (string, \"YYYY-MM-DD\"), \"type\" (string, \"income\" for credits, \"expense\" for debits), and \"category\" (infer from ${categories}). Current year is ${new Date().getFullYear()}. Ignore summaries. Text: 

 ${pdfText}`
                }];
            } catch (error) { onShowToast("Error reading PDF file."); setIsAnalyzing(false); return; }
        }
        try {
            const response = await fetch('/.netlify/functions/analyze-document', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts }] })
            });
            if (!response.ok) throw new Error('API request failed');
            const result = await response.json();
            // const textResponse = result.candidates[0].content.parts[0].text;
            // const jsonMatch = textResponse.match(/.*\[.*\].*/s);
            // if (!jsonMatch) throw new Error("Could not find JSON array in the AI's response.");
            // const data = JSON.parse(jsonMatch[0]);
            // addNewTransactions(data);
            const textResponse = result.candidates[0].content.parts[0].text;

            // Remove code fences if present (``````)
            let jsonText = textResponse.replace(/``````/g, '').trim();

            // Find first [ and last ] to get the JSON array
            const start = jsonText.indexOf('[');
            const end = jsonText.lastIndexOf(']');
            if (start === -1 || end === -1 || end <= start) throw new Error("Could not locate JSON array in AI response.");

            const jsonArrStr = jsonText.substring(start, end + 1);
            const data = JSON.parse(jsonArrStr);

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-10 mt-8">
                    <h1 className="text-4xl md:text-5xl font-bold">Welcome, {user.displayName.split(' ')[0]}!</h1>
                    <p className="text-gray-400 mt-2">Here's your financial overview for the month.</p>
                </header>

                <ForeScoreView transactions={transactions} goal={goal} />

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
        </motion.div>
    );
};

export default Dashboard;
