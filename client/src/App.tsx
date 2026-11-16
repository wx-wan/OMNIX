import { RouterProvider } from 'react-router';
import router from './routes/Router';
import { AuthProvider } from './context/AuthContext';
import { PositionedToaster } from './components/shadcn-dashboard/sonner/toaster';
import { toastManager } from './components/shadcn-dashboard/sonner/toast';
import './css/globals.css';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <PositionedToaster manager={toastManager} position="top-right" />
    </AuthProvider>
  );
}

export default App;
