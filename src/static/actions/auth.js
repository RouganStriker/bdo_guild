import fetch from 'isomorphic-fetch';
import { push } from 'react-router-redux';
import { SERVER_URL } from '../utils/config';
import { checkHttpStatus, parseJSON } from '../utils';
import {
    AUTH_LOGIN_USER_SUCCESS,
} from '../constants';

export function authLoginUserSuccess(user) {
    return {
        type: AUTH_LOGIN_USER_SUCCESS,
        payload: {
            user
        }
    };
}
