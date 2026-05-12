export enum GeneralStatusE {
    OK,
    WARNING,
    FAIL,
    NO_COME,
    STBY
}

export enum EnableE {
    ENABLED,
    DISABLED
}

export enum OffOnE {
    OFF = "OFF",
    ON = "ON"
}

export enum ErrorStateE {
    EXISTS,
    VANISHED,
    REPEATED,
    NOT_EXIST
}

export enum ErrorSeverityE {
    WARNING,
    INTERMEDIATE,
    SEVERE,
}

export enum SelectedModeE {
    Mission = 0,
    Planning = 1,
    Training = 2,
    /** מסך תחזוקה (INS / Gun / Radar) — ללא מפה מבצעית */
    Maintenance = 3,
}

export enum SystemModeE {
    AUTO,
    SEMI_AUTO,
    MANUAL
}

export enum BooleanE {
    TRUE,
    FALSE
}

export enum CaliModeE {
    YES,
    NO,
    NA
}

export enum PosTypeE {
    Manual,
    TMAPS,
    GPS
}
