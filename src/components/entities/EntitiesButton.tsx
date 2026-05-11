import { FC } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setSelectedEntity } from '../../store/slices/entitiesSlice';

interface EntitiesButtonProps {
    onToggleSidebar: () => void;
}

const EntitiesButton: FC<EntitiesButtonProps> = ({ onToggleSidebar }) => {
    const dispatch = useAppDispatch();
    const handleClick = () => {
        dispatch(setSelectedEntity(null));
        onToggleSidebar();
    };

    return (
        <button
            onClick={handleClick}
            className="absolute top-14 z-30 p-4 bg-[#1f2937d6] mt-4 ml-1 rounded-full">
            <img src="./icons/folder_closed_512.png" alt="folder" className='w-10' />
        </button>
    );
};

export default EntitiesButton; 