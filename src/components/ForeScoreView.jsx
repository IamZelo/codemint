import { useMemo } from 'react';

const ForeScoreView = ({ transactions, goal }) => {
    const foreScore = useMemo(() => {
        const { income, expenses } = transactions.reduce((acc, tx) => {
            if (!tx.date) return acc;
            const txDate = new Date(tx.date);
            const today = new Date();
            if (txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear()) {
                if (tx.type === 'income') acc.income += tx.amount;
                else if (tx.type === 'expense') acc.expenses += tx.amount;
            }
            return acc;
        }, { income: 0, expenses: 0 });

        let score = 0;

        if (income > 0) {
            const savingsRatio = (income - expenses) / income;
            score += Math.max(0, savingsRatio) * 50;
        }

        if (goal && goal.amount > 0) {
            const balance = income - expenses;
            const goalProgress = Math.max(0, balance) / goal.amount;
            score += Math.min(1, goalProgress) * 30;
        } else {
            score += 10;
        }

        const monthlyTransactions = transactions.filter(tx => {
            if (!tx.date) return false;
            const txDate = new Date(tx.date);
            const today = new Date();
            return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        }).length;
        score += Math.min(20, monthlyTransactions);

        return Math.round(Math.max(0, Math.min(100, score)));
    }, [transactions, goal]);

    const worldImages = [
        "src\\assets\\world_0.png", // Score 0-20 (Desert)
        'src\\assets\\world_1.png', // Score 21-40 (Sparse Desert)
        'src\\assets\\world_2.png', // Score 41-60 (Sparse Forest)
        'src\\assets\\world_3.png', // Score 61-80 (Medium Forest)
        'src\\assets\\world_4.png'  // Score 81-100 (Dense Forest)
    ];

    const worldImage = useMemo(() => {
        if (foreScore <= 20) return worldImages[0];
        if (foreScore <= 40) return worldImages[1];
        if (foreScore <= 60) return worldImages[2];
        if (foreScore <= 80) return worldImages[3];
        return worldImages[4];
    }, [foreScore]);

    const getForeScoreMessage = useMemo(() =>  {
        if (foreScore < 20) return "Your world is a desert 🌵. Start saving and track your goals to bring it to life!";
        if (foreScore < 40) return "Some sprouts are appearing 🌱. Keep saving and spending wisely to grow more green.";
        if (foreScore < 60) return "Your world is thriving 🌿. Stay consistent to reach a lush forest!";
        if (foreScore < 80) return "Your world is healthy 🌳. You're on track — keep building your savings and goals.";
        return "Your world is lush and vibrant 🌴🎉. You're mastering your financial health!";
        }, [foreScore]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 md:p-10 rounded-2xl shadow-lg border border-gray-700/50 mb-8">
    <h2 className="text-2xl md:text-4xl font-semibold text-center md:text-left">Your Monthly ForeScore™</h2>

    {/* Main Grid Container */}
    {/* On mobile: 1 column. On desktop (md+): 5 columns. */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">

        {/* --- Left Column: Score & Text */}
        <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="text-7xl font-bold" style={{ color: `hsl(${foreScore}, 80%, 50%)` }}>{foreScore}</div>
            <div className="max-w-sm mt-2">
                <p className="text-gray-300" style={{ color: `hsl(${foreScore}, 50%, 50%)` }}>{getForeScoreMessage}</p>
                <p className="text-sm text-gray-500 mt-4">“ForeScore shows your financial health in real time — save more, hit goals, spend wisely, and watch your world grow from desert to forest.”</p>
            </div>
        </div>

        {/* --- Right Column: Sandbox Image */}
        <div className="md:col-span-3 lg:w-100  max-w-md mx-auto md:max-w-none">
            <img 
                src={worldImage} 
                alt={`ForeScore World - Score ${foreScore}`}
                className="object-contain w-full h-full"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/400x400/111827/9ca3af?text=Score:+${foreScore}`;
                }}
            />
        </div>
        </div>
    </div>

    );
};

export default ForeScoreView;
