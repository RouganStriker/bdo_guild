import {
    AUTH_LOGIN_USER_SUCCESS
} from '../constants';


const initialState = {
    user: null,
    isAuthenticated: false,
    isAuthenticating: false,
    statusText: null
};

export default function authReducer(state = initialState, action) {
    switch (action.type) {
        case AUTH_LOGIN_USER_SUCCESS:
            return Object.assign({}, state, {
                isAuthenticating: false,
                isAuthenticated: true,
                user: action.payload.user,
                profile: null,
                statusText: 'You have been successfully logged in.'
            });

        default:
            return state;
    }
}
