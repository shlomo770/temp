import React, { memo } from "react";

const RenderRecIcon: React.FC = () => {
    let color = "#ffffff";
    return (
        <div className="relative mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12">
                <text x="50%" y="55%" textAnchor="middle" fill={color} fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold">IFF</text>
            </svg>
        </div>
    );
};

export default memo(RenderRecIcon);