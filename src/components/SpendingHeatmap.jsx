import { useMemo, useState } from 'react';

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
                if (t.type === 'income') {
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

export default SpendingHeatmap;