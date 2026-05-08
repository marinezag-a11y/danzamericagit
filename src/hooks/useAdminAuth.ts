import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAdminAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isSupport = localStorage.getItem('support_mode') === 'true';
  const supportPerms = localStorage.getItem('support_permissions');
  const supportRole = localStorage.getItem('support_role');
  const supportUserName = localStorage.getItem('support_user_name');

  useEffect(() => {
    const getPerms = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/admin');
          return;
        }
        setUserEmail(user.email || null);

        if (isSupport && supportPerms) {
          setUserPermissions(JSON.parse(supportPerms));
          setUserRole(supportRole);
          setLoading(false);
        } else {
          // Fetch initial permissions
          const { data: profile } = await supabase
            .from('profiles')
            .select('permissions, role')
            .eq('id', user.id)
            .single();
          
          setUserPermissions(profile?.permissions || []);
          setUserRole(profile?.role || 'admin');
          setLoading(false);

          // Subscribe to changes
          const channel = supabase
            .channel(`profile-${user.id}`)
            .on(
              'postgres_changes', 
              { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'profiles',
                filter: `id=eq.${user.id}`
              }, 
              (payload) => {
                console.log('Profile update received:', payload.new);
                setUserPermissions(payload.new.permissions || []);
                setUserRole(payload.new.role || 'admin');
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setLoading(false);
      }
    };

    getPerms();
  }, [navigate, isSupport, supportPerms, supportRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleExitSupport = () => {
    localStorage.removeItem('support_mode');
    localStorage.removeItem('support_user_id');
    localStorage.removeItem('support_user_name');
    localStorage.removeItem('support_permissions');
    localStorage.removeItem('support_role');
    window.location.reload();
  };

  return {
    userEmail,
    userRole,
    userPermissions,
    loading,
    isSupport,
    supportUserName,
    handleLogout,
    handleExitSupport
  };
}
