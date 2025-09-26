import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default TrendChart;