import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { MdMotionPhotosAuto } from "react-icons/md";
import { RiHand } from "react-icons/ri";
import { WebSocketService } from '../../services/webSocket/WebSocketService'
import { COLORS } from "../../constants/colors";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { setElevation } from "../../store/slices/elevationSlice";
import { formatCoordinates } from "../../utils/coordinates";
import FlyoutMenu from "../ui/FlyoutMenu";
import { servers } from '../../config/communication.json'
import { clearEntities, setEntities } from "../../store/slices/entitiesSlice";
import { SystemModeE, GunStatusE, InsStatusE, RadarStatusE } from "../../enums/ststusBar.enum";
import { MyPosition } from "../../types";
import { SelectedModeE } from "../../enums/general.enum";
import { WsMessageName } from "@/enums/ws.enum";

// ───────────────────────── types ─────────────────────────
interface StatusBarProps {
    isWebSocketConnected?: boolean;
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

// ─────────────────────── pure icon renderers ───────────────────────
function renderInsIcon(status: InsStatusE | undefined) {
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
                    <img
                        src="./icons/swap_no_link_arrows_512.png"
                        className="w-8"
                        alt=""
                        style={{ marginTop: "-8px" }}
                    />
                </div>
            )}
            {status === InsStatusE.IGNORE_GPS && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src="./icons/destroyed.png"
                        className="w-8"
                        alt=""
                        style={{ marginTop: "-8px" }}
                    />
                </div>
            )}
        </div>
    );
}

function renderDroneIcon() {
    let color = "#ffffff";
    return (
        <div className="relative mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 66"
                fill={color}
                stroke={color}
                strokeWidth="2"
                className="w-9 h-9">
                <g fill={color} stroke={color} strokeWidth="1.5">
                    <circle cx="8.75" cy="8.75" r="2.81" />
                    <circle cx="39.25" cy="39.25" r="2.81" />
                    <circle cx="39.25" cy="8.75" r="2.81" />
                    <circle cx="8.75" cy="39.25" r="2.81" />
                    <path d="M35.238 37.705a4.318 4.318 0 0 1 2.467-2.467 19.256 19.256 0 0 1-3.688-2.992A11.326 11.326 0 0 1 30.639 24a11.326 11.326 0 0 1 3.378-8.246 19.256 19.256 0 0 1 3.688-2.992 4.318 4.318 0 0 1-2.467-2.462 19.226 19.226 0 0 1-2.992 3.688A11.326 11.326 0 0 1 24 17.361a11.326 11.326 0 0 1-8.246-3.378 19.256 19.256 0 0 1-2.992-3.683 4.318 4.318 0 0 1-2.462 2.462 19.226 19.226 0 0 1 3.688 2.992A11.326 11.326 0 0 1 17.361 24a11.326 11.326 0 0 1-3.378 8.246 19.226 19.226 0 0 1-3.683 2.992 4.318 4.318 0 0 1 2.467 2.467 19.256 19.256 0 0 1 2.992-3.688A11.326 11.326 0 0 1 24 30.639a11.326 11.326 0 0 1 8.246 3.378 19.256 19.256 0 0 1 2.992 3.688z" />
                    <path d="M8.75 17.5a8.686 8.686 0 0 0 3.92-.938 15.1 15.1 0 0 0-1.2-1.1 7.265 7.265 0 1 1 3.99-3.99 15.084 15.084 0 0 0 1.1 1.2A8.743 8.743 0 1 0 8.75 17.5zM32.536 11.474a7.265 7.265 0 1 1 3.99 3.99 15.084 15.084 0 0 0-1.2 1.1 8.778 8.778 0 1 0-3.892-3.892 15.1 15.1 0 0 0 1.102-1.198zM15.464 36.526a7.265 7.265 0 1 1-3.99-3.99 15.1 15.1 0 0 0 1.2-1.1 8.778 8.778 0 1 0 3.892 3.892 15.084 15.084 0 0 0-1.102 1.198zM39.25 30.5a8.686 8.686 0 0 0-3.92.938 15.084 15.084 0 0 0 1.2 1.1 7.265 7.265 0 1 1-3.99 3.99 15.1 15.1 0 0 0-1.1-1.2 8.743 8.743 0 1 0 7.81-4.828z" />
                </g>
            </svg>
        </div>
    );
}

function renderAntenaIcon(status: undefined) {
    let color = "#ffffff";
    return (
        <div className="relative mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 512 512" className="w-9 h-9">
                <g>
                    <g fillRule="evenodd" clipRule="evenodd">
                        <path d="M241.539 95.777c.003-7.976 6.484-14.46 14.461-14.46 7.977-.001 14.458 6.484 14.459 14.46.001 7.971-6.49 14.45-14.459 14.45-7.968.001-14.464-6.479-14.461-14.45z" opacity="0" fill={color} />
                        <path d="M166.261 187.547a6.977 6.977 0 0 1-4.951-2.049c-49.467-49.47-49.47-129.98 0-179.45a7.006 7.006 0 0 1 9.9 0c2.734 2.73 2.73 7.17 0 9.9-44.017 44.02-44.02 115.63 0 159.65 2.734 2.73 2.73 7.17 0 9.9a6.965 6.965 0 0 1-4.949 2.049zm25.757-153.73c-34.16 34.161-34.159 89.75 0 123.911a6.98 6.98 0 0 0 4.95 2.05c1.79 0 3.582-.681 4.95-2.05 2.73-2.73 2.731-7.171 0-9.9-28.7-28.7-28.696-75.411 0-104.11 2.73-2.73 2.731-7.16 0-9.9-2.729-2.73-7.168-2.73-9.9-.001zm158.671 151.68a6.971 6.971 0 0 1-4.95 2.05 6.986 6.986 0 0 1-4.951-2.05c-2.727-2.731-2.73-7.17 0-9.9 44.024-44.02 44.02-115.63 0-159.65-2.727-2.731-2.73-7.17 0-9.9a7.006 7.006 0 0 1 9.9 0c49.474 49.47 49.471 129.981.001 179.45zm-40.608-37.67a7.007 7.007 0 0 0-.002 9.901 6.974 6.974 0 0 0 4.949 2.05 6.97 6.97 0 0 0 4.95-2.05c34.16-34.16 34.161-89.75 0-123.91-2.73-2.73-7.167-2.73-9.9 0-2.73 2.74-2.73 7.17 0 9.9 28.701 28.7 28.704 75.409.003 104.109zm-91.179 191.18 70.627-46.88 20.412 99.22zm-31.442 123.29 117.571-57.619-94.531-54.351zm43.272-210.269-14.859 72.18 65.128-43.22zM256 129.217l16.749 81.411-37.206 18.01zm0-44.9c6.322 0 11.459 5.141 11.459 11.461.002 6.31-5.14 11.45-11.459 11.45-6.317 0-11.46-5.14-11.46-11.45.003-6.321 5.139-11.46 11.46-11.461zm28.3 182.41-43.519-25.07 34.888-16.879zm-16.267-148.519c7.988-4.301 13.427-12.74 13.427-22.43.001-14.041-11.42-25.46-25.46-25.46s-25.46 11.42-25.46 25.46c0 9.689 5.44 18.13 13.43 22.43l-78.478 381.379c-.778 3.79 1.658 7.491 5.437 8.271a7.003 7.003 0 0 0 8.27-5.45l4.693-22.77 131.008-64.21 17.901 86.98a7.002 7.002 0 0 0 6.847 5.59c.475 0 .94-.05 1.42-.14a7 7 0 0 0 5.44-8.27z" fill={color} />
                    </g>
                </g>
            </svg>
        </div>
    );
}

function renderIffIcon(status: undefined) {
    let color = "#ffffff";
    return (
        <div className="relative mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12">
                <text x="50%" y="55%" textAnchor="middle" fill={color} fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold">IFF</text>
            </svg>
        </div>
    );
}

function renderRecIcon(status: undefined) {
    let color = "#ffffff";

    return (
        <div className="relative mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1.707 1.707" className="w-8 h-8">
                <g fillRule="nonzero">
                    <path d="M1.058 1.135C1.018 1.107.794.982.755.96a.039.039 0 0 0-.058.034v.346c0 .03.033.048.058.033l.298-.172c.013-.009.021-.017.021-.034a.038.038 0 0 0-.016-.032z" fill={color} />
                    <path d="M1.607.673H.164v.987h1.443zM.14.626h1.49c.014 0 .024.01.024.024v1.033c0 .013-.01.024-.023.024H.14a.023.023 0 0 1-.024-.024V.65c0-.013.01-.024.023-.024z" fill={color} />
                    <path d="M.088.39a.023.023 0 0 0-.024.039l.294.178a.023.023 0 0 0 .024-.04zM.39.308a.023.023 0 0 0-.024.04l.295.178a.023.023 0 0 0 .024-.04zM.693.227a.023.023 0 0 0-.024.04l.294.178a.023.023 0 0 0 .024-.04zM.995.146a.023.023 0 0 0-.024.04l.294.178a.023.023 0 0 0 .024-.04zM1.297.065a.023.023 0 0 0-.024.04l.295.178a.023.023 0 0 0 .024-.04z" fill={color} />
                    <path d="M.146.672A.023.023 0 0 1 .118.655L.053.415A.023.023 0 0 1 .071.386L1.509.001a.023.023 0 0 1 .03.017l.064.24a.023.023 0 0 1-.017.029c-.48.13-.96.257-1.44.385zm.01-.05L1.552.247 1.5.052.104.426z" fill={color} />
                </g>
            </svg>
        </div>
    );
}

function renderRadarIcon(status: RadarStatusE | undefined) {
    let color = "#ffffff";
    if (status === RadarStatusE.OK) color = COLORS.white;
    else if (status === RadarStatusE.WARNING) color = COLORS.yellow;
    else if (status === RadarStatusE.FAIL) color = COLORS.red;
    else if (status === RadarStatusE.ACTIVE) color = COLORS.green;
    else if (status === RadarStatusE.NO_COMM) color = COLORS.gray;

    return (
        <div className="relative mt-2">
            <svg
                xmlns="http://www.w3.org/2000/svg"

                viewBox="20 0 61 110"
                fill={color}
                stroke={color}
                strokeWidth="2"
                className="w-8 h-8"
            >
                <g>
                    <path d="M76.858 21.728L49.293 49.293a1 1 0 1 0 1.414 1.414l8.008-8.008A11.31 11.31 0 0 1 61.38 50c0 6.275-5.105 11.38-11.38 11.38S38.62 56.275 38.62 50 43.725 38.62 50 38.62a1 1 0 0 0 0-2c-7.378 0-13.38 6.002-13.38 13.38S42.622 63.38 50 63.38 63.38 57.378 63.38 50a13.3 13.3 0 0 0-3.249-8.717l7.894-7.894A24.364 24.364 0 0 1 74.518 50c0 13.519-10.999 24.518-24.518 24.518S25.482 63.519 25.482 50 36.481 25.482 50 25.482a1 1 0 0 0 0-2c-14.622 0-26.518 11.896-26.518 26.518S35.378 76.518 50 76.518 76.518 64.622 76.518 50a26.352 26.352 0 0 0-7.079-18.025l8.129-8.129C84.303 30.936 88 40.184 88 50c0 20.953-17.047 38-38 38S12 70.953 12 50s17.047-38 38-38a1 1 0 0 0 0-2c-22.056 0-40 17.944-40 40s17.944 40 40 40 40-17.944 40-40c0-10.685-4.16-20.729-11.716-28.284a1.015 1.015 0 0 0-1.426.012z" />
                </g>
            </svg>
            {status === RadarStatusE.NO_COMM && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src="./icons/swap_no_link_arrows_512.png"
                        className="w-8"
                        alt=""
                        style={{ marginTop: "-8px" }}
                    />
                </div>
            )}
        </div>
    );
}

function renderGunIcon(status: GunStatusE | undefined) {
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
                className="w-8 h-8"
            >
                <g>
                    <g id="shape4-1" transform="translate(3,-3)">
                        <path
                            d="M22.68 84.88 A28.7248 25.3119 -90 0 0 -0 110.62 L55.28 110.62 A30.1359 23.236 -91.93 0 0 34.02 84.88 L34.02 8.35 A8.01759 8.01759 -180 0 0 22.68 8.35 L22.68 84.88 Z"
                            className="st1"
                        />
                    </g>
                    <g id="shape5-3" transform="translate(45.5197,-39.9036)">
                        <path
                            d="M11.34 106.2 L11.34 75.02 A6.07193 6.07193 -180 0 0 0 75.02 L0 106.2 A5.84531 5.84531 -180 0 0 11.34 106.2 Z"
                            className="st1"
                        />
                    </g>
                    <g id="shape6-5" transform="translate(5.83464,-39.9036)">
                        <path
                            d="M11.34 106.2 L11.34 75.02 A6.07193 6.07193 -180 0 0 0 75.02 L0 106.2 A5.84531 5.84531 -180 0 0 11.34 106.2 Z"
                            className="st1"
                        />
                    </g>
                </g>
            </svg>

            {status === GunStatusE.ARM && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-xs font-bold text-red-600"
                        style={{ marginTop: "-8px" }}
                    >
                        ARM
                    </span>
                </div>
            )}

            {status === GunStatusE.NO_COMM && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src="./icons/swap_no_link_arrows_512.png"
                        className="w-8"
                        alt=""
                        style={{ marginTop: "-8px" }}
                    />
                </div>
            )}
        </div>
    );
}


// ───────────────────────── component ─────────────────────────
const StatusBar: React.FC<StatusBarProps> = ({
    isWebSocketConnected = false,
    clickedCoords = null,
    myPosition = null,
    onCenterToPosition,
    mapServiceRef,
    onHamburgerClick,
}) => {

    const dispatch = useAppDispatch();

    const elevation = useAppSelector((s) => s.elevation.elevation);
    const isUTM = useAppSelector((s) => s.coordinates.isUTM);
    const utmZone = useAppSelector((s) => s.coordinates.utmZone);
    const radarStatus = useAppSelector((s) => s.radar.status as RadarStatusE | undefined);
    const gunStatus = useAppSelector((s) => s.gun.status as GunStatusE | undefined);
    const insStatus = useAppSelector((s) => s.ins?.status as unknown as InsStatusE | undefined);
    const systemMode = useAppSelector((s) => s.systemState.systemMode as SystemModeE);
    const selectedMode = useAppSelector((s) => s.systemState.selectedMode as SelectedModeE);
    const missionList = useAppSelector((s) => s.entities.missionsList);

    const [mode, setMode] = useState<SystemModeE>(systemMode);
    const wsServiceRef = useRef<WebSocketService | null>(null);


    const [modeFlyoutOpen, setModeFlyoutOpen] = useState(false);
    const modeButtonRef = useRef<HTMLDivElement>(null);
    const gunButtonRef = useRef<HTMLDivElement>(null);
    const radarButtonRef = useRef<HTMLDivElement>(null);
    const [gpsFlyoutOpen, setGpsFlyoutOpen] = useState(false);
    const [gunFlyoutOpen, setGunFlyoutOpen] = useState(false);
    const [radarFlyoutOpen, setRadarFlyoutOpen] = useState(false);
    const gpsButtonRef = useRef<HTMLDivElement>(null);
    const [ignoreGps, setIgnoreGps] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const [selected, setSelected] = useState("");

    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [hed, setHed] = useState("");


    useEffect(() => {
        setFiles(missionList);
    }, [missionList]);

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
        if (!wsServiceRef.current) {
            wsServiceRef.current = WebSocketService.getInstance();
            setTimeout(() => {
            }, 3000);
        };

        loadFileList();
    }, []);

    useEffect(() => {
        if (ignoreGps && clickedCoords) {
            setLat(trim4(clickedCoords.lat.toString()));
            setLng(trim4(clickedCoords.lng.toString()));
        }
    }, [clickedCoords, ignoreGps]);


    const sendToServer = () => {
        // wsServiceRef.current?.sendMessage(WsMessageName.SetPosition, {
        //     manual_pos: {
        //         lat: lat,
        //         lng: lng,
        //         alt: hed
        //     }});
    };

    const date = useMemo(() => new Date(), []);
    const formattedDate = useMemo(() => date.toLocaleDateString("he-IL"), [date]);
    const formattedTime = useMemo(() => date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }), [date]);
    const radarIcon = useMemo(() => renderRadarIcon(radarStatus), [radarStatus]);
    const gunIcon = useMemo(() => renderGunIcon(gunStatus), [gunStatus]);
    const droneIcon = useMemo(() => renderDroneIcon(), [gunStatus]);
    const antenaIcon = useMemo(() => renderAntenaIcon(undefined), [gunStatus]);
    const iffIcon = useMemo(() => renderIffIcon(undefined), [gunStatus]);
    const recIcon = useMemo(() => renderRecIcon(undefined), [gunStatus]);
    const insIcon = useMemo(() => renderInsIcon(insStatus), [insStatus]);


    const handleCenterClick = useCallback(() => {
        if (myPosition?.coordinates && onCenterToPosition) {
            onCenterToPosition(myPosition.coordinates);
        }
    }, [myPosition?.coordinates, onCenterToPosition]);

    const loadFileList = async () => {
        // wsServiceRef.current?.sendMessage("GET_MISSIONS_LIST", {})
    };

    const loadFromServer = async (name: string) => {
        // wsServiceRef.current?.sendMessage("LOAD_MISSION", { mission_name: name })
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
        } else {
            return <RiHand size={iconSize} className="text-white" />;
        }
    }, [mode]);

    return (
        <>
            <div
                className="bg-[#1f2937d6] h-[60px] shadow-md flex items-center justify-between px-8 relative"
                style={{ fontSize: "13px", color: "white", zIndex: 99999 }}
            >
                {/* Left: Hamburger */}
                <div className="flex items-center gap-2 min-w-[5rem]">
                    <FaBars
                        size={30}
                        style={{ cursor: "pointer" }}
                        className="hover:scale-110 transition-transform ml-[-10px]"
                        onClick={onHamburgerClick}
                    />
                </div>

                <div className="flex items-center gap-2 min-w-[20rem]">
                    <div
                        className="flex items-center gap-3 px-1 py-1 cursor-pointer transition-colors border min-w-[250px]"
                        onClick={handleCenterClick}
                    >
                        <img src="./icons/pointing_center_512.png" alt="" className="w-8" />
                        <div className="w-px h-6 bg-white" />
                        <span className="font-mono whitespace-nowrap text-base">
                            {clickedCoords
                                ? formatCoordinates(clickedCoords, isUTM, utmZone)
                                : myPosition?.coordinates
                                    ? formatCoordinates(myPosition.coordinates, isUTM, utmZone)
                                    : '31N 45827 E 454587'
                            }
                        </span>
                    </div>
                    <div className="whitespace-nowrap text-sm text-center">
                        {elevation !== null && elevation !== undefined
                            ? `${Number(elevation).toFixed(0)} m`
                            : "1085 m"}
                    </div>
                </div>

                <div className="flex items-center gap-2 min-w-[10rem] mr-6">
                    <select
                        className="w-full px-6 py-2 h-11 bg-[#1f2937d6] text-white border focus:outline-none transition  min-w-[200px]"
                        value={selected}
                        onChange={(e) => {
                            setSelected(e.target.value);
                            loadFromServer(e.target.value);
                        }}
                    >
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
                            className="cursor-pointer"
                        >
                            {getModeIcon()}
                        </div>
                        {systemMode === SystemModeE.SEMI_AUTO && (
                            <span
                                className="text-xs"
                                style={{ marginTop: "-5px", textAlign: "center", width: "100%" }}
                            >
                                1/2
                            </span>
                        )}
                    </div>
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div ref={gunButtonRef} onClick={() => setGunFlyoutOpen((v) => !v)} title="Gun Status" className="flex flex-col items-center gap-1 pb-2 ml-8">
                        {gunIcon}
                    </div>

                    <div title="Drone Status" className="flex flex-col items-center gap-1 pb-0">
                        {droneIcon}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div title="Antena Status" className="flex flex-col items-center gap-1 pb-2 ml-8">
                        {antenaIcon}
                    </div>

                    <div
                        ref={radarButtonRef}
                        onClick={() => setRadarFlyoutOpen((v) => !v)}
                        title="Radar Status"
                        className="flex flex-col items-center gap-1 pb-2"
                    >
                        {radarIcon}
                    </div>


                    <div
                        ref={gpsButtonRef}
                        onClick={() => setGpsFlyoutOpen((v) => !v)}
                        title="GPS Status"
                        className="flex flex-col items-center gap-1 pb-2 cursor-pointer"
                    >
                        {insIcon}
                    </div>


                    <div title="IFF Status" className="flex flex-col items-center gap-1 pb-0">
                        {iffIcon}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-px h-8 bg-[#9ca3af]" />
                    <div title="Eec Status" className="flex flex-col items-center gap-1 pb-2">
                        {recIcon}
                    </div>

                    <div className="text-base">{selectedMode} Mode</div>

                    <div
                        title={`Server: ${isWebSocketConnected ? "Connected" : "Disconnected"}`}
                        className="flex flex-col items-center gap-1 pb-0"
                    >
                        {getServerIcon()}
                    </div>

                    <div className="text-right leading-tight px-3 py-1 rounded-lg">
                        <div className="text-sm opacity-90">{formattedDate}</div>
                        <div className="font-bold text-sm pr-2">{formattedTime}</div>
                    </div>
                </div>
            </div>

            {/* Mode Flyout */}
            <FlyoutMenu
                anchorRef={modeButtonRef}
                isOpen={modeFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}
            >
                <div className="flex items-center gap-4 px-2 py-1 bg-[#1f2937d6]">
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.AUTO);
                            wsServiceRef.current?.sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.AUTO });
                            setModeFlyoutOpen(false);
                        }}
                    >
                        <MdMotionPhotosAuto size={20} className="text-white mb-1" />
                        <span>Auto</span>
                    </div>
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.SEMI_AUTO);
                            wsServiceRef.current?.sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.SEMI_AUTO });
                            setModeFlyoutOpen(false);
                        }}
                    >
                        {/* <MdMotionPhotosAuto size={20} className="text-white mb-1" /> */}
                        <div className="relative mt-2 mb-1 font-bold">
                            1/2
                        </div>
                        <span>Semi-Auto</span>
                    </div>
                    <div
                        className="flex flex-col items-center text-white text-xs cursor-pointer  p-2 rounded"
                        onClick={() => {
                            setMode(SystemModeE.MANUAL);
                            wsServiceRef.current?.sendMessage(WsMessageName.SystemMode, { system_mode: SystemModeE.MANUAL });
                            setModeFlyoutOpen(false);
                        }}
                    >
                        <RiHand size={20} className="text-white mb-1" />
                        <span>Manual</span>
                    </div>
                </div>
            </FlyoutMenu>

            <FlyoutMenu
                anchorRef={gunButtonRef}
                isOpen={gunFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}
            >

                <div className="text-right text-white text-xs mb-2">
                    {gunStatus && GunStatusE[gunStatus] || GunStatusE[0]}
                </div>
            </FlyoutMenu>

            <FlyoutMenu
                anchorRef={radarButtonRef}
                isOpen={radarFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}
            >

                <div className="text-right text-white text-xs mb-2">
                    {radarStatus && RadarStatusE[radarStatus] || RadarStatusE[0]}
                </div>
            </FlyoutMenu>

            {/* GPS Flyout */}
            <FlyoutMenu
                anchorRef={gpsButtonRef}
                isOpen={gpsFlyoutOpen}
                placement="bottom"
                onClose={() => undefined}
            >
                <div className=" bg-[#1f2937d6] text-white p-4 rounded-lg shadow-lg relative">

                    {/* HEADER + ICON */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xl font-bold">TMAPS - INS</div>

                        <div className="mr-[-4px]">{insIcon}</div>
                    </div>

                    {/* STATUS */}
                    <div className="text-right text-white text-xs mb-2">
                        {insStatus && InsStatusE[insStatus] || InsStatusE[0]}
                    </div>

                    {/* Coordinates Input */}
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

                    {/* Toggle */}
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
            </FlyoutMenu>
        </>
    );
};

export default memo(StatusBar);