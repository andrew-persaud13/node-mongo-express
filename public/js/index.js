import '@babel/polyfill'; //??

import { login, logout } from './login';
import { updateUserData, updateUserPassword } from './updateSettings';
import { displayMap } from './mapbox';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logoutButton = document.querySelector('.nav__el--logout');
const userUpdateForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.update-password-form');

if (loginForm) {
  document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (userUpdateForm) {
  userUpdateForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('update-email').value;
    const name = document.getElementById('update-name').value;
    console.log('pips', email, name);

    updateUserData({ name, email });
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    const savePasswordButton = document.querySelector('.btn-save-password');
    savePasswordButton.setAttribute('disabled', true);
    savePasswordButton.textContent = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateUserPassword({ currentPassword, password, passwordConfirm });
    savePasswordButton.setAttribute('disabled', false);
    savePasswordButton.textContent = 'Save Password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}
