import { useEffect, useRef } from 'react';
import pluginId from '../../pluginId';

interface InitializerProps {
  setPlugin: (id: string) => void;
}

const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);
  ref.current = setPlugin;

  useEffect(() => {
    ref.current(pluginId);
  }, []);

  return null;
};

export default Initializer;
