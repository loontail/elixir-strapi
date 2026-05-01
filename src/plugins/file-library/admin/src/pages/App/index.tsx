import { Switch, Route } from 'react-router-dom';
import { AnErrorOccurred } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import BuildListPage from '../BuildListPage';
import BuildCreatePage from '../BuildCreatePage';
import BuildDetailPage from '../BuildDetailPage';

const App = () => (
  <div>
    <Switch>
      <Route path={`/plugins/${pluginId}`} component={BuildListPage} exact />
      <Route path={`/plugins/${pluginId}/new`} component={BuildCreatePage} exact />
      <Route path={`/plugins/${pluginId}/:slug`} component={BuildDetailPage} exact />
      <Route component={AnErrorOccurred} />
    </Switch>
  </div>
);

export default App;
