import { fork } from 'redux-saga/effects';
import { createWatchers } from '../utils/baseSaga';

import {
  AuthService,
  CharacterService,
  CharacterClassService,
  ContactService,
  GuildService,
  GuildActivityService,
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

function* sagas() {
  const sagaMapping = {
    ...AuthService.createSagaMapping(),
    ...CharacterService.createSagaMapping(),
    ...CharacterClassService.createSagaMapping(),
    ...ContactService.createSagaMapping(),
    ...GuildService.createSagaMapping(),
    ...GuildActivityService.createSagaMapping(),
    ...MemberService.createSagaMapping(),
    ...ProfileService.createSagaMapping(),
    ...UserStatsService.createSagaMapping(),
    ...UserWarsService.createSagaMapping(),
    ...WarAttendanceService.createSagaMapping(),
    ...WarCallSignService.createSagaMapping(),
    ...WarNodesService.createSagaMapping(),
    ...WarRoleService.createSagaMapping(),
    ...WarService.createSagaMapping(),
    ...WarStatsService.createSagaMapping(),
    ...WarTeamService.createSagaMapping(),
  }

  yield fork(createWatchers, sagaMapping);
}

export default sagas;
