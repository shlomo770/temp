import { useState, useRef } from 'react';
import { FaPlus } from 'react-icons/fa';
import EntityCreationMenu from './EntityCreationMenu';

const EntityCreationButton = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleClick}
                className="absolute top-20 left-20 z-30 bg-[#515150] backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-black/80 transition-all duration-200 hover:scale-110 shadow-lg border border-gray-600">
                <FaPlus size={25} className="text-white" />
            </button>
            <EntityCreationMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                anchorRef={buttonRef}
            />
        </>
    );
};

export default EntityCreationButton; 