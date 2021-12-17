import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const result = await axios.post(
      'http://localhost:3000/api/v1/users/login',
      {
        email,
        password,
      }
    );

    if (result.data.status === 'success') {
      showAlert('success', 'Log in successful!');
      return window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/v1/users/logout'
    );

    if (response.data.status === 'success') {
      location.reload(); //forces from server and not cache
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
