import React, { memo } from "react";
import { COLORS } from "../../../constants/colors";
import { InsStatusE } from "../../../enums/statusBar.enum";

interface RenderInsIconProps {
    status: InsStatusE;
}

const RenderInsIcon: React.FC<RenderInsIconProps> = ({
    status = InsStatusE.NO_COMM
}) => {
    let color = "#ffffff";
    if (status === InsStatusE.OK) color = COLORS.white;
    else if (status === InsStatusE.ALIGN) color = COLORS.yellow;
    else if (status === InsStatusE.FAIL) color = COLORS.red;
    else if (status === InsStatusE.NO_COMM) color = COLORS.gray;
    return (
        <div className="relative mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 512 512" className="w-8 h-8">
                <path fill={color} d="M503.172 229.516H457.27C445.207 138.449 373.55 66.793 282.484 54.73V8.828A8.857 8.857 0 0 0 273.656 0h-35.312a8.857 8.857 0 0 0-8.828 8.828V54.73C138.449 66.793 66.793 138.45 54.73 229.516H8.828A8.857 8.857 0 0 0 0 238.344v35.312a8.857 8.857 0 0 0 8.828 8.828H54.73c12.063 91.067 83.72 162.723 174.786 174.786v45.902a8.857 8.857 0 0 0 8.828 8.828h35.312a8.857 8.857 0 0 0 8.828-8.828V457.27c91.067-12.063 162.723-83.72 174.786-174.786h45.902a8.857 8.857 0 0 0 8.828-8.828v-35.312a8.857 8.857 0 0 0-8.828-8.828zM256 406.07c-82.879 0-150.07-67.191-150.07-150.07S173.12 105.93 256 105.93 406.07 173.12 406.07 256c-.125 82.828-67.242 149.945-150.07 150.07zm0 0" />
                <path fill={color} d="M326.621 256c0 39.004-31.617 70.621-70.621 70.621S185.379 295.004 185.379 256s31.617-70.621 70.621-70.621 70.621 31.617 70.621 70.621zm0 0" />
                <g fill={color}>
                    <path fill={color} d="M512 238.344v35.312a8.857 8.857 0 0 1-8.828 8.828H457.27c-12.063 91.067-83.72 162.723-174.786 174.786v45.902a8.857 8.857 0 0 1-8.828 8.828H256V406.07c82.879 0 150.07-67.191 150.07-150.07S338.88 105.93 256 105.93V0h17.656a8.857 8.857 0 0 1 8.828 8.828V54.73c91.067 12.063 162.723 83.72 174.786 174.786h45.902a8.857 8.857 0 0 1 8.828 8.828zm0 0" />
                    <path fill={color} d="M326.621 256A70.605 70.605 0 0 1 256 326.621V185.38A70.605 70.605 0 0 1 326.621 256zm0 0" />
                </g>
            </svg>
            {status === InsStatusE.NO_COMM && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="./icons/swap_no_link_arrows_512.png" className="w-8 mt-[-8px]" alt="" />
                </div>
            )}
            {status === InsStatusE.IGNORE_GPS && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="./icons/destroyed.png" className="w-8 mt-[-8px]" alt="" />
                </div>
            )}
        </div>
    );
};

export default memo(RenderInsIcon);