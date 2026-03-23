'use client';

import dynamic from 'next/dynamic';

const RealtimeScoreWidget = dynamic(
  () => import('./RealtimeScoreWidget'),
  { ssr: false }
);

const RealtimeScoreWrapper = () => {
  return <RealtimeScoreWidget />;
};

export default RealtimeScoreWrapper;
