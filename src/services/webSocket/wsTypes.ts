import type { Coordinates, LatLng } from '../../utils';
import { FaultNormalE, GunStatusE, InsStatusE, RadarStateE, RadarStatusE } from '../../enums/statusBar.enum';
import { ErrorSeverityE, ErrorStateE, type PosTypeE } from "../../enums/general.enum";
import { WsMessageName } from "../../enums/ws.enum";
import type { EntityCategoryEnum, EntityTypeEnum } from '../../enums/entitis.enum';



export interface WSMessage<TName extends keyof MessageMap = keyof MessageMap> {
    header: { name: TName; id?: string; ts?: number };
    data: MessageMap[TName];
}

type Loose<T> = T & Record<string, unknown>;

export interface MessageMap {
    [WsMessageName.Position]: Loose<{ gps_pos: LatLng; tmaps_pos: LatLng; manual_pos: { lat: number; lng: number, alt: number, heading: number }; use_gps: boolean; use_manual: boolean; zone: number; fig_of_merit: number; heading: number; pitch: number; roll: number; distance_travelled: number }>;
    [WsMessageName.EntityPosition]: Loose<{ entityId: string; coordinates: LatLng }>;
    [WsMessageName.EntityCreated]: Loose<{
        temp_id: string;
        new_id: string;
    }>;
    [WsMessageName.EntityUpdated]: Loose<{ entityId: string; coordinates: LatLng }>;

    [WsMessageName.LosSector]: Loose<any>;

    [WsMessageName.LoadResult]: Loose<{ entities: any[] }>;
    [WsMessageName.SaveResult]: Loose<any>;
    [WsMessageName.Error]: Loose<{ code?: string; message?: string }>;

    [WsMessageName.RecommendAssignment]:
    | Loose<{ targetId?: string; id?: string; targetIds?: string[]; reason?: string }>
    | string[];

    [WsMessageName.TargetUpdate]: Loose<{ id: string; coordinates: LatLng; heading?: number; speed?: number; type?: string; timestamp?: number; friend?: boolean }>;
    [WsMessageName.TargetsData]: MessageMap[WsMessageName.TargetUpdate] | MessageMap[WsMessageName.TargetUpdate][];

    [WsMessageName.RadarUpdate]: Loose<{ state?: string; mission_category?: number; radar1_status?: FaultNormalE; radar2_status?: FaultNormalE; radar3_status?: FaultNormalE; radar4_status?: FaultNormalE; freq_index?: number; hfl1_status?: FaultNormalE; hfl2_status?: FaultNormalE; hfl3_status?: FaultNormalE; hfl4_status?: FaultNormalE; }>;
    [WsMessageName.RadarStatus]: Loose<MessageMap[WsMessageName.RadarUpdate]>;

    [WsMessageName.ConfirmUpdate]: Loose<{}>;
    [WsMessageName.ConfirmPosition]: Loose<MessageMap[WsMessageName.ConfirmUpdate]>;

    [WsMessageName.RadarBitStatusUpdate]: Loose<{ code: number, description: string, severity: ErrorSeverityE, state: ErrorStateE }>;
    [WsMessageName.RadarBitStatus]: Loose<MessageMap[WsMessageName.RadarBitStatusUpdate]>;

    [WsMessageName.LosUpdate]: Loose<any>;
    [WsMessageName.LosResult]: Loose<MessageMap[WsMessageName.LosUpdate]>;

    [WsMessageName.MissionsListUpdate]: Loose<any>;
    [WsMessageName.MissionsList]: Loose<MessageMap[WsMessageName.MissionsListUpdate]>;

    [WsMessageName.GetDb]: Loose<{
        entities?: unknown[];
        Entities?: unknown[];
        missions?: unknown[];
        Missions?: unknown[];
    }>;

    [WsMessageName.MissionDataUpdate]: Loose<{ mission_name: string, entities: any }>;
    [WsMessageName.MissionData]: Loose<MessageMap[WsMessageName.MissionDataUpdate]>;

    [WsMessageName.RadarParamsUpdate]: Loose<{ radar_mode: RadarStateE; mission_category: number; freq_index: number, min_elevation: number, blanking_sectors: number }>;
    [WsMessageName.RadarParams]: Loose<MessageMap[WsMessageName.RadarParamsUpdate]>;

    [WsMessageName.SystemStatusM]: Loose<{ radar_status?: RadarStatusE; gun_status?: GunStatusE; tmaps_status: InsStatusE; radar_non_coverage: string[]; radar_range: number }>;
    [WsMessageName.SystemStatus]: Loose<MessageMap[WsMessageName.SystemStatusM]>;

    [WsMessageName.TargetAssigned]: Loose<{ targetId?: string; id?: string }>;
    [WsMessageName.TargetLock]: Loose<{ targetId?: string; id?: string }>;
    [WsMessageName.TargetDestroyed]: Loose<{ targetId?: string; id?: string }>;
    [WsMessageName.OdoCaliFinished]: Loose<{}>;
    [WsMessageName.TmapsBitStatus]: Loose<{}>;

    [WsMessageName.GunBitStatus]: Loose<{ status: string }>;
}

export type OutboundMessageMap = {
    [WsMessageName.Allocate]: { tgt_id: string; context: number };
    [WsMessageName.CancelEngagement]: { tgt_id: string; context: number };
    [WsMessageName.ConfirmPosition]: { confirmed: boolean };
    [WsMessageName.GetMissionsList]: {};
    [WsMessageName.EntityDeleted]: Loose<{ id: string, type: EntityTypeEnum }>;
    [WsMessageName.SaveEntity]: Loose<{
        temp_id: string;
        category: EntityCategoryEnum;
        type: string;
        coordinates: Coordinates[];
        alt?: number;
        params?: {
            lat?: number;
            lng?: number;
            radius_1?: number;
            radius_2?: number;
        };
    }>;
    [WsMessageName.UpdateEntity]: Loose<{
        id: string;
        category: EntityCategoryEnum;
        type: string;
        coordinates: Coordinates[];
        alt?: number;
        params?: {
            lat?: number;
            lng?: number;
            radius_1?: number;
            radius_2?: number;
        };
    }>;
    [WsMessageName.DeleteMission]: Loose<{ mission_name: string }>;
    [WsMessageName.LoadMission]: { mission_name: string };
    [WsMessageName.LosRequest]: { pointA: LatLng; pointB: LatLng };
    [WsMessageName.Ping]: { timestamp: number };
    [WsMessageName.SaveMission]: { mission_name: string; entities: string };
    [WsMessageName.SetPosition]: { manual_pos: { lat: number | string; lng: number | string; alt: number | string, heading: number | string } };
    [WsMessageName.SetRadarParams]: { radar_mode: RadarStateE; mission_category: number; freq_index: number, min_elevation: number, blanking_sectors: number };
    [WsMessageName.SetTabooZone]: { id: string; start: number; end: number };
    [WsMessageName.StartRealing]: {};
    [WsMessageName.StartOdoCali]: {};
    [WsMessageName.SetPosType]: { pos: PosTypeE };
    [WsMessageName.GpsIntegration]: { use_gps: boolean };
    [WsMessageName.SetTargetInfo]: {
        tgt_id: string;
        platform_override: boolean;
        platform: number;
        identity_override: boolean;
        identity: number;
        is_allowed_in_tera: boolean;
    };
    [WsMessageName.SystemMode]: { system_mode: number };
};

export type OutboundMessageName = keyof OutboundMessageMap;