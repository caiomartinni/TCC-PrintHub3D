import api from './api';

export const reviewsService = {
  async create(payload: {
    orderId: string;
    rating:  number;
    title?:  string;
    comment?:string;
  }) {
    const { data } = await api.post('/reviews', payload);
    return data.data;
  },
};
