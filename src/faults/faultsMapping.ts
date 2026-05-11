import { ErrorSeverityE, ErrorStateE } from "../enums/general.enum";

export type DeviceSnapshot = {
  items: {
    code: number;
    description: string;
    severity: ErrorSeverityE;
    state: ErrorStateE;
    category: string;
  }[];
};

export function mapPayloadToSnapshot(
  device: string,
  bits: any,
): DeviceSnapshot {

  return {
    items: bits.map((b: { code: any; description: any; severity: any; state: any; }) => {
      return {
        code: b.code,
        description: b.description,
        severity: b.severity,
        state: b.state,
        category: device,
      };
    })
  };
}