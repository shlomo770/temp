import React, { memo } from "react";
import { COLORS } from "../../../constants/colors";
import { GunStatusE } from "../../../enums/statusBar.enum";

interface RenderGunIconProps {
    status: GunStatusE;
}

const RenderGunIcon: React.FC<RenderGunIconProps> = ({
    status = GunStatusE.NO_COMM
}) => {
    let color = "#ffffff";
    if (status === GunStatusE.READY) color = COLORS.white;
    else if (status === GunStatusE.WARNING) color = COLORS.yellow;
    else if (status === GunStatusE.FAIL) color = COLORS.red;
    else if (status === GunStatusE.TRACK) color = COLORS.green;
    else if (status === GunStatusE.ARM) color = COLORS.white;
    else if (status === GunStatusE.NO_COMM) color = COLORS.gray;

    return (
        <div className="relative mt-2">
            <svg
                xmlns="http://www.w3.org/2000/svg"

                viewBox="0 0 61.2756 110.618"
                fill={color}
                stroke={color}
                strokeWidth="2"
                className="w-8 h-8">
                <g>
                    <g id="shape4-1" transform="translate(3,-3)">
                        <path
                            d="M22.68 84.88 A28.7248 25.3119 -90 0 0 -0 110.62 L55.28 110.62 A30.1359 23.236 -91.93 0 0 34.02 84.88 L34.02 8.35 A8.01759 8.01759 -180 0 0 22.68 8.35 L22.68 84.88 Z"
                            className="st1" />
                    </g>
                    <g id="shape5-3" transform="translate(45.5197,-39.9036)">
                        <path
                            d="M11.34 106.2 L11.34 75.02 A6.07193 6.07193 -180 0 0 0 75.02 L0 106.2 A5.84531 5.84531 -180 0 0 11.34 106.2 Z"
                            className="st1" />
                    </g>
                    <g id="shape6-5" transform="translate(5.83464,-39.9036)">
                        <path
                            d="M11.34 106.2 L11.34 75.02 A6.07193 6.07193 -180 0 0 0 75.02 L0 106.2 A5.84531 5.84531 -180 0 0 11.34 106.2 Z"
                            className="st1" />
                    </g>
                </g>
            </svg>

            {status === GunStatusE.ARM && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-xs font-bold text-red-600 mt-[-8px]">
                        ARM
                    </span>
                </div>
            )}

            {status === GunStatusE.NO_COMM && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="./icons/swap_no_link_arrows_512.png" className="w-8 mt-[-8px]" alt="" />
                </div>
            )}
        </div>
    );
};

export default memo(RenderGunIcon);