import { createReducer } from 'redux-act';
import { call } from 'redux-saga/effects';

import BaseService from '../../utils/baseService';
import BaseSaga, { apiRequest } from '../../utils/baseSaga';


class AuthSaga extends BaseSaga {
  /*
    API Services
  */
  logout() {
    return this.axios.get('/accounts/logout/');
  }

  getUserData() {
    return this.axios.get('/api/users/me/');
  }

  /*
    Sagas
  */
  logoutSaga(action) {
    return (function* () {
      yield call(apiRequest, {
        action: action,
        fn: () => this.logout()
      });
    }).bind(this);
  }

  getUserDataSaga(action) {
    return (function* () {
      yield call(apiRequest, {
        action: action,
        fn: () => this.getUserData()
      });
    }).bind(this);
  }

}


class AuthService extends BaseService {
  getAdditionalActions() {
    // To be extended by sub-classes
    return ['logout', 'getUserData'];
  }

  getAdditionalNonAPIActions() {
    return ['authenticate', 'setProfileID', 'setGuilds']
  }

  authenticateReducer() {
    return (state, payload) => ({
      ...state,
      user: payload,
      isLoaded: true,
    })
  }

  logoutSuccessReducer() {
    return (state, payload) => ({
      ...state,
      user: null,
      isFullyLoaded: false,
    })
  }

  getUserDataSuccessReducer() {
    return (state, payload) => ({
      ...state,
      user: payload,
      isFullyLoaded: true,
    })
  }

  setProfileIDReducer() {
    return (state, payload) => ({
      ...state,
      user: {
        ...user,
        profile_id: payload
      },
    })
  }

  setGuildsReducer() {
    return (state, payload) => ({
      ...state,
      user: {
        ...user,
        guilds: payload
      },
    })
  }
}



const saga = new AuthSaga('');
const service = new AuthService('AUTH', 'auth', saga);

export default service;