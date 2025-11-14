const TEACHERS = [
  { id: "ms-smith", name: "Ms. Smith", email: "smith@school.edu" },
  { id: "mr-jones", name: "Mr. Jones", email: "jones@school.edu" },
  { id: "dr-lee", name: "Dr. Lee", email: "lee@school.edu" }
];

const TASKS = [
  {
    id: "bcats-24355-materials",
    name: "24355 Materials Self-reflection",
    totalPoints: 37,
    questions: [
      {id:"q1",text:"What is the most common exotic timber that is grown in plantations in New Zealand?",type:"short",maxPoints:2,rubric:[{points:2,check:/radiata\s+pine/i,hint:"Answer: Radiata pine"}]},
      {id:"q2",text:"Name 2 types of New Zealand native timbers that can be used for high-quality furniture.",type:"short",maxPoints:2,rubric:[{points:1,check:/rimu/i,hint:"Include Rimu as one native timber."},{points:1,check:/kauri/i,hint:"Include Kauri as one native timber."}]},
      {id:"q3",text:"Name an imported timber that can be used for decking and outdoor furniture.",type:"short",maxPoints:2,rubric:[{points:2,check:/kwila|merbau/i,hint:"Kwila (also known as Merbau) is commonly used."}]},
      {id:"q4",text:"List 3 types of timber that are commonly used for woodturning.",type:"short",maxPoints:3,rubric:[{points:1,check:/kauri/i,hint:"Kauri is a common turning timber."},{points:1,check:/matai/i,hint:"Matai is a common turning timber."},{points:1,check:/rewarewa|rimu/i,hint:"Rewarewa or Rimu are also suitable turning timbers."}]},
      {id:"q5",text:"Describe the effects of moisture on MDF.",type:"long",maxPoints:3,rubric:[{points:1,check:/swell|swell(s|ed)?|expand(s|ed)?/i,hint:"Mention swelling or expansion of the board."},{points:1,check:/fiber|fibre|break(s|ing)? down|degrade(s|d)?/i,hint:"Mention damage to the fibres/structure."},{points:1,check:/weak|strength|weaken(s|ed)?/i,hint:"Mention that the MDF becomes weaker/loses strength."}]},
      {id:"q6",text:"Name a lightweight expanded plastic that is used for insulation in houses as well as for buoyancy in boats.",type:"short",maxPoints:2,rubric:[{points:2,check:/polystyrene|expanded\s+polystyrene|eps/i,hint:"Answer: Polystyrene (EPS)."}]},
      {id:"q7",text:"Name a commonly used metal that can be easily joined by welding.",type:"short",maxPoints:2,rubric:[{points:2,check:/mild\s+steel/i,hint:"Answer: Mild steel."}]},
      {id:"q8",text:"List 2 materials that could be used for the walls of a dog kennel.",type:"short",maxPoints:2,rubric:[{points:1,check:/plywood/i,hint:"Plywood is acceptable."},{points:1,check:/weatherboard/i,hint:"Weatherboard is acceptable."}]},
      {id:"q9",text:"List a hard, transparent material that can be manufactured to be noise-resistant, flat or curved, polished or textured surface and even bulletproof.",type:"short",maxPoints:2,rubric:[{points:2,check:/polycarbonate/i,hint:"Answer: Polycarbonate."}]},
      {id:"q10",text:"Name the plastic sheet material that is commonly used as a waterproof membrane under concrete.",type:"short",maxPoints:2,rubric:[{points:2,check:/moisture\s+barrier|poly(?:thene|ethylene)|damp[-\s]*proof.*membrane/i,hint:"Moisture barrier or polythene sheet under the slab."}]},
      {id:"q11",text:"What are the 3 main materials that make up concrete?",type:"short",maxPoints:3,rubric:[{points:1,check:/cement/i,hint:"Include cement."},{points:1,check:/water/i,hint:"Include water."},{points:1,check:/aggregate|gravel|stone(s)?/i,hint:"Include aggregate (gravel/stone)."}]},
      {id:"q12",text:"What is the function of a primer coat when painting?",type:"long",maxPoints:2,rubric:[{points:1,check:/seal(s|ing)?|sealed/i,hint:"Mention sealing the surface."},{points:1,check:/prepare(s|d)?|adhesion|bond/i,hint:"Mention preparing the surface or helping paint stick."}]},
      {id:"q13",text:"Identify 3 methods that are commonly used to apply a paint finish.",type:"short",maxPoints:3,rubric:[{points:1,check:/brush(ing)?/i,hint:"Brushing is one method."},{points:1,check:/spray(ing)?/i,hint:"Spraying is one method."},{points:1,check:/dip(ping)?/i,hint:"Dipping is one method."}]},
      {id:"q14",text:"Name 2 types of polishes and state an advantage that polish has over oil finishes.",type:"long",maxPoints:3,rubric:[{points:1,check:/wax|beeswax|paste\s+wax/i,hint:"Example: wax polish."},{points:1,check:/french\s+polish|shellac/i,hint:"Example: French polish or shellac-based polish."},{points:1,check:/hard(er)?\s+finish|durable|more\s+protection|protective\s+surface|higher\s+gloss|shiny|less\s+maintenance|lasts\s+longer/i,hint:"Advantage: harder, more durable/protective, glossier and/or needs less frequent re-application than oil."}]},
      {id:"q15",text:"Name 2 types of varnishes, briefly stating an advantage of each one.",type:"long",maxPoints:4,rubric:[{points:1,check:/polyurethane/i,hint:"Polyurethane varnish is one example."},{points:1,check:/polyurethane.*(durable|hardwearing|scratch|chemical|water\s+resistant)/i,hint:"Advantage: very durable and resistant to wear, water and chemicals."},{points:1,check:/oil[-\s]*based|alkyd|water[-\s]*based/i,hint:"Oil-based or water-based varnish is another example."},{points:1,check:/(oil[-\s]*based|alkyd).*(enhance(s)?\s+grain|warm\s+colour|flexible)|water[-\s]*based.*(quick\s+dry|low\s+odour|easy\s+cleanup)/i,hint:"Advantage example: oil-based enhances grain and gives a warm colour; water-based dries quickly and has low odour."}]}
    ]
  },
  {
    id: "fractions",
    name: "Fractions Practice",
    totalPoints: 7,
    questions: [
      {id:"q1",text:"What is 1/3 + 1/6?",type:"short",maxPoints:2,rubric:[{points:2,check:/^1\/2$|0\.5/,hint:"Answer must be 1/2"},{points:1,check:/3\/6|2\/6/,hint:"Show steps"}]},
      {id:"q2",text:"Explain how to add fractions with different denominators.",type:"long",maxPoints:5,rubric:[{points:2,check:/common.*denominator|LCM/i,hint:"Mention common denominator"},{points:1,check:/convert|equivalent/i,hint:"Convert fractions"},{points:1,check:/add.*numerator/i,hint:"Add numerators"},{points:1,check:/simplify|reduce/i,hint:"Simplify answer"}]}
    ]
  }
];
