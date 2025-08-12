// Utility to seed mock kids data into localStorage on first load
// Keeps it minimal and only seeds if the `family-kids` key is missing or empty

export function seedMockDataIfEmpty() {
  try {
    const raw = window.localStorage.getItem("family-kids");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return; // already has data
    }
  } catch (_) {
    // if parsing fails, we'll overwrite with seed
  }

  const now = new Date().toISOString();
  const hues = [
    "262 83% 58%", // purple
    "200 90% 45%", // blue
    "28 92% 54%",  // orange
  ];

const makeMetric = (name: string, value: number, unit?: string, groupId?: string) => ({
  id: crypto.randomUUID(),
  name,
  value,
  unit,
  groupId,
});

const kids = [
  (() => {
    const g1 = { id: crypto.randomUUID(), name: "Reading Goals", type: "goal" as const };
    const g2 = { id: crypto.randomUUID(), name: "Chores Project", type: "project" as const };
    const m1 = makeMetric("Reading", 30, "min", g1.id);
    const m2 = makeMetric("Chores", 2, undefined, g2.id);
    const reports = [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        createdAt: now,
        notes: "Great reading session and light chores.",
        entries: [
          { metricId: m1.id, value: 25 },
          { metricId: m2.id, value: 1 },
        ],
      },
    ];
    return {
      id: crypto.randomUUID(),
      name: "Alex",
      points: 15,
      goal: 50,
      color: hues[0],
      createdAt: now,
      notes: "Loves reading mystery books.",
      groups: [g1, g2],
      metrics: [m1, m2],
      reports,
    };
  })(),
  (() => {
    const g1 = { id: crypto.randomUUID(), name: "Practice", type: "project" as const };
    const g2 = { id: crypto.randomUUID(), name: "Goals", type: "goal" as const };
    const m1 = makeMetric("Practice Piano", 20, "min", g1.id);
    const m2 = makeMetric("Chores", 3, undefined, g2.id);
    const reports = [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        createdAt: now,
        notes: "Solid practice and helpful chores.",
        entries: [
          { metricId: m1.id, value: 30 },
          { metricId: m2.id, value: 2 },
        ],
      },
    ];
    return {
      id: crypto.randomUUID(),
      name: "Sam",
      points: 22,
      goal: 40,
      color: hues[1],
      createdAt: now,
      notes: "Great helper with dishes.",
      groups: [g1, g2],
      metrics: [m1, m2],
      reports,
    };
  })(),
  (() => {
    const g1 = { id: crypto.randomUUID(), name: "Kindness", type: "goal" as const };
    const m1 = makeMetric("Kindness Stars", 1, undefined, g1.id);
    const m2 = makeMetric("Reading", 10, "min");
    const reports = [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        createdAt: now,
        notes: "Kind gestures and a bit of reading.",
        entries: [
          { metricId: m1.id, value: 2 },
          { metricId: m2.id, value: 15 },
        ],
      },
    ];
    return {
      id: crypto.randomUUID(),
      name: "Mia",
      points: 5,
      goal: 30,
      color: hues[2],
      createdAt: now,
      notes: "Working on kindness stars.",
      groups: [g1],
      metrics: [m1, m2],
      reports,
    };
  })(),
];

  try {
    window.localStorage.setItem("family-kids", JSON.stringify(kids));
  } catch (_) {}
}
