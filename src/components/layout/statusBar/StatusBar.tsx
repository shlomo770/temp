import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { MdMotionPhotosAuto } from "react-icons/md";
import { RiHand } from "react-icons/ri";
import { COLORS } from "../../../constants/colors";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useWsConnection } from "../../../hooks/useWsConnection";
import { setElevation } from "../../../store/slices/elevationSlice";
import { formatCoordinates } from "../../../utils/coordinates";
import { toggleCoordinateSystem, setUTMZone } from "../../../store/slices/coordinatesSlice";
import { servers } from '../../../config/communication.json'
import { useWebSocket } from '../../../hooks/useWebSocket';
import { SystemModeE, GunStatusE, InsStatusE, RadarStatusE } from "../../../enums/statusBar.enum";
import { MyPosition } from "../../../types";
import { SelectedModeE } from "../../../enums/general.enum";
import RenderRadarIcon from "./RenderRadarIcon";
import RenderGunIcon from "./RenderGunIcon";
import RenderAntenaIcon from "./RenderAntenaIcon";
import RenderIffIcon from "./RenderIffIcon";
import RenderRecIcon from "./RenderRecIcon";
import RenderInsIcon from "./RenderInsIcon";
import FlyoutMenu from "../../ui/FlyoutMenu";
import RenderDroneIcon from "./RenderDroneIcon";

interface StatusBarProps {
    mapServiceRef?: React.MutableRefObject<any>;
    systemMode?: SystemModeE;
    insStatus?: InsStatusE;
    radarStatus?: RadarStatusE;
    clickedCoords?: { lat: number; lng: number } | null;
    myPosition?: MyPosition | null;
    onCenterToPosition?: (coordinates: { lat: number; lng: number }) => void;
    onHamburgerClick?: () => void;
    onTargetsClick?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
    clickedCoords = null,
    myPosition = null,
    onCenterToPosition,
    mapServiceRef,
    onHamburgerClick,
}) => {
    const { sendMessage } = useWebSocket();
    const dispatch = useAppDispatch();
    const isWebSocketConnected = useWsConnection();
    const elevation = useAppSelector((s) => s.elevation.elevation);
    const isUTM = useAppSelector((s) => s.coordinates.isUTM);
    const utmZone = useAppSelector((s) => s.coordinates.utmZone);
    const radarStatus = useAppSelector((s) => s.radar.status as RadarStatusE);
    const gunStatus = useAppSelector((s) => s.gun.status as GunStatusE);
    const missileHealth = useAppSelector((s) => s.gun.missileHealth);
    const insStatus = useAppSelector((s) => s.ins?.status as InsStatusE);
    const systemMode = useAppSelector((s) => s.systemState.systemMode as SystemModeE);
    const selectedMode = useAppSelector((s) => s.systemState.selectedMode as SelectedModeE);
    const missionList = useAppSelector((s) => s.entities.missionsList);
    const entitiesState = useAppSelector(state => state.entities.allIds);
    const gpsButtonRef = useRef<HTMLDivElement>(null);
    const modeButtonRef = useRef<HTMLDivElement>(null);
    const gunButtonRef = useRef<HTMLDivElement>(null);
    const radarButtonRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<SystemModeE>(systemMode);
    const [modeFlyoutOpen, setModeFlyoutOpen] = useState(false);
    const [gpsFlyoutOpen, setGpsFlyoutOpen] = useState(false);
    const [gunFlyoutOpen, setGunFlyoutOpen] = useState(false);
    const [radarFlyoutOpen, setRadarFlyoutOpen] = useState(false);
    const [ignoreGps, setIgnoreGps] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const [selected, setSelected] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [hed, setHed] = useState("");

    useEffect(() => {
        setFiles(missionList);
    }, [missionList]);

    useEffect(() => {
        if (!mapServiceRef?.current) return;
        mapServiceRef?.current?.clearAllEntitiesFromMap();
        setTimeout(() => {
            mapServiceRef?.current?.reloadAllEntities();
        }, 500);
    }, [entitiesState]);

    const trim4 = (v: any) => {
        const p = v.split(".");
        if (p.length === 1) return v;
        return p[0] + "." + p[1].slice(0, 7);
    };

    const changeLat = (e: any) => {
        let v = e.target.value.replace(/[^0-9.\-]/g, "");
        setLat(trim4(v));
    };

    const changeHed = (e: any) => {
        let v = e.target.value.replace(/[^0-9.\-]/g, "");
        setHed(v);
    };

    const changeLng = (e: any) => {
        let v = e.target.value.replace(/[^0-9.\-]/g, "");
        setLng(trim4(v));
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

    useEffect(() => {
        loadFileList();
    }, []);

    useEffect(() => {
        if (ignoreGps && clickedCoords) {
            setLat(trim4(clickedCoords.lat.toString()));
            setLng(trim4(clickedCoords.lng.toString()));
        }
    }, [clickedCoords, ignoreGps]);

    const sendToServer = () => {
        sendMessage('SET_POSITION', {
            lat: lat,
            lng: lng,
            alt: hed
        });
    };

    const date = useMemo(() => new Date(), []);
    const formattedDate = useMemo(() => date.toLocaleDateString("he-IL"), [date]);
    const formattedTime = useMemo(() => date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }), [date]);
    const handleCenterClick = useCallback(() => {
        if (myPosition?.coordinates && onCenterToPosition) {
            onCenterToPosition(myPosition.coordinates);
        }
    }, [myPosition?.coordinates, onCenterToPosition]);
    const loadFileList = async () => {
        sendMessage("GET_MISSIONS_LIST", {})
    };
    const loadFromServer = async (name: string) => {
        sendMessage("LOAD_MISSION", { mission_name: name })
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
                    <FaBars size={30} className="hover:scale-110 transition-transform ml-[-10px] cursor-pointer" onClick={onHamburgerClick} />
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
                        value={selected}
                        onChange={(e) => {
                            setSelected(e.target.value);
                            loadFromServer(e.target.value);
                        }}>
                        <option value="" disabled>Select Saved File</option>
                        {files?.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
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
                    </div>

                    <div title="Drone Status" className="flex flex-col items-center gap-1 pb-0">
                        <RenderDroneIcon />
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
                    </div>
                    <div
                        ref={gpsButtonRef}
                        onClick={() => setGpsFlyoutOpen((v) => !v)}
                        title="GPS Status"
                        className="flex flex-col items-center gap-1 pb-2 cursor-pointer">
                        <RenderInsIcon status={insStatus} />
                    </div>

                    <div title="IFF Status" className="flex flex-col items-center gap-1 pb-0">
                        <RenderIffIcon />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div title="Eec Status" className="flex flex-col items-center gap-1 pb-2">
                        <RenderRecIcon />
                    </div>
                    <div className="text-base">{selectedMode} Mode</div>

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
                            sendMessage('SYSTEM_MODE', { system_mode: SystemModeE.AUTO });
                            setModeFlyoutOpen(false);
                        }}>
                        <MdMotionPhotosAuto size={20} className="text-white mb-1" />
                        <span>Auto</span>
                    </div>
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.SEMI_AUTO);
                            sendMessage('SYSTEM_MODE', { system_mode: SystemModeE.SEMI_AUTO });
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
                            sendMessage('SYSTEM_MODE', { system_mode: SystemModeE.MANUAL });
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
                <div className="bg-[#1f2937d6] text-white p-4 rounded-lg shadow-lg min-w-[220px]">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-semibold">GUN / MISSILE</div>
                        <RenderGunIcon status={gunStatus} />
                    </div>
                    {missileHealth ? (
                        <div className="text-xs text-right leading-relaxed">
                            <div className="font-semibold mb-1">
                                {missileHealth.status === 'OK' ? 'OK' : 'FAIL'}
                            </div>
                            {missileHealth.status === 'NOT_OK' && missileHealth.reason && (
                                <div className="text-[11px] text-white/80 break-words">
                                    {missileHealth.reason}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs text-right">
                            {gunStatus && GunStatusE[gunStatus] || GunStatusE[0]}
                        </div>
                    )}
                </div>
            </FlyoutMenu>

            <FlyoutMenu
                anchorRef={radarButtonRef}
                isOpen={radarFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}>
                <div className="text-right text-white text-xs mb-2">
                    {radarStatus && RadarStatusE[radarStatus] || RadarStatusE[0]}צ 
                </div>
            </FlyoutMenu>

            <FlyoutMenu
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
                                maxLength={8}
                                className="min-w-[90px] w-[90px] px-2 py-[2px] text-sm bg-transparent text-white border-r border-gray-700" />
                            <input
                                type="text"
                                disabled={!ignoreGps}
                                value={!ignoreGps ? myPosition?.coordinates ? trim4(myPosition?.coordinates.lng.toString()) : '00.0000' : `${lng}`}
                                onChange={changeLng}
                                placeholder="LNG"
                                maxLength={8}
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

                    <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                        <div className="text-[11px] text-white/80 text-right">תצוגת קואורדינטות (כל הממשק)</div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => dispatch(toggleCoordinateSystem())}
                                className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-500"
                            >
                                {isUTM ? 'UTM' : 'WGS84'}
                            </button>
                            <span className="text-[11px] text-white/60">לחץ להחלפה</span>
                        </div>
                        {isUTM && (
                            <label className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="text-white/80">אזור UTM</span>
                                <select
                                    value={utmZone}
                                    onChange={(e) => dispatch(setUTMZone(Number(e.target.value)))}
                                    className="bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 border border-gray-600"
                                >
                                    {[33, 34, 35, 36, 37, 38].map((z) => (
                                        <option key={z} value={z}>
                                            {z}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </div>
                </div>
            </FlyoutMenu>
        </>
    );
};

export default memo(StatusBar);