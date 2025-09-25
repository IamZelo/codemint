import SpendingHeatmap from '../components/SpendingHeatmap';

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;

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

const Profile = ({ user, userProfile, onSetDailyGoal, onShowToast, transactions }) => {

    const handleGoalSubmit = (e) => {
        e.preventDefault();
        const goalAmount = parseFloat(e.target.elements.dailyGoal.value);
        if (isNaN(goalAmount) || goalAmount <= 0) {
            onShowToast("Please enter a valid goal amount.");
            return;
        }
        onSetDailyGoal(goalAmount);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-10 mt-8">
                <img src={user.photoURL} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-emerald-400" alt="User Profile" />
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

export default Profile;