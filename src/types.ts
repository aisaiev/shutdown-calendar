export interface OutageSlot {
  start: number; // minutes from start of day (0-1440)
  end: number; // minutes from start of day (0-1440)
  type: 'NotPlanned' | 'Definite' | 'Possible';
}

export interface DaySchedule {
  slots: OutageSlot[];
  date: string; // ISO date string
  status: 'ScheduleApplies' | 'WaitingForSchedule' | 'EmergencyShutdowns';
}

export interface GroupSchedule {
  today: DaySchedule;
  tomorrow: DaySchedule;
  updatedOn: string; // ISO date string
}

export interface PlannedOutagesResponse {
  [group: string]: GroupSchedule; // group format: "x.y"
}

export interface CalendarEvent {
  group: string;
  start: Date;
  end: Date;
  date: string;
  status: string;
}
