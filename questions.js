const TEACHERS = [
  { id: "RY", name: "Mr Reynolds", email: "ry@pukekohehigh.school.nz" },
  { id: "RNR", name: "Mr Ranford", email: "rnr@pukekohehigh.school.nz" },
  { id: "Other",    name: "Unknown",    email: "technology@pukekohehigh.school.nz" }
];

const TASKS = [
  {
    id: "bcats-24355-materials",
    name: "24355 Materials Self-reflection",
    totalPoints: 37,
    questions: [
      {id:"q1",text:"What is the most common exotic timber that is grown in plantations in New Zealand?",type:"short",maxPoints:2,rubric:[{points:2,check:/radiata\s+pine/i,hint:"It's Radiata Pine"}]},
      {id:"q2",text:"Name 2 types of New Zealand native timbers that can be used for high-quality furniture.",type:"short",maxPoints:2,rubric:[{points:1,check:/rimu/i,hint:"One is Rimu"},{points:1,check:/kauri/i,hint:"The other is Kauri"}]},
      {id:"q3",text:"Name an imported timber that can be used for decking and outdoor furniture.",type:"short",maxPoints:2,rubric:[{points:2,check:/kwila|merbau/i,hint:"Kwila (also called Merbau)"}]},
      {id:"q4",text:"List 3 types of timber that are commonly used for woodturning.",type:"short",maxPoints:3,rubric:[{points:1,check:/kauri/i,hint:"Kauri"},{points:1,check:/matai/i,hint:"Matai"},{points:1,check:/rewarewa|rimu/i,hint:"Rewarewa or Rimu"}]},
      {id:"q5",text:"Describe the effects of moisture on MDF.",type:"long",maxPoints:3,rubric:[{points:1,check:/swell|expand/i,hint:"It swells or expands"},{points:1,check:/fiber|fibre/i,hint:"Fibres break down"},{points:1,check:/weak/i,hint:"It becomes weak"}]},
      {id:"q6",text:"Name a lightweight expanded plastic that is used for insulation in houses as well as for buoyancy in boats.",type:"short",maxPoints:2,rubric:[{points:2,check:/polystyrene|eps/i,hint:"Polystyrene (EPS)"}]},
      {id:"q7",text:"Name a commonly used metal that can be easily joined by welding.",type:"short",maxPoints:2,rubric:[{points:2,check:/mild\s+steel/i,hint:"Mild steel"}]},
      {id:"q8",text:"List 2 materials that could be used for the walls of a dog kennel.",type:"short",maxPoints:2,rubric:[{points:1,check:/plywood/i,hint:"Plywood"},{points:1,check:/weatherboard/i,hint:"Weatherboard"}]},
      {id:"q9",text:"List a hard, transparent material that can be manufactured to be noise-resistant, flat or curved, polished or textured surface and even bulletproof.",type:"short",maxPoints:2,rubric:[{points:2,check:/polycarbonate/i,hint:"Polycarbonate"}]},
      {id:"q10",text:"Name the plastic sheet material that is commonly used as a waterproof membrane under concrete.",type:"short",maxPoints:2,rubric:[{points:2,check:/polythene|dpm|damp/i,hint:"Polythene or DPM"}]},
      {id:"q11",text:"What are the 3 main materials that make up concrete?",type:"short",maxPoints:3,rubric:[{points:1,check:/cement/i,hint:"Cement"},{points:1,check:/water/i,hint:"Water"},{points:1,check:/aggregate|gravel|sand/i,hint:"Aggregate/sand/gravel"}]},
      {id:"q12",text:"What is the function of a primer coat when painting?",type:"long",maxPoints:2,rubric:[{points:1,check:/seal/i,hint:"Seals the surface"},{points:1,check:/adhesion|bond/i,hint:"Helps paint stick"}]},
      {id:"q13",text:"Identify 3 methods that are commonly used to apply a paint finish.",type:"short",maxPoints:3,rubric:[{points:1,check:/brush/i,hint:"Brush"},{points:1,check:/spray/i,hint:"Spray"},{points:1,check:/roller/i,hint:"Roller"}]},
      {id:"q14",text:"Name 2 types of polishes and state an advantage that polish has over oil finishes.",type:"long",maxPoints:3,rubric:[{points:1,check:/wax|french|shellac/i,hint:"e.g. wax or French polish"},{points:1,check:/wax|french|shellac/i,hint:"Need two types"},{points:1,check:/hard|durable|gloss|protect/i,hint:"Harder/more durable"}]},
      {id:"q15",text:"Name 2 types of varnishesentrada, briefly stating an advantage of each one.",type:"long",maxPoints:4,rubric:[{points:2,check:/polyurethane/i,hint:"Polyurethane (very tough)"},{points:2,check:/oil|water|alkyd/i,hint:"Oil-based or water-based"}]}
    ]
  }
];

