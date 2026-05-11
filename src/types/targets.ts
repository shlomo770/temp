/**
 * TARGETS (Periodic) – מבנה ההודעה בדיוק לפי המפרט.
 *
 * Field                  | Description                              | Unit   | Size    | Type
 * -----------------------|------------------------------------------|--------|---------|--------
 * WCS_Target_Number      | Target identifier                        | —      | 2 Bytes | integer
 * Target_Classification | Target type                              | enum   | 1 Byte  | TARGET_CLASSIFICATION_E
 * Latitude               | Target latitude                          | deg    | 4 Bytes | float
 * Longitude              | Target longitude                         | deg    | 4 Bytes | float
 * Altitude               | Target altitude                          | m      | 4 Bytes | float
 * Velocity_North         | Velocity in NEA frame (North)             | m/sec  | 4 Bytes | integer
 * Velocity_East          | Velocity in NEA frame (East)              | m/sec  | 4 Bytes | integer
 * Velocity_Vup           | Velocity in NEA frame (Vertical Up)       | m/sec  | 4 Bytes | integer
 * Time_Tag               | Time tag                                 | msec   | 4 Bytes | integer
 * Flight_Mode            | Interceptor PX flight mode               | enum   | 1 Byte  | integer
 * Ellipsis_A             | UZ vertical maximum search length        | —      | —       | —
 * Ellipsis_C             | Horizontal distance of UZ ellipsoid      | —      | —       | —
 */

/** מבנה גולמי של הודעת TARGETS (Periodic) – שמות שדות כמו במפרט */
export interface TARGETS_Periodic_Message {
  WCS_Target_Number: number;
  Target_Classification: number;
  Latitude: number;
  Longitude: number;
  Altitude: number;
  Velocity_North: number;
  Velocity_East: number;
  Velocity_Vup: number;
  Time_Tag: number;
  Flight_Mode: number;
  Ellipsis_A?: number;
  Ellipsis_C?: number;
}

/** TARGET_CLASSIFICATION_E מהמפרט */
export enum TARGET_CLASSIFICATION_E {
  HUMAN = 0,
  VEHICLE = 1,
  AIRPLANE = 2,
  HELICOPTER = 3,
  DRONE = 4,
  QUADCOPTER = 5,
  FIGHTER = 6,
}

/** מיפוי סיווג מטרה (מההודעה) למחרוזת type לתצוגה במפה/UI */
export const TARGET_CLASSIFICATION_TO_TYPE: Record<number, string> = {
  [TARGET_CLASSIFICATION_E.HUMAN]: 'human',
  [TARGET_CLASSIFICATION_E.VEHICLE]: 'vehicle',
  [TARGET_CLASSIFICATION_E.AIRPLANE]: 'airplane',
  [TARGET_CLASSIFICATION_E.HELICOPTER]: 'helicopter',
  [TARGET_CLASSIFICATION_E.DRONE]: 'drone',
  [TARGET_CLASSIFICATION_E.QUADCOPTER]: 'quadcopter',
  [TARGET_CLASSIFICATION_E.FIGHTER]: 'fighter',
};
