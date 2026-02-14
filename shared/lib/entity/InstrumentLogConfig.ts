import type { InstrumentType } from "./Instrument";
import type { InstrumentLogEventType } from "./InstrumentLog";

const commonMaintenance = ["Cleaning", "Firmware update", "Repair", "Other"];
const commonChecks = ["Other"];

export const eventDetails: Partial<Record<InstrumentType, Partial<Record<InstrumentLogEventType, string[]>>>> = {
  "radar": {
    check: ["Rain comparison", "Radome condition", "Temperatures", ...commonChecks],
    maintenance: ["Radome change", "Cleaning of antenna drain", ...commonMaintenance],
    calibration: ["LN2 calibration", "Clear sky technique", "Solar pointing calibration", "Other"],
  },
  "mwr": {
    check: ["Radome quality", "Blower", "Heater", ...commonChecks],
    maintenance: ["Radome change", "Foam inlet installation", ...commonMaintenance],
    calibration: ["LN2 calibration", "Other"],
  },
  "lidar": {
    check: ["NTP status", "Window condensation", "Blower", ...commonChecks],
    maintenance: ["Drying agent renewal", "Window cleaning", "Transmitter replacement", ...commonMaintenance],
    calibration: ["Hat calibration", "Other"],
  },
  "doppler-lidar": {
    check: ["Scanner operation", "Internal humidity", "Levelling", "Azimuth pointing", ...commonChecks],
    maintenance: ["Desiccant replacement", ...commonMaintenance],
  },
  "disdrometer": {
    check: ["Laser status", "Beam orientation", "Horizontality", ...commonChecks],
    maintenance: [...commonMaintenance],
  },
  "weather-station": {
    check: [...commonChecks],
    maintenance: ["Wind-speed sensor cleaning", ...commonMaintenance],
  },
  "rain-gauge": {
    check: ["Horizontality", ...commonChecks],
    maintenance: [...commonMaintenance],
  },
};

export const timeRangeDetails = new Set(["Hat calibration"]);

export const resultOptions: Partial<Record<InstrumentLogEventType, string[]>> = {
  check: ["OK", "Fail"],
};

export const notesRequiredEvents = new Set<InstrumentLogEventType>(["note"]);
export const notesRequiredDetails = new Set(["Other"]);
export const notesRequiredResults = new Set(["Fail"]);
