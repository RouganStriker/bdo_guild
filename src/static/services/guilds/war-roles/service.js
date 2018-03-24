import BaseService from '../../../utils/baseService';
import BaseSaga from '../../../utils/baseSaga';

const saga = new BaseSaga('/api/guilds/{guild_id}/war-roles/', 'war-roles', true);
const service = new BaseService('GUILD_WAR_ROLES', 'war_roles', saga, { list: true, get: true });

export default service;