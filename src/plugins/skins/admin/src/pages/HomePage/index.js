import React from 'react';
import pluginId from '../../pluginId';

const HomePage = () =>
  React.createElement(
    'div',
    null,
    React.createElement('h1', null, `${pluginId}'s HomePage`),
    React.createElement('p', null, 'Happy coding')
  );

export default HomePage;
