import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { api } from '../services/api';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const success = searchParams.get('success');

      if (token && success === 'true') {
        try {
          // Store token in localStorage
          localStorage.setItem('token', token);

          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Fetch user data
          const response = await api.get('/auth/me');
          const user = response.data.user;

          // Update Redux state
          dispatch(setCredentials({ user, token }));

          // Redirect to assets page
          navigate('/assets?type=capital');
        } catch (error) {
          console.error('Error during auth callback:', error);
          navigate('/login');
        }
      } else {
        // Handle failure
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
