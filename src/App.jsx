import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { collection, doc, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion, query, orderBy, limit } from "firebase/firestore";
import { auth, db, provider } from './firebase';

import AppNavbar from './components/AppNavbar';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import Preloader from './components/Preloader';

import Home from './pages/Home';
import Features from './pages/Features';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Calculate from './pages/Calculate';


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

        const lastCheckString = userProfile.lastStreakCheck; // This is 'YYYY-MM-DD'
        const todayString = today.toISOString().split('T')[0]; // This is also 'YYYY-MM-DD'

        if (lastCheckString === todayString) {
            return; // Already checked today. This works! ✅
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
        if (userProfile) checkStreak();
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

    const navigate = useNavigate();


    const handleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            showToast("Signed in successfully!");
            setTimeout(() => {
                navigate('/dashboard');
            }, 400);
        } catch (error) {
            console.error("Sign in error", error);
            showToast('Failed to sign in.');
        }
    };

    const handleSignOut = async () => {
        try {
            const result = await signOut(auth);
            showToast("Signed out successfully!");
            setIsLogoutModalOpen(false);
            navigate('/'); // Navigate after logout
        } catch (error) {
            console.error("Sign out error", error);
            showToast('Failed to sign out.');
        }
    };


    const promptLogout = () => {
        setIsLogoutModalOpen(true);
    };

    if (isLoading) {
        return <Preloader />;
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
                <AppNavbar user={user} onSignOut={promptLogout} onSignIn={handleSignIn} />
                <div className="page-transition">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/features" element={<Features />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/calculator" element={<Calculate />} />
                        <Route path="/dashboard" element={user ? <Dashboard user={user} transactions={transactions} goal={goal} onShowToast={showToast} onAwardAchievement={awardAchievement} /> : <Navigate to="/" />} />
                        <Route path="/leaderboard" element={user ? <Leaderboard leaderboardData={leaderboardData} currentUser={user} /> : <Navigate to="/" />} />
                        <Route path="/profile" element={user ? <Profile user={user} userProfile={userProfile} onSetDailyGoal={setDailyGoal} onShowToast={showToast} transactions={transactions} /> : <Navigate to="/" />} />
                    </Routes>
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