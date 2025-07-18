import { supabase } from './supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function SignIn() {
  return (
    <div className="signin-wrapper">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}       // optional OAuth
        theme="dark"
      />
    </div>
  );
}
