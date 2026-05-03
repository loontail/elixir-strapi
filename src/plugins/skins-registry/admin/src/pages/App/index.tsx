import { Routes, Route } from 'react-router-dom';
import SkinsPage from '../SkinsPage';

const App = () => (
  <Routes>
    <Route index element={<SkinsPage />} />
    <Route path="*" element={<SkinsPage />} />
  </Routes>
);

export default App;
