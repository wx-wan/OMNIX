// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import { Suspense, ComponentType, FC } from 'react';
import Loading from '@/components/shadcn-dashboard/spinner/loading';

// ===========================|| LOADABLE - LAZY LOADING ||=========================== //

const Loadable =
  <P extends object>(Component: ComponentType<P>): FC<P> =>
  (props: P) =>
    (
      <Suspense fallback={<Loading fullScreen />}>
        <Component {...props} />
      </Suspense>
    );

export default Loadable;
