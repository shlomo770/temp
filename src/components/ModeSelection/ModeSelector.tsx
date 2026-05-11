import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedMode } from '../../store/slices/systemSlice';
import { SelectedModeE } from '../../enums/general.enum';

const ModeSelector: FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const handleModeSelect = (mode: SelectedModeE) => {
        dispatch(setSelectedMode(mode));
        navigate('/map');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
            <div className="absolute top-4 right-6 text-sm text-gray-500 space-y-1 text-right">
                <div>Maps load</div>
                <div>Maintenance</div>
            </div>
            <div className="text-center w-full max-w-3xl px-4">
                <div className="relative mb-10">
                    <img
                        src="/icons/jeepM.png"
                        alt="Vehicle"
                        className="w-[400px] h-auto mx-auto" />
                    <h1 className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 text-8xl text-white/90 font-semibold tracking-widest drop-shadow-lg" style={{ color: '#37465b' }}>
                        JBK
                    </h1>
                </div>
                <div className="flex justify-center gap-6">
                    {['מבצעי', 'תחזוקה', 'אימון'].map((label) => (
                        <button
                            key={label}
                            onClick={() => handleModeSelect(label as any)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-8 rounded-md transition shadow">
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModeSelector;