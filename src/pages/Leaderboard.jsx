import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Leaderboard = ({ leaderboardData, currentUser }) => {
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

export default Leaderboard;