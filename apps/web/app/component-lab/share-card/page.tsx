import type { Metadata } from 'next';

import { ShareCardLab } from './ShareCardLab';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Share Card Component Lab | Sliding Tiles',
};

export default function ShareCardLabPage() {
  return <ShareCardLab />;
}
