import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga'
import { routerMiddleware } from 'react-router-redux';

import rootReducer from '../reducers';
import sagas from '../saga'

export default function configureStore(initialState, history) {
    // Add so dispatched route actions to the history
    const reduxRouterMiddleware = routerMiddleware(history);
    const sagaMiddleware = createSagaMiddleware();
    const middleware = applyMiddleware(thunk, reduxRouterMiddleware, sagaMiddleware);
    const store = createStore(rootReducer, initialState, middleware);

    sagaMiddleware.run(sagas);

    return store;
}
