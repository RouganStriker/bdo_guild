import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { HomeView, LoginView, GuildView, GuildListView, ProfileView, ProtectedView, RequireFamilyNameView, NotFoundView } from './containers';
import applyMiddlewares, { guildMiddleware } from './utils/middleware';

export default(
    <Switch>
        <Route exact path="/" component={HomeView} />
        <Route exact path="/settings" component={ProfileView} />
        <Route path="/login" component={LoginView} />
        <Route path="/newProfile" component={RequireFamilyNameView} />
        <Route exact path="/guilds" component={GuildListView} />
        <Route strict path="/guilds/:guild_id" component={GuildView} />
        <Route path="/404" component={NotFoundView} />
        <Route render={() => <Redirect to="/404"/> } />
    </Switch>

);
