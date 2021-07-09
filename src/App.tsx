import React from 'react';
import Board from './components/Board';

interface IAppProps {}

const App: React.FC<IAppProps> = () => {
  return (
    <div>
      <Board />
    </div>
  );
};

export default App;
