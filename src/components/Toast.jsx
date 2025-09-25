const Toast = ({ message, show }) => (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-teal-400 text-gray-900 font-semibold shadow-lg transition-all duration-300 ${show ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {message}
    </div>
);

export default Toast;