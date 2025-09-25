const Loader = ({ size = 'w-8 h-8' }) => (
    <div className={`loader border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin ${size}`}></div>
);

export default Loader;