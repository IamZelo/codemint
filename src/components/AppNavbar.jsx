import { useState } from 'react';
import { Link } from 'react-router-dom';

const AppNavbar = ({ user, onSignOut, onSignIn }) => {

    const getFallbackAvatar = (name) => {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff`;
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    const NavButton = ({ to, children }) => (
        <Link
            to={to}
            className={`font-semibold transition transform hover:-translate-y-0.5 text-gray-300 hover:text-blue-400'}`}
        >
            {children}
        </Link>
    );

    return (
        <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to={user ? '/dashboard' : '/'} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">ForeFunds</Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {user ? (
                            <>
                                <NavButton to="/dashboard">Dashboard</NavButton>
                                <NavButton to="/leaderboard">Leaderboard</NavButton>
                                <NavButton to="/features">Features</NavButton>
                                <NavButton to="/about">About</NavButton>
                            </>
                        ) : (
                            <>
                                <NavButton to="/">Home</NavButton>
                                <NavButton to="/features">Features</NavButton>
                                <NavButton to="/about">About</NavButton>
                            </>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to='/profile' className="rounded-full transition transform hover:scale-110">
                                    <img src={user.photoURL} className="rounded-full w-9 h-9" alt="User avatar" />
                                </Link>
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
                            <Link to="/dashboard" onClick={handleLinkClick} className={`text-2xl font-semibold transition-colors text-gray-300 hover:text-blue-400'}`}>Dashboard</Link>
                            <Link to="/leaderboard" onClick={handleLinkClick} className={`text-2xl font-semibold transition-colors text-gray-300 hover:text-blue-400'}`}>Leaderboard</Link>
                            <Link to="/profile" onClick={handleLinkClick} className={`text-2xl font-semibold transition-colors text-gray-300 hover:text-blue-400'}`}>Profile</Link>
                            <button onClick={onSignOut} className="absolute bottom-16 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md text-base font-medium transition transform hover:-translate-y-0.5">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/" onClick={handleLinkClick} className={`text-2xl font-semibold transition-colors text-gray-300 hover:text-blue-400'}`}>Home</Link>
                            <Link to="/features" onClick={handleLinkClick} className={`text-2xl font-semibold transition-colors text-gray-300 hover:text-blue-400'}`}>Features</Link>
                            <Link to="/about" onClick={handleLinkClick} className={`text-2xl font-semibold transition-colors text-gray-300 hover:text-blue-400'}`}>About</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default AppNavbar;
