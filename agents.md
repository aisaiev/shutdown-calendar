## Project Overview
This project focuses on providing electricity outage schedules for Ukraine using the Yasno API https://yasno.ua. Schedules provided in ics calendar format.

## Features
- Fetch electricity outage schedules from the Yasno API periodically.
- Convert the fetched schedules into ics calendar format.
- Store the converted schedule files by group.

## Yasno API
- Regions: `https://app.yasno.ua/api/blackout-service/public/shutdowns/addresses/v2/regions`
- Planned Outages:
  - Path: `https://app.yasno.ua/api/blackout-service/public/shutdowns/regions/{region_id}/dsos/{dso_id}/planned-outages`
  - Example: `https://app.yasno.ua/api/blackout-service/public/shutdowns/regions/25/dsos/902/planned-outages`

For now only region_id=25 and dso_id=902 is supported.

### API Response
Planned Outages example response:

```json
{
  "1.1": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 150,
          "type": "NotPlanned"
        },
        {
          "start": 150,
          "end": 390,
          "type": "Definite"
        },
        {
          "start": 390,
          "end": 780,
          "type": "NotPlanned"
        },
        {
          "start": 780,
          "end": 1020,
          "type": "Definite"
        },
        {
          "start": 1020,
          "end": 1410,
          "type": "NotPlanned"
        },
        {
          "start": 1410,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "1.2": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 150,
          "type": "NotPlanned"
        },
        {
          "start": 150,
          "end": 390,
          "type": "Definite"
        },
        {
          "start": 390,
          "end": 780,
          "type": "NotPlanned"
        },
        {
          "start": 780,
          "end": 1020,
          "type": "Definite"
        },
        {
          "start": 1020,
          "end": 1410,
          "type": "NotPlanned"
        },
        {
          "start": 1410,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "2.1": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 150,
          "type": "NotPlanned"
        },
        {
          "start": 150,
          "end": 390,
          "type": "Definite"
        },
        {
          "start": 390,
          "end": 780,
          "type": "NotPlanned"
        },
        {
          "start": 780,
          "end": 1020,
          "type": "Definite"
        },
        {
          "start": 1020,
          "end": 1410,
          "type": "NotPlanned"
        },
        {
          "start": 1410,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "2.2": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 150,
          "type": "NotPlanned"
        },
        {
          "start": 150,
          "end": 390,
          "type": "Definite"
        },
        {
          "start": 390,
          "end": 780,
          "type": "NotPlanned"
        },
        {
          "start": 780,
          "end": 1020,
          "type": "Definite"
        },
        {
          "start": 1020,
          "end": 1410,
          "type": "NotPlanned"
        },
        {
          "start": 1410,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "3.1": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 360,
          "type": "NotPlanned"
        },
        {
          "start": 360,
          "end": 600,
          "type": "Definite"
        },
        {
          "start": 600,
          "end": 990,
          "type": "NotPlanned"
        },
        {
          "start": 990,
          "end": 1230,
          "type": "Definite"
        },
        {
          "start": 1230,
          "end": 1440,
          "type": "NotPlanned"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "3.2": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 360,
          "type": "NotPlanned"
        },
        {
          "start": 360,
          "end": 600,
          "type": "Definite"
        },
        {
          "start": 600,
          "end": 990,
          "type": "NotPlanned"
        },
        {
          "start": 990,
          "end": 1230,
          "type": "Definite"
        },
        {
          "start": 1230,
          "end": 1440,
          "type": "NotPlanned"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "4.1": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 360,
          "type": "NotPlanned"
        },
        {
          "start": 360,
          "end": 600,
          "type": "Definite"
        },
        {
          "start": 600,
          "end": 990,
          "type": "NotPlanned"
        },
        {
          "start": 990,
          "end": 1230,
          "type": "Definite"
        },
        {
          "start": 1230,
          "end": 1440,
          "type": "NotPlanned"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "4.2": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 360,
          "type": "NotPlanned"
        },
        {
          "start": 360,
          "end": 600,
          "type": "Definite"
        },
        {
          "start": 600,
          "end": 990,
          "type": "NotPlanned"
        },
        {
          "start": 990,
          "end": 1230,
          "type": "Definite"
        },
        {
          "start": 1230,
          "end": 1440,
          "type": "NotPlanned"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "5.1": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 180,
          "type": "Definite"
        },
        {
          "start": 180,
          "end": 570,
          "type": "NotPlanned"
        },
        {
          "start": 570,
          "end": 810,
          "type": "Definite"
        },
        {
          "start": 810,
          "end": 1200,
          "type": "NotPlanned"
        },
        {
          "start": 1200,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "5.2": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 180,
          "type": "Definite"
        },
        {
          "start": 180,
          "end": 570,
          "type": "NotPlanned"
        },
        {
          "start": 570,
          "end": 810,
          "type": "Definite"
        },
        {
          "start": 810,
          "end": 1200,
          "type": "NotPlanned"
        },
        {
          "start": 1200,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "6.1": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 180,
          "type": "Definite"
        },
        {
          "start": 180,
          "end": 570,
          "type": "NotPlanned"
        },
        {
          "start": 570,
          "end": 810,
          "type": "Definite"
        },
        {
          "start": 810,
          "end": 1200,
          "type": "NotPlanned"
        },
        {
          "start": 1200,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  },
  "6.2": {
    "today": {
      "slots": [
        {
          "start": 0,
          "end": 180,
          "type": "Definite"
        },
        {
          "start": 180,
          "end": 570,
          "type": "NotPlanned"
        },
        {
          "start": 570,
          "end": 810,
          "type": "Definite"
        },
        {
          "start": 810,
          "end": 1200,
          "type": "NotPlanned"
        },
        {
          "start": 1200,
          "end": 1440,
          "type": "Definite"
        }
      ],
      "date": "2025-11-12T00:00:00+02:00",
      "status": "ScheduleApplies"
    },
    "tomorrow": {
      "slots": [],
      "date": "2025-11-13T00:00:00+02:00",
      "status": "WaitingForSchedule"
    },
    "updatedOn": "2025-11-11T19:00:50+00:00"
  }
}
```

#### Groups
Each group is coded as two digins `x.y`, `x` means group, `y` means subgroup. In planned outages each group have two properties `today` and `tomorrow`, describing time slots for outages.

#### Slots
Slots describe events. `start` and `end` are minutes in a day (from 0 to 1440). Slots can have these types:

- `NotPlaned` - no outages planned. Do not create any events from this type of slot.
- `Definite` - outage event. Event should be created for this time. This event should use date from `date` property.

#### Updated on
`updatedOn` property reflects when the schedule was updated by service provider (not the last time intergation fetched the data). There should be a sensor in `sensor.py` reflecting this value.

#### Status
Status property describes the type of the events and how to deal with them. There should be a sensor in `sensor.py` with corresponding status for `today`.
Here are types of statuses:
- `ScheduleApplies` - slots are applied. Events should be added to the calendar.
- `WaitingForSchedule` - slots are up for a changes. Created events, but they may be changed.
- `EmergencyShutdowns` - slots should be displayed in the calendar, but they are not active. Emmergency is happening.