import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { MdMotionPhotosAuto } from "react-icons/md";
import { RiHand } from "react-icons/ri";
import { COLORS } from "../../../constants/colors";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useWsConnection } from "../../../hooks/useWsConnection";
import { setElevation } from "../../../store/slices/elevationSlice";
import {
  setActiveMissionName,
  setPreviewEntityId,
  requestMissionListUiReset,
} from "../../../store/slices/entitiesSlice";
import { formatCoordinates } from "../../../utils/coordinates";
import { servers } from '../../../config/communication.json'
import { useWebSocket } from '../../../hooks/useWebSocket';
import { WsMessageName } from "../../../enums/ws.enum";
import { SystemModeE, GunStatusE, InsStatusE, RadarStatusE } from "../../../enums/statusBar.enum";
import { MyPosition } from "../../../types";
import { SelectedModeE } from "../../../enums/general.enum";
import RenderRadarIcon from "./RenderRadarIcon";
import RenderGunIcon from "./RenderGunIcon";
import RenderAntenaIcon from "./RenderAntenaIcon";
import RenderIffIcon from "./RenderIffIcon";
import RenderInsIcon from "./RenderInsIcon";
import FlyoutMenu from "../../ui/FlyoutMenu";
import RenderDroneIcon from "./RenderDroneIcon";

function selectedModeLabelHe(m: SelectedModeE | null): string {
  if (m == null) return "—";
  if (m === SelectedModeE.Mission) return "מבצעי";
  if (m === SelectedModeE.Training) return "אימון";
  if (m === SelectedModeE.Planning) return "תכנון";
  if (m === SelectedModeE.Maintenance) return "תחזוקה";
  return String(m);
}

interface StatusBarProps {
    mapServiceRef?: React.MutableRefObject<any>;
    systemMode?: SystemModeE;
    insStatus?: InsStatusE;
    radarStatus?: RadarStatusE;
    clickedCoords?: { lat: number; lng: number } | null;
    myPosition?: MyPosition | null;
    onCenterToPosition?: (coordinates: { lat: number; lng: number }) => void;
    onHamburgerClick: () => void;
    onTargetsClick?: () => void;
    openSider: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
    clickedCoords = null,
    myPosition = null,
    onCenterToPosition,
    mapServiceRef,
    onHamburgerClick,
    openSider
}) => {
    const { sendMessage } = useWebSocket();
    const dispatch = useAppDispatch();
    const isWebSocketConnected = useWsConnection();
    const elevation = useAppSelector((s) => s.elevation.elevation);
    const isUTM = useAppSelector((s) => s.coordinates.isUTM);
    const utmZone = useAppSelector((s) => s.coordinates.utmZone);
    const radarStatus = useAppSelector((s) => s.radar.status as RadarStatusE);
    const gunStatus = useAppSelector((s) => s.gun.status as GunStatusE);
    const insStatus = useAppSelector((s) => s.ins?.status as InsStatusE);
    const systemMode = useAppSelector((s) => s.systemState.systemMode as SystemModeE);
    const selectedMode = useAppSelector((s) => s.systemState.selectedMode);
    const missionList = useAppSelector((s) => s.entities.missionsList);
    const activeMissionName = useAppSelector((s) => s.entities.activeMissionName);
    const gpsButtonRef = useRef<HTMLDivElement>(null);
    const modeButtonRef = useRef<HTMLDivElement>(null);
    const gunButtonRef = useRef<HTMLDivElement>(null);
    const radarButtonRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<SystemModeE>(systemMode);
    const [modeFlyoutOpen, setModeFlyoutOpen] = useState(false);
    const [gunFlyoutOpen, setGunFlyoutOpen] = useState(false);
    const [radarFlyoutOpen, setRadarFlyoutOpen] = useState(false);

    const trim4 = (v: any) => {
        const p = v.split(".");
        if (p.length === 1) return v;
        return p[0] + "." + p[1].slice(0, 7);
    };

    useEffect(() => {
        if (clickedCoords && clickedCoords.lat != null && clickedCoords.lng != null) {
            const fetchElevation = async () => {
                const url = `http://${servers.mapServer}/elevation?lon=${clickedCoords?.lng}&lat=${clickedCoords?.lat}`;
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        dispatch(setElevation(data));
                    } else {
                        dispatch(setElevation(null));
                    }
                } catch {
                    dispatch(setElevation(null));
                }
            };
            const timeoutId = setTimeout(fetchElevation, 300);
            return () => clearTimeout(timeoutId);
        } else {
            dispatch(setElevation(null));
        }
    }, [clickedCoords, dispatch]);

    // useEffect(() => {
    //     if (ignoreGps && clickedCoords) {
    //         setLat(trim4(clickedCoords.lat.toString()));
    //         setLng(trim4(clickedCoords.lng.toString()));
    //     }
    // }, [clickedCoords, ignoreGps]);


    const date = useMemo(() => new Date(), []);
    const formattedDate = useMemo(() => date.toLocaleDateString("he-IL"), [date]);
    const formattedTime = useMemo(() => date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }), [date]);
    const handleCenterClick = useCallback(() => {
        if (myPosition?.coordinates && onCenterToPosition) {
            onCenterToPosition(myPosition.coordinates);
        }
    }, [myPosition?.coordinates, onCenterToPosition]);
    const loadMissionFromServer = useCallback(
        (name: string) => {
            sendMessage(WsMessageName.LoadMission, { mission_name: name });
        },
        [sendMessage]
    );

    const hamburgerClick = () => {
        onHamburgerClick();
        openSider();
    };

    const getServerIcon = useCallback(() => {
        const color = isWebSocketConnected
            ? COLORS.white
            : COLORS.red;
        return (
            <div className="relative mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-9 h-9">
                    <path fill={color} d="M23.25 12.75v-1.5h-10.5V9h2.625a1.126 1.126 0 0 0 1.125-1.125v-6a1.126 1.126 0 0 0-1.125-1.125h-6.75a1.126 1.126 0 0 0-1.125 1.125v6a1.126 1.126 0 0 0 1.125 1.125h2.625v2.25H.75v1.5H4.5V15H1.94a1.126 1.126 0 0 0-1.125 1.125v6a1.126 1.126 0 0 0 1.125 1.125h6.685a1.126 1.126 0 0 0 1.125-1.125v-6a1.126 1.126 0 0 0-1.125-1.125H6v-2.25h12V15h-2.625a1.126 1.126 0 0 0-1.125 1.125v6a1.126 1.126 0 0 0 1.125 1.125h6.75a1.126 1.126 0 0 0 1.125-1.125v-6a1.126 1.126 0 0 0-1.125-1.125H19.5v-2.25zM9 2.25h6V7.5H9zm-.75 19.5H2.315V16.5H8.25zm13.5 0h-6V16.5h6z" />
                </svg>
            </div>
        );
    }, [isWebSocketConnected]);

    
    const getModeIcon = useCallback(() => {
        const iconSize = 30;
        if (mode === SystemModeE.MANUAL) {
            return <RiHand size={iconSize} className="text-white" />;
        } else if (mode === SystemModeE.AUTO) {
            return <MdMotionPhotosAuto size={35} className="text-white" />;
        } else if (mode === SystemModeE.SEMI_AUTO) {
            return <div className="relative mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12">
                    <text x="50%" y="55%" textAnchor="middle" fill="#FFF" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold">1/2</text>
                </svg>
            </div>
        } else { return <RiHand size={iconSize} className="text-white" /> }
    }, [mode]);

    return (
        <>
            <div className="bg-[#1f2937d6] h-[60px] shadow-md flex items-center justify-between px-8 relative text-[13px] text-white z-[99999]">
                <div className="flex items-center gap-2 min-w-[5rem]">
                    <FaBars size={30} className="hover:scale-110 transition-transform ml-[-10px] cursor-pointer" onClick={hamburgerClick} />
                </div>

                <div className="flex items-center gap-2 min-w-[20rem]">
                    <div className="flex items-center gap-3 px-1 py-1 cursor-pointer transition-colors border min-w-[250px]" onClick={handleCenterClick}>
                        <img src="./icons/pointing_center_512.png" alt="" className="w-8" />
                        <div className="w-px h-6 bg-white" />
                        <span className="font-mono whitespace-nowrap text-base">
                            {clickedCoords ? formatCoordinates(clickedCoords, isUTM, utmZone) : myPosition?.coordinates ? formatCoordinates(myPosition.coordinates, isUTM, utmZone) : '31N 45827 E 454587'}
                        </span>
                    </div>
                    <div className="whitespace-nowrap text-sm text-center">
                        {elevation !== null && elevation !== undefined ? `${Number(elevation).toFixed(0)} m` : "1085 m"}
                    </div>
                </div>

                <div className="flex items-center gap-2 min-w-[10rem] mr-6">
                    <select
                        className="w-full px-6 py-2 h-11 bg-[#1f2937d6] text-white border focus:outline-none transition  min-w-[200px]"
                        value={activeMissionName ?? ""}
                        onChange={(e) => {
                            const v = e.target.value.trim();
                            dispatch(requestMissionListUiReset());
                            dispatch(setPreviewEntityId(null));
                            if (!v) {
                                dispatch(setActiveMissionName(null));
                                return;
                            }
                            dispatch(setActiveMissionName(v));
                            loadMissionFromServer(v);
                        }}
                        aria-label="בחירת משימה"
                    >
                        <option value="">כל הישויות</option>
                        {missionList.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                    משימה
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1 pb-0">
                        <div
                            ref={modeButtonRef}
                            onClick={() => setModeFlyoutOpen((v) => !v)}
                            className="cursor-pointer">
                            {getModeIcon()}
                        </div>
                        {systemMode === SystemModeE.SEMI_AUTO && (<span className="text-xs mt-[-5px] text-center w-full"> 1/2 </span>)}
                    </div>
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div ref={gunButtonRef} onClick={() => setGunFlyoutOpen((v) => !v)} title="Gun Status" className="flex flex-col items-center gap-1 pb-2 ml-8">
                        <RenderGunIcon status={gunStatus} />
                        <span className="text-xs">{GunStatusE[gunStatus]}</span>
                    </div>

                    <div title="Drone Status" className="flex flex-col items-center gap-1 pb-0">
                        <RenderDroneIcon />
                        <span className="text-xs">TBD</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div title="Antena Status" className="flex flex-col items-center gap-1 pb-2 ml-8">
                        <RenderAntenaIcon />
                    </div>

                    <div
                        ref={radarButtonRef}
                        onClick={() => setRadarFlyoutOpen((v) => !v)}
                        title="Radar Status"
                        className="flex flex-col items-center gap-1 pb-2">
                        <RenderRadarIcon status={radarStatus} />
                        <span className="text-xs">{RadarStatusE[radarStatus]}</span>
                    </div>
                    <div
                        ref={gpsButtonRef}
                        // onClick={() => setGpsFlyoutOpen((v) => !v)}
                        title="Tmaps Status"
                        className="flex flex-col items-center gap-1 pb-2 cursor-pointer">
                        <RenderInsIcon status={insStatus} />
                        <span className="text-xs">{InsStatusE[insStatus]}</span>
                    </div>

                    <div title="IFF Status" className="flex flex-col items-center gap-1 pb-0">
                        <RenderIffIcon />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div title="Eec Status" className="flex flex-col items-center gap-1 pb-2">
                        {/* <RenderRecIcon /> */}
                    </div>
                    <div className="text-base ml-2 mr-2">מוד {selectedModeLabelHe(selectedMode)}</div>

                    <div
                        title={`Server: ${isWebSocketConnected ? "Connected" : "Disconnected"}`}
                        className="flex flex-col items-center gap-1 pb-0">
                        {getServerIcon()}
                    </div>

                    <div className="text-right leading-tight px-3 py-1 rounded-lg">
                        <div className="text-sm opacity-90">{formattedDate}</div>
                        <div className="font-bold text-sm pr-2">{formattedTime}</div>
                    </div>
                </div>
            </div>

            <FlyoutMenu
                anchorRef={modeButtonRef}
                isOpen={modeFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}>
                <div className="flex items-center gap-4 px-2 py-1 bg-[#1f2937d6]">
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.AUTO);
                            sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.AUTO });
                            setModeFlyoutOpen(false);
                        }}>
                        <MdMotionPhotosAuto size={20} className="text-white mb-1" />
                        <span>Auto</span>
                    </div>
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.SEMI_AUTO);
                            sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.SEMI_AUTO });
                            setModeFlyoutOpen(false);
                        }}>
                        <div className="relative mt-2 mb-1 font-bold">
                            1/2
                        </div>
                        <span>Semi-Auto</span>
                    </div>
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.MANUAL);
                            sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.MANUAL });
                            setModeFlyoutOpen(false);
                        }}>
                        <RiHand size={20} className="text-white mb-1" />
                        <span>Manual</span>
                    </div>
                </div>
            </FlyoutMenu>

            <FlyoutMenu
                anchorRef={gunButtonRef}
                isOpen={gunFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}>
                <div className="text-right text-white text-xs mb-2">
                    {gunStatus && GunStatusE[gunStatus] || GunStatusE[0]}
                </div>
            </FlyoutMenu>

            <FlyoutMenu
                anchorRef={radarButtonRef}
                isOpen={radarFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}>
                <div className="text-right text-white text-xs mb-2">
                    {radarStatus && RadarStatusE[radarStatus] || RadarStatusE[0]}
                </div>
            </FlyoutMenu>

            {/* <FlyoutMenu
                anchorRef={gpsButtonRef}
                isOpen={gpsFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}>
                <div className=" bg-[#1f2937d6] text-white p-4 rounded-lg shadow-lg relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xl font-bold">TMAPS - INS</div>
                        <div className="mr-[-4px]">
                            <RenderInsIcon status={insStatus} />
                        </div>
                    </div>

                    <div className="text-right text-white text-xs mb-2">
                        {insStatus && InsStatusE[insStatus] || InsStatusE[0]}
                    </div>

                    <div className="mb-2">
                        <div className="flex border border-gray-600 rounded overflow-hidden w-[250px]">
                            <input
                                type="text"
                                disabled={!ignoreGps}
                                value={!ignoreGps ? myPosition?.coordinates ? trim4(myPosition?.coordinates.lat.toString()) : '00.0000' : `${lat}`}
                                onChange={changeLat}
                                placeholder="LAT"
                                maxLength={12}
                                className="min-w-[90px] w-[90px] px-2 py-[2px] text-sm bg-transparent text-white border-r border-gray-700" />
                            <input
                                type="text"
                                disabled={!ignoreGps}
                                value={!ignoreGps ? myPosition?.coordinates ? trim4(myPosition?.coordinates.lng.toString()) : '00.0000' : `${lng}`}
                                onChange={changeLng}
                                placeholder="LNG"
                                maxLength={12}
                                className="min-w-[90px] w-[90px] px-2 py-[2px] text-sm bg-transparent text-white border-r border-gray-700" />

                            <input
                                type="text"
                                disabled={!ignoreGps}
                                value={!ignoreGps ? myPosition?.heading ? myPosition?.heading : '0' : `${hed}`}
                                onChange={changeHed}
                                placeholder="HED"
                                maxLength={4}
                                className="min-w-[50px] w-[50px] px-2 py-[2px] text-sm bg-transparent text-white" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setIgnoreGps(!ignoreGps)} className={`w-12 h-6 rounded-full flex items-center transition-all duration-200 ${ignoreGps ? "bg-green-500" : "bg-gray-500"}`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-all duration-200 ${ignoreGps ? "translate-x-6" : "translate-x-1"}`} />
                        </button>

                        <span className="text-sm">
                            Manual Location (Ignore GPS)
                        </span>
                        <button
                            disabled={!ignoreGps}
                            onClick={sendToServer}
                            className="w-8 h-8 rounded-md border text-white"> ✔ </button>
                    </div>
                </div>
            </FlyoutMenu> */}
        </>
    );
};

export default memo(StatusBar);