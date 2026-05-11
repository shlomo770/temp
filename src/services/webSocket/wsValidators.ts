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
const isLatLngTuple = (v: any) =>
  Array.isArray(v) && v.length >= 2 && isNumberOrString(v[0]) && isNumberOrString(v[1]);
export const isLatLngArray = (v: any) =>
  Array.isArray(v) && v.every((p) => isLatLng(p) || isLatLngTuple(p));
const isEntityParams = (v: any) =>
  v &&
  typeof v === "object" &&
  (
    // allow empty object for polygon/line payloads
    Object.keys(v).length === 0 ||
    (
      isNumberOrString(v.lat) &&
      isNumberOrString(v.lng) &&
      isNumberOrString(v.radius_1) &&
      isNumberOrString(v.radius_2)
    )
  );

type Validator<T> = (payload: T) => boolean;

const validators: Partial<Record<OutboundMessageName, Validator<any>>> = {
  [WsMessageName.Allocate]: (p: OutboundMessageMap[WsMessageName.Allocate]) =>
    isString(p.tgt_id) && isNumber(p.context),
  [WsMessageName.CancelEngagement]: (p: OutboundMessageMap[WsMessageName.CancelEngagement]) =>
    isString(p.tgt_id) && isNumber(p.context),
  [WsMessageName.ConfirmPosition]: (p: OutboundMessageMap[WsMessageName.ConfirmPosition]) =>
    isBool(p.confirmed),
  [WsMessageName.GetMissionsList]: (_p: OutboundMessageMap[WsMessageName.GetMissionsList]) => true,
  [WsMessageName.DeleteMission]: (p: OutboundMessageMap[WsMessageName.DeleteMission]) =>
    isString(p.mission_name) && p.mission_name.length > 0,
  [WsMessageName.SendXml]: (p: OutboundMessageMap[WsMessageName.SendXml]) =>
    typeof p.xml === "string" && p.xml.trim().length > 0,
  [WsMessageName.LoadMission]: (p: OutboundMessageMap[WsMessageName.LoadMission]) =>
    isString(p.mission_name) && p.mission_name.length > 0,
  [WsMessageName.LosRequest]: (p: OutboundMessageMap[WsMessageName.LosRequest]) =>
    isLatLng(p.pointA) && isLatLng(p.pointB),
  [WsMessageName.Ping]: (p: OutboundMessageMap[WsMessageName.Ping]) => isNumber(p.timestamp),
  [WsMessageName.SaveMission]: (p: OutboundMessageMap[WsMessageName.SaveMission]) => {
    if (!isString(p.mission_name) || p.mission_name.length === 0 || !isString(p.entities)) return false;
    try {
      const parsed = JSON.parse(p.entities);
      if (!Array.isArray(parsed)) return false;
      if (parsed.length === 0) return true;
      const first = parsed[0];
      return typeof first === "string" || (first != null && typeof first === "object");
    } catch {
      return false;
    }
  },
  [WsMessageName.SaveEntity]: (p: OutboundMessageMap[WsMessageName.SaveEntity]) =>
    isString(p.temp_id) &&
    p.temp_id.length > 0 &&
    isString(p.category) &&
    p.category.length > 0 &&
    isString(p.type) &&
    p.type.length > 0 &&
    Array.isArray(p.coordinates) &&
    isLatLngArray(p.coordinates) &&
    (p.alt === undefined || isNumberOrString(p.alt)) &&
    (p.params === undefined || isEntityParams(p.params)),
  [WsMessageName.UpdateEntity]: (p: OutboundMessageMap[WsMessageName.UpdateEntity]) =>
    isString(p.id) &&
    p.id.length > 0 &&
    isString(p.category) &&
    p.category.length > 0 &&
    isString(p.type) &&
    p.type.length > 0 &&
    Array.isArray(p.coordinates) &&
    isLatLngArray(p.coordinates) &&
    (p.alt === undefined || isNumberOrString(p.alt)) &&
    (p.params === undefined || isEntityParams(p.params)),
  [WsMessageName.SetPosition]: (p: OutboundMessageMap[WsMessageName.SetPosition]) =>
    isNumberOrString(p.lat) && isNumberOrString(p.lng) && isNumberOrString(p.alt),
  [WsMessageName.SetRadarParams]: (p: OutboundMessageMap[WsMessageName.SetRadarParams]) =>
    isNumberOrString(p.radar_mode) && isNumberOrString(p.mission_category) && isNumberOrString(p.freq_index),
  [WsMessageName.SetTabooZone]: (p: OutboundMessageMap[WsMessageName.SetTabooZone]) =>
    isNumber(p.start) && isNumber(p.end),
  [WsMessageName.SetTargetInfo]: (p: OutboundMessageMap[WsMessageName.SetTargetInfo]) =>
    isString(p.tgt_id) &&
    isBool(p.platform_override) &&
    isNumber(p.platform) &&
    isBool(p.identity_override) &&
    isNumber(p.identity) &&
    isBool(p.is_allowed_in_tera),
  [WsMessageName.SystemMode]: (p: OutboundMessageMap[WsMessageName.SystemMode]) =>
    isNumberOrString(p.system_mode),
  [WsMessageName.EntityDeleted]: (p: OutboundMessageMap[WsMessageName.EntityDeleted]) =>
    isString(p.entityId) && p.entityId.length > 0,
};

export const validateOutboundMessage = <T extends OutboundMessageName>(
  name: T,
  payload: OutboundMessageMap[T]
): boolean => {
  const validate = validators[name];
  if (!validate) return true;
  return validate(payload);
};
