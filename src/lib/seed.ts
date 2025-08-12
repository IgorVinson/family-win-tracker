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

  const makeMetric = (name: string, value: number, unit?: string) => ({
    id: crypto.randomUUID(),
    name,
    value,
    unit,
  });

  const kids = [
    {
      id: crypto.randomUUID(),
      name: "Alex",
      points: 15,
      goal: 50,
      color: hues[0],
      createdAt: now,
      notes: "Loves reading mystery books.",
      metrics: [
        makeMetric("Reading", 30, "min"),
        makeMetric("Chores", 2),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Sam",
      points: 22,
      goal: 40,
      color: hues[1],
      createdAt: now,
      notes: "Great helper with dishes.",
      metrics: [
        makeMetric("Practice Piano", 20, "min"),
        makeMetric("Chores", 3),
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Mia",
      points: 5,
      goal: 30,
      color: hues[2],
      createdAt: now,
      notes: "Working on kindness stars.",
      metrics: [
        makeMetric("Kindness Stars", 1),
        makeMetric("Reading", 10, "min"),
      ],
    },
  ];

  try {
    window.localStorage.setItem("family-kids", JSON.stringify(kids));
  } catch (_) {}
}
