import apiClient from '../../../utils/apiClient';

// phone is intentionally not sent — the backend derives it from the caller's
// authenticated identity (req.user.phone) rather than trusting the request body.
const VerificationApi = async data => {
  const response = await apiClient.post('/add-driver', {
    name: data.name,
    car_no: data.car_no,
  });
  return response.data;
};

export default VerificationApi;
