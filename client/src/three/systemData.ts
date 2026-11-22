import type { V3 } from './pipes';

export type Category = 'supply' | 'hot' | 'drainage' | 'storage' | 'fixture';

export interface SystemComponent {
  id: string;
  name: string;
  category: Category;
  description: string;
  purpose: string;
  specs: string[];
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  supply: { label: 'Cold water supply', color: '#168BFF' },
  hot: { label: 'Hot water', color: '#ef4444' },
  drainage: { label: 'Drainage & venting', color: '#94a3b8' },
  storage: { label: 'Storage & pumping', color: '#22d3ee' },
  fixture: { label: 'Fixtures', color: '#f8fafc' },
};

/** General, industry-typical technical guidance. Actual sizes are decided per project design. */
export const COMPONENTS: SystemComponent[] = [
  {
    id: 'municipal-inlet',
    name: 'Municipal Water Inlet',
    category: 'supply',
    description: 'The service connection from the local water authority main into the property.',
    purpose: 'Brings treated mains water to the property and into underground storage.',
    specs: ['Typical service size: 15–25 mm', 'Material: HDPE / CPVC / GI', 'Stop valve and meter at the boundary'],
  },
  {
    id: 'water-meter',
    name: 'Water Meter',
    category: 'supply',
    description: 'Measures the volume of water supplied to the property.',
    purpose: 'Billing and leak detection – unexpected consumption often reveals hidden leaks.',
    specs: ['Installed in an accessible, protected chamber', 'Straight pipe lengths before/after for accuracy', 'Isolation valves on both sides'],
  },
  {
    id: 'sump',
    name: 'Underground Sump Tank',
    category: 'storage',
    description: 'Below-ground storage tank that receives mains water.',
    purpose: 'Stores water during intermittent supply hours so the building is never left dry.',
    specs: [
      'RCC or pre-fabricated, fully waterproofed',
      'Often sized for 1–2 days of demand',
      'Lockable manhole, vent and overflow',
      'Kept clear of drainage lines to avoid contamination',
    ],
  },
  {
    id: 'pump',
    name: 'Pump Set',
    category: 'storage',
    description: 'Monoblock or submersible pump that lifts water from the sump.',
    purpose: 'Transfers water from underground storage to the overhead tank.',
    specs: ['Selected by required head and flow rate', 'Automatic level controller & dry-run protection', 'Foot valve on suction, non-return valve on delivery'],
  },
  {
    id: 'rising-main',
    name: 'Rising Main',
    category: 'supply',
    description: 'Delivery pipe running from the pump up to the overhead tank.',
    purpose: 'Carries pumped water to roof-level storage.',
    specs: ['Typically 25–40 mm CPVC / GI / HDPE', 'Rated for pump shut-off pressure', 'Clamped at regular intervals'],
  },
  {
    id: 'overhead-tank',
    name: 'Overhead Water Tank',
    category: 'storage',
    description: 'Roof-level storage tank feeding the building by gravity.',
    purpose: 'Provides steady supply and pressure to every floor without running the pump continuously.',
    specs: [
      'Multi-layer polyethylene or RCC',
      'Inlet, outlet, overflow and drain-out connections',
      'Each metre of height ≈ 0.1 bar of pressure',
    ],
  },
  {
    id: 'gate-valve',
    name: 'Isolation (Gate) Valve',
    category: 'supply',
    description: 'Full-bore valve at the tank outlet and on each floor branch.',
    purpose: 'Lets one area be shut off for repairs without draining the whole system.',
    specs: ['Gate or ball valve, full bore', 'Accessible location, clearly labelled', 'One per tank outlet, riser and floor branch'],
  },
  {
    id: 'cold-riser',
    name: 'Cold Water Downtake',
    category: 'supply',
    description: 'Vertical pipe that distributes water from the overhead tank to each floor.',
    purpose: 'Feeds every floor by gravity from the tank.',
    specs: ['Typically 25–40 mm CPVC / PPR', 'Pressure-reducing valves on lower floors of tall buildings', 'Isolation valve at every floor take-off'],
  },
  {
    id: 'cold-branches',
    name: 'Cold Water Distribution',
    category: 'supply',
    description: 'Horizontal branch lines from the downtake to bathrooms and kitchens.',
    purpose: 'Delivers cold water to every tap, cistern, geyser and mixer.',
    specs: ['15–20 mm CPVC / PPR, concealed in wall or floor', 'Pressure-tested before concealment', 'Minimum joints, proper clamping'],
  },
  {
    id: 'geyser',
    name: 'Water Heater (Geyser)',
    category: 'hot',
    description: 'Electric storage water heater serving the bathroom.',
    purpose: 'Heats cold water and supplies the hot-water line to shower and basin.',
    specs: ['Storage capacity commonly 15–25 L per bathroom', 'Pressure-relief valve and proper earthing', 'Cold feed with its own isolation valve'],
  },
  {
    id: 'hot-line',
    name: 'Hot Water Line',
    category: 'hot',
    description: 'Pipework carrying heated water from the geyser to outlets.',
    purpose: 'Supplies hot water to mixers, shower and basin.',
    specs: ['CPVC / PPR rated for hot-water service', 'Insulation reduces heat loss', 'Convention: hot on the left, cold on the right'],
  },
  {
    id: 'shower',
    name: 'Shower & Diverter',
    category: 'fixture',
    description: 'Overhead/hand shower controlled by a concealed diverter or thermostatic valve.',
    purpose: 'Mixes hot and cold water to a comfortable, stable temperature.',
    specs: ['Concealed body set to correct depth before tiling', 'Rain showers may need a pressure booster', 'Accessible for future cartridge service'],
  },
  {
    id: 'wash-basin',
    name: 'Wash Basin',
    category: 'fixture',
    description: 'Basin with mixer, angle valves and bottle trap.',
    purpose: 'Hand-washing point connected to hot and cold supply and to the waste line.',
    specs: ['32 mm waste with bottle trap', 'Angle valves on both supplies', 'Rim height typically 800–850 mm'],
  },
  {
    id: 'wc',
    name: 'Water Closet (WC)',
    category: 'fixture',
    description: 'Floor-mounted or wall-hung WC with cistern.',
    purpose: 'Discharges soil waste into the soil stack.',
    specs: ['100 mm (4″) soil outlet', 'Concealed cistern for wall-hung models', 'Connected to a vented soil system to protect the trap seal'],
  },
  {
    id: 'floor-trap',
    name: 'Floor Trap (Nahani Trap)',
    category: 'drainage',
    description: 'Trapped floor drain in wet areas.',
    purpose: 'Drains shower and floor water while its water seal blocks sewer gases.',
    specs: ['Floor finished to slope towards trap', 'Removable, cleanable grating', 'Connected to the waste line, not directly to soil'],
  },
  {
    id: 'kitchen-sink',
    name: 'Kitchen Sink',
    category: 'fixture',
    description: 'Sink with mixer, trap and waste connection.',
    purpose: 'Washing point that discharges greasy waste water separately from soil.',
    specs: ['40 mm waste with trap', 'Grease trap recommended for commercial kitchens', 'Discharges via gully trap to underground drain'],
  },
  {
    id: 'waste-lines',
    name: 'Waste Pipes',
    category: 'drainage',
    description: 'Pipes carrying water from basins, showers and floor traps.',
    purpose: 'Conveys grey water to the stack and drainage network.',
    specs: ['uPVC / SWR 40–75 mm', 'Laid to a gentle fall (about 1:40–1:60)', 'Every fixture individually trapped'],
  },
  {
    id: 'soil-stack',
    name: 'Soil & Waste Stack',
    category: 'drainage',
    description: 'Main vertical drainage pipe collecting discharge from every floor.',
    purpose: 'Carries soil and waste water down to the underground drainage.',
    specs: ['uPVC SWR, 110 mm typical', 'Cleaning access at bends and base', 'Long-radius bend at the foot to reduce blockages'],
  },
  {
    id: 'vent-pipe',
    name: 'Vent Pipe',
    category: 'drainage',
    description: 'Extension of the stack above roof level, finished with a cowl.',
    purpose: 'Equalises air pressure so trap seals are not siphoned, and releases sewer gases safely.',
    specs: ['Terminates above roof with cowl/mesh', 'Away from windows and water tanks', 'Same diameter as the stack'],
  },
  {
    id: 'kitchen-waste',
    name: 'Kitchen Waste Stack',
    category: 'drainage',
    description: 'Separate vertical waste pipe for kitchen sinks.',
    purpose: 'Keeps greasy kitchen water separate until it reaches the gully trap.',
    specs: ['uPVC 75 mm typical', 'Rodding points for grease build-up', 'Discharges into a gully trap'],
  },
  {
    id: 'gully-trap',
    name: 'Gully Trap',
    category: 'drainage',
    description: 'Trapped inlet at ground level receiving kitchen and floor waste.',
    purpose: 'Provides a water seal and access for cleaning before the underground drain.',
    specs: ['Trapped with grating cover', 'Cleanable silt/grease section', 'Connected to nearest inspection chamber'],
  },
  {
    id: 'underground-drain',
    name: 'Underground Drainage',
    category: 'drainage',
    description: 'Buried drain pipes connecting stacks and gully traps to chambers.',
    purpose: 'Carries all wastewater away from the building towards the sewer.',
    specs: ['uPVC / SWR / stoneware 110–150 mm', 'Laid to falls (about 1:40 for 100 mm pipe)', 'Bedded and surrounded to resist loads'],
  },
  {
    id: 'inspection-chamber',
    name: 'Inspection Chamber',
    category: 'drainage',
    description: 'Access chamber at junctions and changes of direction.',
    purpose: 'Allows inspection, rodding and blockage clearance without digging.',
    specs: ['At every junction / change of direction', 'Benching to guide flow', 'Airtight, load-rated cover'],
  },
  {
    id: 'sewer-connection',
    name: 'Sewer Connection',
    category: 'drainage',
    description: 'Final drain from the last chamber into the municipal sewer.',
    purpose: 'Discharges the building’s wastewater into the public sewer network.',
    specs: ['Requires local authority approval', 'Final chamber before connection', 'Back-flow protection where the sewer surcharges'],
  },
];

export const COMPONENT_BY_ID = Object.fromEntries(COMPONENTS.map((c) => [c.id, c])) as Record<string, SystemComponent>;

export interface SystemView {
  id: string;
  label: string;
  camera: V3;
  target: V3;
  focus: string[] | null; // component ids to emphasise (null = everything)
  caption: string;
}

const ids = (cats: Category[]) => COMPONENTS.filter((c) => cats.includes(c.category)).map((c) => c.id);

export const VIEWS: SystemView[] = [
  { id: 'overview', label: 'Overview', camera: [14, 8.5, 15.5], target: [0.5, 2.2, -0.5], focus: null, caption: 'A complete two-storey building plumbing system, from mains inlet to sewer.' },
  {
    id: 'supply',
    label: 'Water Supply',
    camera: [-14, 8, 12],
    target: [-2.5, 3, -1.5],
    focus: [...ids(['supply', 'storage'])],
    caption: 'Mains → sump → pump → overhead tank → gravity distribution to every floor.',
  },
  {
    id: 'hotcold',
    label: 'Hot & Cold',
    camera: [9, 6.5, 6.5],
    target: [3, 4.5, -2.2],
    focus: ['cold-branches', 'cold-riser', 'geyser', 'hot-line', 'shower', 'wash-basin', 'gate-valve'],
    caption: 'Cold branches feed fixtures and the geyser; insulated hot lines run to mixers.',
  },
  {
    id: 'drainage',
    label: 'Drainage',
    camera: [16, 5, 11],
    target: [3, 1.5, -1],
    focus: ids(['drainage']),
    caption: 'Traps, waste pipes and vented stacks carry wastewater down to the underground network.',
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    camera: [7.5, 6.8, 5],
    target: [3.3, 4.2, -2],
    focus: ['wc', 'wash-basin', 'shower', 'floor-trap', 'geyser', 'hot-line', 'cold-branches', 'waste-lines', 'soil-stack'],
    caption: 'Bathroom plumbing: WC, basin, shower, floor trap, geyser and their supply & drainage.',
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    camera: [-7.5, 6.5, 5],
    target: [-3, 4.1, -2.4],
    focus: ['kitchen-sink', 'cold-branches', 'kitchen-waste', 'gully-trap'],
    caption: 'Kitchen sink supply and a separate kitchen waste stack discharging to a gully trap.',
  },
  {
    id: 'tank',
    label: 'Overhead Tank',
    camera: [-9, 11.5, 6],
    target: [-2.8, 7, -2],
    focus: ['overhead-tank', 'rising-main', 'gate-valve', 'cold-riser', 'vent-pipe'],
    caption: 'Roof-level storage provides gravity pressure to every floor.',
  },
  {
    id: 'underground',
    label: 'Underground',
    camera: [3, 0.6, 15],
    target: [1.5, -1.5, 0],
    focus: ['sump', 'municipal-inlet', 'water-meter', 'pump', 'underground-drain', 'inspection-chamber', 'sewer-connection', 'gully-trap'],
    caption: 'Below ground: sump storage, drains laid to falls, inspection chambers and the sewer connection.',
  },
];
