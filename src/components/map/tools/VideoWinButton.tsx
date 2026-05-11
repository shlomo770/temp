import { useRef } from 'react';

const VideoWinButton = ({ onOpen }: any) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    return (
        <>
            <button
                ref={buttonRef}
                onClick={onOpen}
                className="absolute top-14 left-[160px] z-30 bg-[#1f2937d6] mt-4 p-4 rounded-full">
                <img src="./icons/VideoStreaming_512.png" alt="" className='w-10' />
            </button>
        </>
    );
};

export default VideoWinButton; 