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

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50 mb-8">
            <h2 className="text-3xl pl-8 font-semibold mt-2 mb-2">Your Monthly ForeScore™</h2>
            <div className="flex items-center pl-16 justify-center space-x-22 mb-4">
                <div className='flex space-x-8'>

                    <div className="text-5xl font-bold" style={{ color: `hsl(${foreScore}, 80%, 60%)` }}>{foreScore}</div>
                    <div>
                        <p className="text-gray-300">A real-time score of your financial health this month.</p>
                        <p className="text-sm text-gray-400">Based on savings, goal progress, and activity.</p>
                    </div>
                </div>
                <div className="w-2/5 mx-auto aspect-square flex justify-center items-center overflow-hidden rounded-lg ">
                    <img
                        src={worldImage}
                        alt={`ForeScore World - Score ${foreScore}`}
                        className="object-cover animate-fade-in w-full h-auto"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/111827/9ca3af?text=Score:+${foreScore}`; }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ForeScoreView;
