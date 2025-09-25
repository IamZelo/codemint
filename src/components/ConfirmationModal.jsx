const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose}></div>
        <div className={`bg-gray-800 rounded-lg p-8 shadow-xl max-w-sm w-full mx-4 z-10 transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className="text-gray-300 mb-6">
                {children}
            </div>
            <div className="flex justify-end space-x-4">
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition transform hover:-translate-y-px"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition transform hover:-translate-y-px"
                >
                    Logout
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;