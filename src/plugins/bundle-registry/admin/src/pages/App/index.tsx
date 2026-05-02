import { Routes, Route } from 'react-router-dom';
import BuildListPage from '../BuildListPage';
import BuildCreatePage from '../BuildCreatePage';
import BuildDetailPage from '../BuildDetailPage';

const NotFound = () => <div>404 – Page not found</div>;

const App = () => (
  <div>
    <Routes>
      <Route index element={<BuildListPage />} />
      <Route path="new" element={<BuildCreatePage />} />
      <Route path=":slug" element={<BuildDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </div>
);

export default App;
