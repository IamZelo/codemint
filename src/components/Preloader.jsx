import Loader from './Loader';

const Preloader = () => (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <h1 className="text-4xl font-bold tracking-wider text-emerald-400 mb-4">ForeFunds</h1>
        <Loader />
    </div>
);

export default Preloader;