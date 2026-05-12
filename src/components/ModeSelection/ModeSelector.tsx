import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedMode } from '../../store/slices/systemSlice';
import { SelectedModeE } from '../../enums/general.enum';

const ModeSelector: FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const enterFullscreen = async () => {
        const el = document.documentElement as HTMLElement & {
            webkitRequestFullscreen?: () => Promise<void> | void;
            msRequestFullscreen?: () => Promise<void> | void;
        };

        if (document.fullscreenElement) return;

        if (el.requestFullscreen) {
            await el.requestFullscreen();
            return;
        }

        if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
            return;
        }

        if (el.msRequestFullscreen) {
            await el.msRequestFullscreen();
        }
    };

    const handleModeSelect = async (mode: SelectedModeE, path: '/map' | '/maintenance') => {
        try {
            await enterFullscreen();
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
        }

        setTimeout(() => {
            dispatch(setSelectedMode(mode));
            navigate(path);
        }, 400);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
            <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(148, 163, 184, 0.35), transparent), radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.12), transparent 45%)',
                }}
            />

            <div className="relative z-10 w-full max-w-3xl px-4 text-center">
                <div className="relative mb-10">
                    <img
                        src="/icons/jeepM.png"
                        alt="Vehicle"
                        className="mx-auto h-auto w-[min(92vw,400px)] select-none pointer-events-none drop-shadow-xl"
                        draggable={false}
                    />

                    <h1
                        className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-7xl font-semibold tracking-[0.2em] text-slate-700/95 drop-shadow-sm sm:text-8xl"
                    >
                        JBK
                    </h1>
                </div>

                <p className="mb-8 text-sm text-slate-600">בחרו מצב הפעלה</p>

                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => handleModeSelect(SelectedModeE.Mission, '/map')}
                        className="min-w-[140px] rounded-xl border border-slate-400/40 bg-white/80 px-8 py-3.5 font-medium text-slate-800 shadow-md backdrop-blur transition hover:border-sky-400/60 hover:bg-white hover:shadow-lg"
                    >
                        מבצעי
                    </button>

                    <button
                        type="button"
                        onClick={() => handleModeSelect(SelectedModeE.Maintenance, '/maintenance')}
                        className="min-w-[140px] rounded-xl border border-slate-400/40 bg-white/80 px-8 py-3.5 font-medium text-slate-800 shadow-md backdrop-blur transition hover:border-cyan-500/50 hover:bg-white hover:shadow-lg"
                    >
                        תחזוקה
                    </button>

                    <button
                        type="button"
                        onClick={() => handleModeSelect(SelectedModeE.Training, '/map')}
                        className="min-w-[140px] rounded-xl border border-slate-400/40 bg-white/80 px-8 py-3.5 font-medium text-slate-800 shadow-md backdrop-blur transition hover:border-indigo-400/50 hover:bg-white hover:shadow-lg"
                    >
                        אימון
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModeSelector;
