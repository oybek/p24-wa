import axios, { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';

interface RetryableRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': '1',
  },
});

client.interceptors.request.use((config) => {
  const jwt = localStorage.getItem('jwt');
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: RetryableRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { getInitData } = await import('./initData.ts');
      const { data } = await client.post<{ jwt: string }>('/v1/jwt', { init_data: getInitData() });
      localStorage.setItem('jwt', data.jwt);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${data.jwt}`,
      };
      return client(originalRequest);
    }
    return Promise.reject(error);
  },
);

export interface City {
  id: string;
  name: string;
}

export interface OrderCreate {
  name: string;
  city_from: string;
  city_to: string;
  address_from: string;
  address_to: string;
  when: string;
  passenger_count: number;
  price: number;
  contact: string;
}

export interface Order extends OrderCreate {
  id: number;
}

export type TripCreate = OrderCreate;

export interface LinkResponse {
  link: string;
}

export const ping = () => client.get<void>('/v1/ping');

export const listCities = () => client.get<City[]>('/v1/cities');

export const createJwt = (initData: string) =>
  client.post<{ jwt: string }>('/v1/jwt', { init_data: initData }).then((res) => {
    localStorage.setItem('jwt', res.data.jwt);
    return res;
  });

export const listOrders = () => client.get<Order[]>('/v1/order');

export const createOrder = (order: OrderCreate) =>
  client.post<LinkResponse>('/v1/order', order);

export const updateOrderPrice = (id: number, newPrice: number) =>
  client.put<LinkResponse>(`/v1/order/${id}/price`, { new_price: newPrice });

export const deleteOrder = (id: number) => client.delete<void>(`/v1/order/${id}`);

export const createTrip = (trip: TripCreate) =>
  client.post<LinkResponse>('/v1/trip', trip);

export interface MetricEvent {
  key: string;
  count: number;
  date: string;
}

export const getMetrics = () => client.get<MetricEvent[]>('/v1/metrics');

export const trackMetric = (key: 'call_order' | 'call_trip') =>
  client.post<void>('/v1/metric', { key });

export interface OrderListItem {
  id: number;
  name: string;
  city_from: string;
  city_to: string;
  address_from: string;
  address_to: string;
  when: string;
  passenger_count: number;
  price: number;
  contact: string;
}

export interface OrdersPage {
  items: OrderListItem[];
  next_page_token?: string;
}

const buildSearchParams = (params: {
  city_from?: string;
  city_to?: string;
  date?: string;
  page_token?: string;
}) => {
  const p = new URLSearchParams();
  if (params.city_from) p.set('city_from', params.city_from);
  if (params.city_to) p.set('city_to', params.city_to);
  if (params.date) p.set('date', params.date);
  if (params.page_token) p.set('page_token', params.page_token);
  return p.toString();
};

export const searchOrders = (params: Parameters<typeof buildSearchParams>[0] = {}) => {
  const qs = buildSearchParams(params);
  return client.get<OrdersPage>(`/v1/orders${qs ? '?' + qs : ''}`);
};

export type TripListItem = OrderListItem;

export interface TripsPage {
  items: TripListItem[];
  next_page_token?: string;
}

export const searchTrips = (params: Parameters<typeof buildSearchParams>[0] = {}) => {
  const qs = buildSearchParams(params);
  return client.get<TripsPage>(`/v1/trips${qs ? '?' + qs : ''}`);
};
