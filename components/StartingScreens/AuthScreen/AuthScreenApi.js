import apiClient from '../../../utils/apiClient';

export const requestOtp = async phone => {
  const response = await apiClient.post('/auth/request-otp', {phone});
  return response.data;
};

export const verifyOtp = async (phone, otp, name) => {
  const response = await apiClient.post('/auth/verify-otp', {phone, otp, name});
  return response.data;
};
