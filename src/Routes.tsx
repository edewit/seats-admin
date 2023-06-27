import { Bullseye, Spinner } from '@patternfly/react-core';
import { getBaseName } from '@redhat-cloud-services/frontend-components-utilities/helpers';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';
import React, { Suspense, useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { AuthenticatedUser } from './client/service';
import { ServiceContextProvider } from './Components/ServiceProvider';
import { UsersPage } from './Pages/UsersPage';
import { AddUsersPage } from './Pages/AddUsersPage';
import { RemoveUsersPage } from './Pages/RemoveUsersPage';

export const Routes = () => {
  const [user, setUser] = useState<AuthenticatedUser>();
  const dispatch = useDispatch();
  const handleAlert = (
    message: string,
    type:
      | 'default'
      | 'success'
      | 'danger'
      | 'warning'
      | 'info'
      | undefined = 'success'
  ) => {
    dispatch(
      addNotification({
        variant: type,
        title: message,
      })
    );
  };
  const handleError = (message: string) => handleAlert(message, 'danger');

  const {
    auth: { getToken, getUser },
  } = useChrome();

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user)
        setUser({
          orgId: user.identity.org_id,
          serviceId: 'smarts',
          token: getToken,
        } as AuthenticatedUser);
    })();
  }, []);

  if (!user) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }
    >
      <ServiceContextProvider
        serviceName={process.env.SERVICE_KEY!}
        baseUrl={process.env.BASE_URL}
      >
        <Router basename={getBaseName(window.location.pathname) + '/seats'}>
          <Switch>
            <Route path="/add-users">
              <UsersPage user={user} />
              <AddUsersPage
                user={user}
                onSuccess={handleAlert}
                onError={handleError}
              />
            </Route>
            <Route path="/remove-users">
              <UsersPage user={user} />
              <RemoveUsersPage
                user={user}
                onSuccess={handleAlert}
                onError={handleError}
              />
            </Route>
            <Route path="/">
              <UsersPage
                user={user}
                onSuccess={handleAlert}
                onError={handleError}
              />
            </Route>
            {/* Finally, catch all unmatched routes */}
            <Route>
              <InvalidObject />
            </Route>
          </Switch>
        </Router>
      </ServiceContextProvider>
    </Suspense>
  );
};
