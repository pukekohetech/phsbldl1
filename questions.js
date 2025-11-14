const TASKS = [
  // ═══════════════════════════════════════════════════════════
  // PART 1 – New Zealand Timbers
  // ═══════════════════════════════════════════════════════════
  {
    id: "bcats-24355-materials-part1",
    name: "US 24355 – Demonstrate knowledge of construction materials – Part 1: New Zealand Timbers",
    totalPoints: 11,
    instructions: "Answer all questions in this part.",
    questions: [
      {
        id: "q1",
        text: "What is the most common exotic timber that is grown in plantations in New Zealand?",
        type: "short",
        maxPoints: 2,
        hint: "Fast-growing softwood planted by the millions since the 1930s – the word 'pine' is in the name.",
        modelAnswer: "Radiata pine (Pinus radiata) is by far the most common plantation timber in New Zealand."
      },
      {
        id: "q2",
        text: "Name 2 types of New Zealand native timbers that can be used for high-quality furniture.",
        type: "short",
        maxPoints: 2,
        hint: "One is a reddish-brown wood loved for its figure (R……), the other is the famous pale golden swamp timber (K……).",
        modelAnswer: "Rimu and Kauri are the two classic native timbers used for high-quality furniture (also accept Totara, Puriri or Matai in some cases)."
      },
      {
        id: "q3",
        text: "Name an imported timber that can be used for decking and outdoor furniture.",
        type: "short",
        maxPoints: 2,
        hint: "Dense, oily, reddish Southeast-Asian hardwood – sold here as Kwila or Merbau.",
        modelAnswer: "Kwila (Merbau) is a very popular imported hardwood for decks and outdoor furniture because it is naturally durable (Class 1 durability)."
      },
      {
        id: "q4",
        text: "List 3 types of timber that are commonly used for woodturning.",
        type: "short",
        maxPoints: 3,
        hint: "Woodturners love native timbers with interesting grain – ancient Kauri, honey-coloured Rewarewa, etc.",
        modelAnswer: "Common woodturning timbers include Kauri, Matai, Rewarewa, Rimu, Puriri, Totara, and sometimes exotic timbers like Macrocarpa."
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART 2 – Manufactured Boards & Plastics
  // ═══════════════════════════════════════════════════════════
  {
    id: "bcats-24355-materials-part2",
    name: "US 24355 – Demonstrate knowledge of construction materials – Part 2: Manufactured Boards & Plastics",
    totalPoints: 9,
    questions: [
      {
        id: "q5",
        text: "Describe the effects of moisture on MDF.",
        type: "long",
        maxPoints: 3,
        hint: "Think about what happens if water soaks into the edge of an MDF board left outside.",
        modelAnswer: "Moisture causes MDF to swell badly (especially on edges), the fibres break apart, it becomes soft and soggy, and permanently loses strength. This is why MDF must always be sealed or kept indoors."
      },
      {
        id: "q6",
        text: "Name a lightweight expanded plastic that is used for insulation in houses as well as for buoyancy in boats.",
        type: "short",
        maxPoints: 2,
        hint: "White beady foam – think bean-bag filling or under-floor insulation sheets.",
        modelAnswer: "Expanded polystyrene (EPS) or extruded polystyrene (XPS)."
      },
      {
        id: "q9",
        text: "List a hard, transparent material that can be manufactured to be noise-resistant, flat or curved, polished or textured surface and even bulletproof.",
        type: "short",
        maxPoints: 2,
        hint: "Clear plastic used for bus shelters, machine guards, and riot shields.",
        modelAnswer: "Polycarbonate (brand names Lexan, Makrolon, etc.)."
      },
      {
        id: "q10",
        text: "Name the plastic sheet material that is commonly used as a waterproof membrane under concrete.",
        type: "short",
        maxPoints: 2,
        hint: "Black or clear 0.25 mm polythene rolled out under house slabs – often called DPM.",
        modelAnswer: "Polythene (polyethylene) sheet / Damp-proof membrane (DPM)."
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART 3 – Metals & Concrete
  // ═══════════════════════════════════════════════════════════
  {
    id: "bcats-24355-materials-part3",
    name: "US 24355 – Demonstrate knowledge of construction materials – Part 3: Metals & Concrete",
    totalPoints: 5,
    questions: [
      {
        id: "q7",
        text: "Name a commonly used metal that can be easily joined by welding.",
        type: "short",
        maxPoints: 2,
        hint: "The everyday structural metal used in school workshops – low-carbon type.",
        modelAnswer: "Mild steel (also called low-carbon steel)."
      },
      {
        id: "q11",
        text: "What are the 3 main materials that make up concrete?",
        type: "short",
        maxPoints: 3,
        hint: "Cement + water + the gritty stuff.",
        modelAnswer: "Portland cement, clean water, and aggregate (sand + gravel or crushed stone)."
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART 4 – Surface Finishes: Paint
  // ═══════════════════════════════════════════════════════════
  {
    id: "bcats-24355-materials-part4",
    name: "US 24355 – Demonstrate knowledge of construction materials – Part 4: Paint Finishes",
    totalPoints: 5,
    questions: [
      {
        id: "q12",
        text: "What is the function of a primer coat when painting?",
        type: "long",
        maxPoints: 2,
        hint: "It seals the surface and helps the top coats stick properly.",
        modelAnswer: "Primer seals porous materials, prevents paint soaking in unevenly, provides a good bonding surface for the top coats, and can stop rust or staining."
      },
      {
        id: "q13",
        text: "Identify 3 methods that are commonly used to apply a paint finish.",
        type: "short",
        maxPoints: 3,
        hint: "One uses bristles, one uses a fluffy cylinder, one uses compressed air or a pump.",
        modelAnswer: "Brush, roller, and spray (airless, HVLP, or conventional spray)."
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART 5 – Surface Finishes: Polishes & Varnishes
  // ═══════════════════════════════════════════════════════════
  {
    id: "bcats-24355-materials-part5",
    name: "US 24355 – Demonstrate knowledge of construction materials – Part 5: Polishes & Varnishes",
    totalPoints: 7,
    questions: [
      {
        id: "q14",
        text: "Name 2 types of polishes and state an advantage that polish has over oil finishes.",
        type: "long",
        maxPoints: 3,
        hint: "Wax and French polish are traditional examples. They give a harder, shinier surface than oil.",
        modelAnswer: "Examples: wax polish and French polish (shellac). Advantage over oil: polish builds a harder, more protective film that resists water rings and gives a high-gloss finish."
      },
      {
        id: "q15",
        text: "Name 2 types of varnishes, briefly stating an advantage of each one.",
        type: "long",
        maxPoints: 4,
        hint: "One is super tough (used on gym floors), the other dries fast and doesn’t smell much.",
        modelAnswer: "Polyurethane varnish – extremely durable and scratch-resistant. Water-based acrylic varnish – fast drying, low odour, clear (doesn’t yellow), easy water clean-up."
      }
    ]
  }
];
