import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'

import {
  AuthService,
  CharacterService,
  CharacterClassService,
  ContactService,
  GuildService,
  MemberService,
  ProfileService,
  UserStatsService,
  UserWarsService,
  WarAttendanceService,
  WarCallSignService,
  WarNodesService,
  WarRoleService,
  WarService,
  WarStatsService,
  WarTeamService,
} from '../services';

export default combineReducers({
    ...AuthService.createReducer(),
    ...CharacterService.createReducer(),
    ...CharacterClassService.createReducer(),
    ...ContactService.createReducer(),
    ...GuildService.createReducer(),
    ...MemberService.createReducer(),
    ...ProfileService.createReducer(),
    ...UserStatsService.createReducer(),
    ...UserWarsService.createReducer(),
    ...WarAttendanceService.createReducer(),
    ...WarCallSignService.createReducer(),
    ...WarNodesService.createReducer(),
    ...WarRoleService.createReducer(),
    ...WarService.createReducer(),
    ...WarStatsService.createReducer(),
    ...WarTeamService.createReducer(),
    routing: routerReducer,
    form: formReducer
});
