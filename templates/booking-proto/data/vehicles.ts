// Fake demo data only — no real inventory, pricing or vendor. Fuels the prototype's results grid.
//
// Five vehicles per class (20 total) so that any search the generated specs can perform —
// including leaving the class select on its default "Any class" — always renders a full,
// multi-row results grid. Location and pickup/drop-off date are display/booking info only;
// they never filter the fleet (this is a prototype over fixture data, not live availability).
export type Vehicle = {
  id: string;
  name: string;
  carClass: 'economy' | 'midsize' | 'suv' | 'luxury';
  seats: number;
  transmission: 'automatic' | 'manual';
  dailyPrice: number;
};

export const vehicles: Vehicle[] = [
  // Economy
  { id: 'v1', name: 'Compact Sedan', carClass: 'economy', seats: 4, transmission: 'automatic', dailyPrice: 42 },
  { id: 'v2', name: 'Hatchback', carClass: 'economy', seats: 4, transmission: 'manual', dailyPrice: 38 },
  { id: 'v3', name: 'Subcompact', carClass: 'economy', seats: 4, transmission: 'automatic', dailyPrice: 36 },
  { id: 'v4', name: 'Economy Plus Sedan', carClass: 'economy', seats: 5, transmission: 'automatic', dailyPrice: 45 },
  { id: 'v5', name: 'City Runabout', carClass: 'economy', seats: 4, transmission: 'manual', dailyPrice: 34 },
  // Midsize
  { id: 'v6', name: 'Midsize Sedan', carClass: 'midsize', seats: 5, transmission: 'automatic', dailyPrice: 54 },
  { id: 'v7', name: 'Crossover', carClass: 'midsize', seats: 5, transmission: 'automatic', dailyPrice: 61 },
  { id: 'v8', name: 'Midsize Wagon', carClass: 'midsize', seats: 5, transmission: 'automatic', dailyPrice: 58 },
  { id: 'v9', name: 'Hybrid Sedan', carClass: 'midsize', seats: 5, transmission: 'automatic', dailyPrice: 63 },
  { id: 'v10', name: 'Standard Hatchback', carClass: 'midsize', seats: 5, transmission: 'manual', dailyPrice: 52 },
  // SUV
  { id: 'v11', name: 'Full-size SUV', carClass: 'suv', seats: 7, transmission: 'automatic', dailyPrice: 79 },
  { id: 'v12', name: 'Compact SUV', carClass: 'suv', seats: 5, transmission: 'automatic', dailyPrice: 68 },
  { id: 'v13', name: 'Midsize SUV', carClass: 'suv', seats: 5, transmission: 'automatic', dailyPrice: 72 },
  { id: 'v14', name: 'Three-Row SUV', carClass: 'suv', seats: 7, transmission: 'automatic', dailyPrice: 86 },
  { id: 'v15', name: 'Rugged 4x4 SUV', carClass: 'suv', seats: 5, transmission: 'automatic', dailyPrice: 81 },
  // Luxury
  { id: 'v16', name: 'Executive Sedan', carClass: 'luxury', seats: 5, transmission: 'automatic', dailyPrice: 112 },
  { id: 'v17', name: 'Convertible', carClass: 'luxury', seats: 4, transmission: 'automatic', dailyPrice: 128 },
  { id: 'v18', name: 'Luxury SUV', carClass: 'luxury', seats: 5, transmission: 'automatic', dailyPrice: 134 },
  { id: 'v19', name: 'Sport Coupe', carClass: 'luxury', seats: 4, transmission: 'automatic', dailyPrice: 121 },
  { id: 'v20', name: 'Grand Touring Sedan', carClass: 'luxury', seats: 5, transmission: 'automatic', dailyPrice: 142 },
];

export const carClassOptions = [
  { value: 'economy', label: 'Economy' },
  { value: 'midsize', label: 'Midsize' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxury', label: 'Luxury' },
] as const;

export function searchVehicles(carClass?: string | null): Vehicle[] {
  if (!carClass) return vehicles;
  return vehicles.filter((v) => v.carClass === carClass);
}

export function getVehicle(id?: string | null): Vehicle | null {
  if (!id) return null;
  return vehicles.find((v) => v.id === id) ?? null;
}
