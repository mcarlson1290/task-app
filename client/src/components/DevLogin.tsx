import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setStoredAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface DevLoginProps {
  onSuccess: () => void;
}

export function DevLogin({ onSuccess }: DevLoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const quickLoginOptions = [
    { email: 'robert@growspace.farm', name: 'Robert Carlson', role: 'Corporate Manager' },
    { email: 'Simone@growspace.farm', name: 'Simone Birriel', role: 'Staff' }
  ];

  const handleLogin = async (loginEmail: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the user in localStorage like Microsoft auth does
        setStoredAuth(data.user);
        
        toast({
          title: 'Login Successful',
          description: `Logged in as ${data.user.name}`,
        });
        
        // Trigger page reload to initialize user context
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-dev-login">
      <CardHeader>
        <CardTitle>Development Login</CardTitle>
        <CardDescription>
          Choose a user to log in as, or enter an email manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick login buttons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Login</h4>
          {quickLoginOptions.map((option) => (
            <Button
              key={option.email}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleLogin(option.email)}
              disabled={isLoading}
              data-testid={`button-quick-login-${option.email.split('@')[0]}`}
            >
              <div className="text-left">
                <div className="font-medium">{option.name}</div>
                <div className="text-xs text-muted-foreground">{option.email} - {option.role}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Manual email input */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Custom Email</h4>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              data-testid="input-custom-email"
            />
            <Button
              onClick={() => handleLogin(email)}
              disabled={isLoading || !email}
              data-testid="button-custom-login"
            >
              Login
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          This is a development-only login bypass. In production, Microsoft authentication would be required.
        </div>
      </CardContent>
    </Card>
  );
}