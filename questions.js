const TASKS = [
  // =========================================================
  // PART 1 – New Zealand Timbers (11 marks)
  // =========================================================
  {
    id: "bcats-24355-materials-part1",
    name: "US 24355 Demonstrate knowledge of construction materials – Part 1: New Zealand Timbers",
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
        hint: "One reddish-brown (R……), one pale golden from ancient swamps (K……).",
        modelAnswer: "Rimu and Kauri (also accept Totara, Puriri or Matai in some cases)."
      },
      {
        id: "q3",
        text: "Name an imported timber that can be used for decking and outdoor furniture.",
        type: "short",
        maxPoints: 2,
        hint: "Dense, oily, reddish hardwood from Southeast Asia – sold here as Kwila or Merbau.",
        modelAnswer: "Kwila (also known as Merbau)."
      },
      {
        id: "q4",
        text: "List 3 types of timber that are commonly used for woodturning.",
        type: "short",
        maxPoints: 3,
        hint: "Think native timbers with beautiful figure – ancient swamp wood, honey-coloured, etc.",
        modelAnswer: "Common choices: Kauri, Matai, Rewarewa, Rimu, Puriri, Totara."
      }
    ]
  },

  // =========================================================
  // PART 2 – Manufactured Boards & Plastics (9 marks)
  // =========================================================
  {
    id: "bcats-24355-materials-part2",
    name: "US 24355 Demonstrate knowledge of construction materials – Part 2: Manufactured Boards & Plastics",
    totalPoints: 9,
    questions: [
      {
        id: "q5",
        text: "Describe the effects of moisture on MDF.",
        type: "long",
        maxPoints: 3,
        hint: "What happens if water soaks into the edge of an MDF board?",
        modelAnswer: "MDF swells badly (especially edges), fibres break apart, it becomes soft and loses strength permanently. Must be sealed or kept dry."
      },
      {
        id: "q6",
        text: "Name a lightweight expanded plastic used for insulation in houses and buoyancy in boats.",
        type: "short",
        maxPoints: 2,
        hint: "White beady foam – bean-bag filling or under-floor insulation.",
        modelAnswer: "Expanded polystyrene (EPS) or extruded polystyrene (XPS)."
      },
      {
        id: "q9",
        text: "List a hard, transparent material that can be noise-resistant, curved, and even bulletproof.",
        type: "short",
        maxPoints: 2,
        hint: "Clear plastic used for bus shelters and riot shields.",
        modelAnswer: "Polycarbonate (Lexan, Makrolon, etc.)."
      },
      {
        id: "q10",
        text: "Name the plastic sheet material commonly used as a waterproof membrane under concrete.",
        type: "short",
        maxPoints: 2,
        hint: "Black or clear 0.25 mm polythene under house slabs – often called DPM.",
        modelAnswer: "Polythene / polyethylene sheet (Damp-Proof Membrane or DPM)."
      }
    ]
  },

  // =========================================================
  // PART 3 – Metals & Concrete (5 marks)
  // =========================================================
  {
    id: "bcats-24355-materials-part3",
    name: "US 24355 Demonstrate knowledge of construction materials – Part 3: Metals & Concrete",
    totalPoints: 5,
    questions: [
      {
        id: "q7",
        text: "Name a commonly used metal that can be easily joined by welding.",
        type: "short",
        maxPoints: 2,
        hint: "Everyday workshop structural metal – low-carbon type.",
        modelAnswer: "Mild steel (low-carbon steel)."
      },
      {
        id: "q11",
        text: "What are the 3 main materials that make up concrete?",
        type: "short",
        maxPoints: 3,
        hint: "Cement + water + the gritty stuff.",
        modelAnswer: "Portland cement, water, and aggregate (sand + gravel/crushed stone)."
      }
    ]
  },

  // =========================================================
  // PART 4 – Paint Finishes (5 marks)
  // =========================================================
  {
    id: "bcats-24355-materials-part4",
    name: "US 24355 Demonstrate knowledge of construction materials – Part 4: Paint Finishes",
    totalPoints: 5,
    questions: [
      {
        id: "q12",
        text: "What is the function of a primer coat when painting?",
        type: "long",
        maxPoints: 2,
        hint: "It seals the surface and helps top coats stick.",
        modelAnswer: "Primer seals porous surfaces, provides good adhesion for top coats, and can prevent rust or staining."
      },
      {
        id: "q13",
        text: "Identify 3 methods commonly used to apply a paint finish.",
        type: "short",
        maxPoints: 3,
        hint: "Bristles, fluffy cylinder, and compressed-air method.",
        modelAnswer: "Brush, roller, and spray (airless/HVLP/conventional)."
      }
    ]
  },

  // =========================================================
  // PART 5 – Polishes & Varnishes (7 marks)
  // =========================================================
  {
    id: "bcats-24355-materials-part5",
    name: "US 24355 Demonstrate knowledge of construction materials – Part 5: Polishes & Varnishes",
    totalPoints: 7,
    questions: [
      {
        id: "q14",
        text: "Name 2 types of polishes and state an advantage polish has over oil finishes.",
        type: "long",
        maxPoints: 3,
        hint: "Traditional examples: wax and French polish (shellac).",
        modelAnswer: "Wax polish and French polish (shellac). Advantage: builds a harder, more protective, glossy film that resists water rings and scratches better than oil."
      },
      {
        id: "q15",
        text: "Name 2 types of varnishes, briefly stating an advantage of each.",
        type: "long",
        maxPoints: 4,
        hint: "One is super tough (gym floors), one is fast-drying and low odour.",
        modelAnswer: "Polyurethane varnish – extremely durable/scratch-resistant. Water-based acrylic varnish – fast drying, low odour, non-yellowing, easy clean-up."
      }
    ]
  }
];

// Test it loads (remove this line in your real code if you want)
console.log("All 5 parts loaded successfully!", TASKS.length + " parts");
