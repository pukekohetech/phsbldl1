/* questions.js – DATA ONLY – edit ONLY this file for content */
export const APP_TITLE    = "US 24355 – Materials Knowledge";
export const APP_SUBTITLE = "Pukekohe High School – All 5 Parts";

export const TEACHERS = [
  { id: "RY",  name: "Mr Reynolds", email: "ry@pukekohehigh.school.nz" },
  { id: "RNR", name: "Mr Ranford",  email: "rnr@pukekohehigh.school.nz" },
  { id: "Other", name: "Other Teacher", email: "technology@pukekohehigh.school.nz" }
];

export const ASSESSMENTS = [
  {
    id: "24355-part1", title: "US 24355 Materials – Part 1", subtitle: "New Zealand Timbers (11 marks)", totalPoints: 11,
    questions: [
      { id: "q1", text: "What is the most common exotic timber that is grown in plantations in New Zealand?", type: "short", maxPoints: 2,
        hint: "Fast-growing softwood, name includes 'pine'…", rubric: [{ points: 2, check: /radiata\s+pine|pinus\s+radiata/i }] },
      { id: "q2", text: "Name 2 types of New Zealand native timbers that can be used for high-quality furniture.", type: "short", maxPoints: 2,
        hint: "One starts with R, one with K.", rubric: [{ points: 1, check: /rimu/i }, { points: 1, check: /kauri/i }] },
      { id: "q3", text: "Name an imported timber that can be used for decking and outdoor furniture.", type: "short", maxPoints: 2,
        rubric: [{ points: 2, check: /kwila|merbau/i }] },
      { id: "q4", text: "List 3 types of timber that are commonly used for woodturning.", type: "short", maxPoints: 3,
        rubric: [{ points: 1, check: /kauri/i }, { points: 1, check: /matai/i }, { points: 1, check: /rewarewa|rimu|puriri|totara/i }] }
    ]
  },
  {
    id: "24355-part2", title: "US 24355 Materials – Part 2", subtitle: "Manufactured Boards & Plastics (9 marks)", totalPoints: 9,
    questions: [
      { id: "q5", text: "Describe the effects of moisture on MDF.", type: "long", maxPoints: 3,
        rubric: [{ points: 1, check: /swell|expand/i }, { points: 1, check: /fibre|fiber|break|degrade/i }, { points: 1, check: /weak|lose.*strength/i }] },
      { id: "q6", text: "Name a lightweight expanded plastic used for insulation and buoyancy.", type: "short", maxPoints: 2,
        rubric: [{ points: 2, check: /polystyrene|eps|styrofoam/i }] },
      { id: "q9", text: "Name a hard, transparent plastic that can be bulletproof and noise-resistant.", type: "short", maxPoints: 2,
        rubric: [{ points: 2, check: /polycarbonate|lexan|makrolon/i }] },
      { id: "q10", text: "Name the plastic sheet used as a waterproof membrane under concrete slabs.", type: "short", maxPoints: 2,
        rubric: [{ points: 2, check: /polythene|polyethylene|dpm|damp.?proof/i }] }
    ]
  },
  {
    id: "24355-part3", title: "US 24355 Materials – Part 3", subtitle: "Metals & Concrete (5 marks)", totalPoints: 5,
    questions: [
      { id: "q7", text: "Name a commonly used metal that can be easily joined by welding.", type: "short", maxPoints: 2,
        rubric: [{ points: 2, check: /mild\s+steel|low\s+carbon/i }] },
      { id: "q11", text: "What are the 3 main materials that make up concrete?", type: "short", maxPoints: 3,
        rubric: [{ points: 1, check: /cement/i }, { points: 1, check: /water/i }, { points: 1, check: /aggregate|sand|gravel|stone/i }] }
    ]
  },
  {
    id: "24355-part4", title: "US 24355 Materials – Part 4", subtitle: "Paint Finishes (5 marks)", totalPoints: 5,
    questions: [
      { id: "q12", text: "What is the function of a primer coat when painting?", type: "long", maxPoints: 2,
        rubric: [{ points: 1, check: /seal|porous/i }, { points: 1, check: /adhesion|bond|stick|key/i }] },
      { id: "q13", text: "Identify 3 methods commonly used to apply paint.", type: "short", maxPoints: 3,
        rubric: [{ points: 1, check: /brush/i }, { points: 1, check: /roller/i }, { points: 1, check: /spray/i }] }
    ]
  },
  {
    id: "24355-part5", title: "US 24355 Materials – Part 5", subtitle: "Polishes & Varnishes (7 marks)", totalPoints: 7,
    questions: [
      { id: "q14", text: "Name 2 types of polishes and state an advantage over oil finishes.", type: "long", maxPoints: 3,
        rubric: [{ points: 1, check: /wax|paste\s+wax|beeswax/i }, { points: 1, check: /french\s+polish|shellac/i }, { points: 1, check: /hard|durable|gloss|protective|resist/i }] },
      { id: "q15", text: "Name 2 types of varnishes and state an advantage of each.", type: "long", maxPoints: 4,
        rubric: [
          { points: 1, check: /polyurethane/i }, { points: 1, check: /polyurethane.*(durable|tough|scratch|wear)/i },
          { points: 1, check: /water.?based|acrylic/i }, { points: 1, check: /water.?based.*(quick|fast.*dry|low.*odou?r|clear|non.?yellow)/i }
        ] }
    ]
  }
];
