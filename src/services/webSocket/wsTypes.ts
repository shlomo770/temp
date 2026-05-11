import type { LatLng } from '../../utils/geometry';
import type { Coordinates } from '../../types';
import { WsMessageName } from '../../enums/ws.enum';
import { FaultNormalE, GunStatusE, InsStatusE, RadarStateE, RadarStatusE } from '../../enums/statusBar.enum';
import { ErrorSeverityE, ErrorStateE } from "../../enums/general.enum";



export interface WSMessage<TName extends keyof MessageMap = keyof MessageMap> {
    header: { name: TName; id?: string; ts?: number };
    data: MessageMap[TName];
}

type Loose<T> = T & Record<string, unknown>;

export interface MessageMap {
    SAVE_ENTITY: Loose<{
        id: string;
        category: string;
        type: string;
        coordinates: Coordinates[];
        radius_1?: number;
        radius_2?: number;
        height?: number;
        name?: string;
        color?: string;
        transparency?: number;
    }>;
    ENTITY_CREATED: Loose<{
        temp_id: string;
        new_id: string;
    }>;
    /** מיקום וניווט TMAPS (במקום POSITION הישן) */
    TMAPS_PARAMS: Loose<{
        gps_pos?: { lat?: number; lng?: number; alt?: number };
        tmaps_pos?: { lat?: number; lng?: number; alt?: number };
        manual_pos?: { lat?: number; lng?: number; alt?: number };
        use_gps?: boolean;
        use_manual?: boolean;
        zone?: number;
        fig_of_merit?: number;
        heading?: number;
        pitch?: number;
        roll?: number;
        distance_travelled?: number;
    }>;
    ENTITY_POSITION: Loose<{ entityId: string; coordinates: LatLng }>;
    ENTITY_DELETED: Loose<{ entityId: string }>;
    ENTITY_UPDATED: Loose<{ entityId: string; coordinates: LatLng }>;

    LOS_SECTOR: Loose<any>;

    LOAD_RESULT: Loose<{ entities: any[] }>;
    SAVE_RESULT: Loose<any>;
    ERROR: Loose<{ code?: string; message?: string }>;

    RECOMMEND_ASSIGNMENT:
    | Loose<{ targetId?: string; id?: string; targetIds?: string[]; reason?: string }>
    | string[];

    TARGET_UPDATE: Loose<{ id: string; coordinates: LatLng; heading?: number; speed?: number; type?: string; timestamp?: number; friend?: boolean }>;
    TARGETS_DATA: MessageMap['TARGET_UPDATE'] | MessageMap['TARGET_UPDATE'][];

    RADAR_UPDATE: Loose<{ state?: string; mission_category?: number; radar1_status?: FaultNormalE; radar2_status?: FaultNormalE; radar3_status?: FaultNormalE; radar4_status?: FaultNormalE; freq_index?: number; hfl1_status?: FaultNormalE; hfl2_status?: FaultNormalE; hfl3_status?: FaultNormalE; hfl4_status?: FaultNormalE; }>;
    RADAR_STATUS: Loose<MessageMap['RADAR_UPDATE']>;

    CONFIRM_UPDATE: Loose<{}>;
    CONFIRM_POSITION: Loose<MessageMap['CONFIRM_UPDATE']>;

    RADAR_BIT_STATUS_UPDATE: Loose<{ code: number, description: string, severity: ErrorSeverityE, state: ErrorStateE }>;
    RADAR_BIT_STATUS: Loose<MessageMap['RADAR_BIT_STATUS_UPDATE']>;

    LOS_UPDATE: Loose<any>;
    LOS_RESULT: Loose<MessageMap['LOS_UPDATE']>;

    MISSIONS_LIST_UPDATE: Loose<any>;
    MISSIONS_LIST: Loose<MessageMap['MISSIONS_LIST_UPDATE']>;

    MISSION_DATA_UPDATE: Loose<{ mission_name: string, entities: any }>;
    MISSION_DATA: Loose<MessageMap['MISSION_DATA_UPDATE']>;

    /** שרת → לקוח: טעינת מאגר מלא (ישויות + משימות עם entityIds) */
    GET_DB: Loose<{ entities?: unknown[]; missions?: unknown[] }>;

    RADAR_PARAMS_UPDATE: Loose<{ radar_mode: RadarStateE; mission_category: number; freq_index: number }>;
    RADAR_PARAMS: Loose<MessageMap['RADAR_PARAMS_UPDATE']>;

    SYSTEM_STATUS_M: Loose<{ radar_status?: RadarStatusE; gun_status?: GunStatusE; tmaps_status: InsStatusE; radar_non_coverage: string[]; radar_range: number }>;
    SYSTEM_STATUS: Loose<MessageMap['SYSTEM_STATUS_M']>;

    TARGET_Assigned: Loose<{ targetId?: string; id?: string }>;
    TARGET_LOCK: Loose<{ targetId?: string; id?: string }>;
    TARGET_DESTROYED: Loose<{ targetId?: string; id?: string }>;

    GUN_BIT_STATUS: Loose<{ status: string }>;
}

/** גוף הודעות יוצאות (לקוח → שרת) — לשימוש ב־wsValidators / sendMessage */
export interface OutboundMessageMap {
    [WsMessageName.Allocate]: { tgt_id: string; context: number };
    [WsMessageName.CancelEngagement]: { tgt_id: string; context: number };
    [WsMessageName.ConfirmPosition]: { confirmed: boolean };
    [WsMessageName.GetMissionsList]: Record<string, never>;
    [WsMessageName.DeleteMission]: { mission_name: string };
    [WsMessageName.SendXml]: { xml: string };
    [WsMessageName.LoadMission]: { mission_name: string };
    [WsMessageName.LosRequest]: {
        pointA: { lat: number | string; lng: number | string };
        pointB: { lat: number | string; lng: number | string };
    };
    [WsMessageName.Ping]: { timestamp: number };
    [WsMessageName.SaveMission]: { mission_name: string; entities: string };
    [WsMessageName.SaveEntity]: {
        temp_id: string;
        category: string;
        type: string;
        coordinates: Coordinates[];
        alt?: number;
        params?: {
            lat?: number;
            lng?: number;
            radius_1?: number;
            radius_2?: number;
        };
    };
    [WsMessageName.UpdateEntity]: {
        id: string;
        category: string;
        type: string;
        coordinates: Coordinates[];
        alt?: number;
        params?: {
            lat?: number;
            lng?: number;
            radius_1?: number;
            radius_2?: number;
        };
    };
    [WsMessageName.SetPosition]: { lat: number | string; lng: number | string; alt: number | string };
    [WsMessageName.SetRadarParams]: {
        radar_mode: number | string;
        mission_category: number | string;
        freq_index: number | string;
    };
    [WsMessageName.SetTabooZone]: { start: number; end: number };
    [WsMessageName.SetTargetInfo]: {
        tgt_id: string;
        platform_override: boolean;
        platform: number;
        identity_override: boolean;
        identity: number;
        is_allowed_in_tera: boolean;
    };
    [WsMessageName.SystemMode]: { system_mode: number | string };
    /** לקוח → שרת: מחיקת ישות */
    [WsMessageName.EntityDeleted]: {
        entityId: string;
    };
}

export type OutboundMessageName = keyof OutboundMessageMap;