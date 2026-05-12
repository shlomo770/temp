import { WsMessageName } from "../../enums/ws.enum";
import { OutboundMessageMap, OutboundMessageName } from "./wsTypes";

const isNumber = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isNumberOrString = (v: unknown) => isNumber(v) || typeof v === "string";
const isString = (v: unknown) => typeof v === "string";
const isBool = (v: unknown) => typeof v === "boolean";
const isLatLng = (v: any) =>
  v &&
  typeof v === "object" &&
  isNumberOrString(v.lat) &&
  isNumberOrString(v.lng);

type Validator<T> = (payload: T) => boolean;

const validators: Partial<Record<OutboundMessageName, Validator<any>>> = {
  [WsMessageName.Allocate]: (p: OutboundMessageMap[WsMessageName.Allocate]) =>
    isNumber(p.tgt_id) && isNumber(p.context),
  [WsMessageName.CancelEngagement]: (p: OutboundMessageMap[WsMessageName.CancelEngagement]) =>
    isNumber(p.tgt_id) && isNumber(p.context),
  [WsMessageName.ConfirmPosition]: (p: OutboundMessageMap[WsMessageName.ConfirmPosition]) =>
    isBool(p.confirmed),
  [WsMessageName.GetMissionsList]: (_p: OutboundMessageMap[WsMessageName.GetMissionsList]) => true,
  [WsMessageName.LoadMission]: (p: OutboundMessageMap[WsMessageName.LoadMission]) =>
    isString(p.mission_name) && p.mission_name.length > 0,
  [WsMessageName.LosRequest]: (p: OutboundMessageMap[WsMessageName.LosRequest]) =>
    isLatLng(p.pointA) && isLatLng(p.pointB),
  [WsMessageName.Ping]: (p: OutboundMessageMap[WsMessageName.Ping]) => isNumber(p.timestamp),
  [WsMessageName.SaveMission]: (p: OutboundMessageMap[WsMessageName.SaveMission]) =>
    isString(p.mission_name) && isString(p.entities),
  [WsMessageName.SetPosition]: (p: OutboundMessageMap[WsMessageName.SetPosition]) =>
    isNumberOrString(p.manual_pos.lat) && isNumberOrString(p.manual_pos.lng) && isNumberOrString(p.manual_pos.alt),
  [WsMessageName.SetRadarParams]: (p: OutboundMessageMap[WsMessageName.SetRadarParams]) =>
    isNumberOrString(p.radar_mode) &&
    isNumberOrString(p.mission_category) &&
    isNumberOrString(p.freq_index) &&
    isNumberOrString(p.min_elevation) &&
    isNumberOrString(p.blanking_sectors),
  [WsMessageName.SetTabooZone]: (p: OutboundMessageMap[WsMessageName.SetTabooZone]) =>
    isNumber(p.start) && isNumber(p.end),
  [WsMessageName.SetTargetInfo]: (p: OutboundMessageMap[WsMessageName.SetTargetInfo]) =>
    isNumber(p.tgt_id) &&
    isBool(p.platform_override) &&
    isNumber(p.platform) &&
    isBool(p.identity_override) &&
    isNumber(p.identity) &&
    isBool(p.is_allowed_in_tera),
  [WsMessageName.SystemMode]: (p: OutboundMessageMap[WsMessageName.SystemMode]) =>
    isNumberOrString(p.system_mode),
};

export const validateOutboundMessage = <T extends OutboundMessageName>(
  name: T,
  payload: OutboundMessageMap[T]
): boolean => {
  const validate = validators[name];
  if (!validate) return true;
  return validate(payload);
};
