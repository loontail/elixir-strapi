import React from 'react';
import { Routes, Route } from 'react-router-dom';
import pluginId from '../../pluginId';
import HomePage from '../HomePage';

const NotFound = () => React.createElement('div', null, '404 – Page not found');

const App = () =>
  React.createElement(
    'div',
    null,
    React.createElement(
      Routes,
      null,
      React.createElement(Route, {
        path: `/plugins/${pluginId}`,
        element: React.createElement(HomePage),
      }),
      React.createElement(Route, {
        path: '*',
        element: React.createElement(NotFound),
      })
    )
  );

export default App;
