
import { useEffect, useRef, useState } from "react";
import JSMpeg from "@cycjimmy/jsmpeg-player";

interface VideoDockProps {
    wsUrl?: string;
    isOpen: boolean;
}

const VideoPlayer = ({
    wsUrl = "ws://localhost:9001",
    isOpen,
}: VideoDockProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const playerRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!isOpen) {
            
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
            setLoading(true);
            return;
        }
        if (!canvasRef.current) return;
        const player = new JSMpeg.Player(wsUrl, {
            canvas: canvasRef.current,
            autoplay: true,
            audio: false,
            loop: true,
            onVideoDecode: () => setLoading(false),
        });
        playerRef.current = player;
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [isOpen, wsUrl]);
    if (!isOpen) return null;
    return (
        <div className="fixed bottom-4 left-4 z-50 bg-[#1f2937d6] backdrop-blur-sm rounded-xl shadow-lg p-2 pointer-events-auto">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1f2937d6] backdrop-blur-sm">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <div className="w-[60vw] h-[30vh] max-w-xs min-w-[220px] aspect-video">
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={360}
                    className="w-full h-full object-cover rounded-lg bg-[#1f2937d6]" />
            </div>
        </div>
    );
}
export default VideoPlayer;
