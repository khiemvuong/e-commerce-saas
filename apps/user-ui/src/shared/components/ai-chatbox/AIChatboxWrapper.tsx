'use client';

import dynamic from 'next/dynamic';

const AIChatbox = dynamic(
  () => import('./AIChatbox'),
  { ssr: false }
);

const AIChatboxWrapper = () => {
  return <AIChatbox />;
};

export default AIChatboxWrapper;
