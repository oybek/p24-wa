import { City } from './api';

export interface CityOption {
  value: string;
  label: string;
}

export const cityToOption = (city: City): CityOption => ({
  value: city.id,
  label: city.name,
});
