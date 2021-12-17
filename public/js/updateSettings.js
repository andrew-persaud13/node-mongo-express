import axios from 'axios';
import { showAlert } from './alerts';

export const updateUserData = async ({ name, email }) => {
  try {
    const response = await axios.post('http://localhost:3000/update-user', {
      email,
      name,
    });
    if (response.status === 200) {
      showAlert('success', 'Data updated successfully!');
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', err.response.data.message);
  }
};

export const updateUserPassword = async data => {
  try {
    const response = await axios.patch(
      'http://localhost:3000/api/v1/users/update-password',
      data
    );

    if (response.data.status === 'success')
      showAlert('success', 'Password updated successfully');
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
