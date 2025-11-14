const TASKS = [
  {
    id: "bcats-24355-materials",
    name: "US 24355 – Demonstrate knowledge of construction materials",
    totalPoints: 37,
    instructions: "Answer all questions. Use full sentences where required.",
    blocks: [
      {
        blockNumber: 1,
        title: "New Zealand Timbers",
        questions: [
          {
            id: "q1",
            text: "What is the most common exotic timber that is grown in plantations in New Zealand?",
            type: "short",
            maxPoints: 2,
            hint: "It’s a fast-growing softwood with the word 'pine' in its name, widely planted since the 20th century.",
            modelAnswer: "Radiata pine (also called Pinus radiata) is the most common exotic timber grown in plantations in New Zealand."
          },
          {
            id: "q2",
            text: "Name 2 types of New Zealand native timbers that can be used for high-quality furniture.",
            type: "short",
            maxPoints: 2,
            hint: "Think of two beautiful, durable native woods that were historically popular for furniture – one starts with R, the other with K.",
            modelAnswer: "Rimu and Kauri (other acceptable native timbers sometimes used include Totara, Matai or Puriri, but Rimu and Kaea are the classic high-quality furniture choices)."
          },
          {
            id: "q3",
            text: "Name an imported timber that can be used for decking and outdoor furniture.",
            type: "short",
            maxPoints: 2,
            hint: "A very dense, reddish-brown hardwood from Southeast Asia, often sold as Kwila or Merbau.",
            modelAnswer: "Kwila (also known as Merbau) is a popular imported hardwood used for decking and outdoor furniture because of its natural durability and resistance to rot."
          },
          {
            id: "q4",
            text: "List 3 types of timber that are commonly used for woodturning.",
            type: "short",
            maxPoints: 3,
            hint: "Woodturners love native timbers with interesting grain or colour – think of trees that were once swamp-dwelling or have honey-coloured wood.",
            modelAnswer: "Common timbers for woodturning include Kauri, Matai, Rewarewa, Rimu, Puriri, and sometimes exotic timbers like Macrocarpa or American Black Walnut."
          }
        ]
      },

      {
        blockNumber: 2,
        title: "Manufactured Boards & Plastics",
        questions: [
          {
            id: "q5",
            text: "Describe the effects of moisture on MDF.",
            type: "long",
            maxPoints: 3,
            hint: "What happens when water gets into the edges or face of MDF? Think about swelling and strength.",
            modelAnswer: "When MDF gets wet it swells dramatically (especially at the edges), the fibres break down and separate, and the board becomes soft, weak, and loses its structural strength. This is why MDF must be sealed or kept dry."
          },
          {
            id: "q6",
            text: "Name a lightweight expanded plastic that is used for insulation in houses as well as for buoyancy in boats.",
            type: "short",
            maxPoints: 2,
            hint: "White, bead-like foam often seen in bean bags or building underfloor insulation – commonly abbreviated EPS.",
            modelAnswer: "Expanded polystyrene (EPS) or extruded polystyrene (XPS) – both are lightweight, closed-cell foams used for thermal insulation and flotation."
          },
          {
            id: "q9",
            text: "List a hard, transparent material that can be manufactured to be noise-resistant, flat or curved, polished or textured surface and even bulletproof.",
            type: "short",
            maxPoints: 2,
            hint: "A clear plastic much stronger than glass – often used for safety shields or riot gear.",
            modelAnswer: "Polycarbonate (e.g., Lexan) is a tough, transparent thermoplastic that can be made bulletproof, sound-reducing, and shaped in many ways."
          },
          {
            id: "q10",
            text: "Name the plastic sheet material that is commonly used as a waterproof membrane under concrete.",
            type: "short",
            maxPoints: 2,
            hint: "Black or clear polythene sheeting laid under floor slabs – often called DPM.",
            modelAnswer: "Polythene (polyethylene) sheet, also known as Damp-Proof Membrane (DPM) or building paper/underlay."
          }
        ]
      },

      {
        blockNumber: 3,
        title: "Metals & Concrete",
        questions: [
          {
            id: "q7",
            text: "Name a commonly used metal that can be easily joined by welding.",
            type: "short",
            maxPoints: 2,
            hint: "The most common structural metal in schools and general fabrication – low carbon version.",
            modelAnswer: "Mild steel (low-carbon steel) is the most commonly welded metal because it has good weldability and is inexpensive."
          },
          {
            id: "q11",
            text: "What are the 3 main materials that make up concrete?",
            type: "short",
            maxPoints: 3,
            hint: "Cement + water + … (the stony stuff).",
            modelAnswer: "The three main ingredients of concrete are Portland cement, water, and aggregate (which includes both sand and gravel/stones)."
          }
        ]
      },

      {
        blockNumber: 4,
        title: "Surface Finishes – Paint",
        questions: [
          {
            id: "q12",
            text: "What is the function of a primer coat when painting?",
            type: "long",
            maxPoints: 2,
            hint: "Primer does two main jobs: sealing the surface and helping the top coats stick.",
            modelAnswer: "A primer seals porous surfaces (stops the paint soaking in too much), provides a key for better adhesion of the top coats, and can also help prevent rust or tannin bleed."
          },
          {
            id: "q13",
            text: "Identify 3 methods that are commonly used to apply a paint finish.",
            type: "short",
            maxPoints: 3,
            hint: "Brush, roller, and one that needs a compressor or spray gun.",
            modelAnswer: "Common paint application methods are brushing, rolling, and spraying (airless or HVLP)."
          }
        ]
      },

      {
        blockNumber: 5,
        title: "Surface Finishes – Polishes & Varnishes",
        questions: [
          {
            id: "q14",
            text: "Name 2 types of polishes and state an advantage that polish has over oil finishes.",
            type: "long",
            maxPoints: 3,
            hint: "Traditional polishes include wax and shellac-based ones. They give a harder, glossier surface than oil.",
            modelAnswer: "Two common polishes are wax polish and French polish (shellac). An advantage of polish over oil finishes is that it builds a harder, more protective film that gives a high-gloss look and better resistance to water marks and scratches."
          },
          {
            id: "q15",
            text: "Name 2 types of varnishes, briefly stating an advantage of each one.",
            type: "long",
            maxPoints: 4,
            hint: "One is extremely tough and used on floors, the other can be water-based and low odour.",
            modelAnswer: "Polyurethane varnish – advantage: very tough and durable, excellent for high-wear areas like floors. Water-based (acrylic) varnish – advantage: fast drying, low odour, non-yellowing, and easier clean-up than oil-based varnishes."
          }
        ]
      }
    ]
  }
];
