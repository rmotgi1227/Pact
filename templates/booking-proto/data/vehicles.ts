// Fake demo data only — no real inventory, pricing or vendor. Fuels the prototype's results grid.
export type Vehicle = {
  id: string;
  name: string;
  carClass: 'economy' | 'midsize' | 'suv' | 'luxury';
  seats: number;
  transmission: 'automatic' | 'manual';
  dailyPrice: number;
};

export const vehicles: Vehicle[] = [
  { id: 'v1', name: 'Compact Sedan', carClass: 'economy', seats: 4, transmission: 'automatic', dailyPrice: 42 },
  { id: 'v2', name: 'Hatchback', carClass: 'economy', seats: 4, transmission: 'manual', dailyPrice: 38 },
  { id: 'v3', name: 'Midsize Sedan', carClass: 'midsize', seats: 5, transmission: 'automatic', dailyPrice: 54 },
  { id: 'v4', name: 'Crossover', carClass: 'midsize', seats: 5, transmission: 'automatic', dailyPrice: 61 },
  { id: 'v5', name: 'Full-size SUV', carClass: 'suv', seats: 7, transmission: 'automatic', dailyPrice: 79 },
  { id: 'v6', name: 'Compact SUV', carClass: 'suv', seats: 5, transmission: 'automatic', dailyPrice: 68 },
  { id: 'v7', name: 'Executive Sedan', carClass: 'luxury', seats: 5, transmission: 'automatic', dailyPrice: 112 },
  { id: 'v8', name: 'Convertible', carClass: 'luxury', seats: 4, transmission: 'automatic', dailyPrice: 128 },
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
