import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateCredentials, getFieldError, AUTH_MESSAGES } from '@petspark/shared';
import type { UserCredentials, AuthValidationError } from '@petspark/shared';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<readonly AuthValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Validate credentials
    const validation = validateCredentials(formData as UserCredentials);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
      // Mock login - in real app, this would call the login mutation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      navigate('/home');
    } catch (_error) {
      setAuthError(AUTH_MESSAGES.SIGN_IN_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors.some(error => error.field === field)) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
    // Clear auth error when user makes any change
    if (authError) {
      setAuthError(null);
    }
  };

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <span className="text-primary-foreground font-bold text-lg">PS</span>
            </motion.div>
            <motion.h1
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome Back
            </motion.h1>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Sign in to your PETSPARK account
            </motion.p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auth Error Display */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="space-y-2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {AUTH_MESSAGES.EMAIL}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label={AUTH_MESSAGES.EMAIL}
                    placeholder={AUTH_MESSAGES.EMAIL_PLACEHOLDER}
                    value={formData.email}
                    maxLength={254}
                    onChange={(e) => handleInputChange('email', e.target.value.trim())}
                    className={getFieldError(validationErrors, 'email') ? 'border-destructive focus:border-destructive' : ''}
                    required
                  />
                </div>
                <AnimatePresence>
                  {getFieldError(validationErrors, 'email') && (
                    <motion.p
                      className="text-sm text-destructive flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError(validationErrors, 'email')}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {AUTH_MESSAGES.PASSWORD}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label={AUTH_MESSAGES.PASSWORD}
                    placeholder={AUTH_MESSAGES.PASSWORD_PLACEHOLDER}
                    value={formData.password}
                    maxLength={128}
                    onChange={(e) => handleInputChange('password', e.target.value.trim())}
                    className={getFieldError(validationErrors, 'password') ? 'border-destructive focus:border-destructive' : ''}
                    required
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {getFieldError(validationErrors, 'password') && (
                    <motion.p
                      className="text-sm text-destructive flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError(validationErrors, 'password')}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : AUTH_MESSAGES.SIGN_IN}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              className="text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {AUTH_MESSAGES.NO_ACCOUNT}{' '}
              <Link to="/register" className="text-primary hover:underline">
                {AUTH_MESSAGES.SIGN_UP}
              </Link>
            </motion.div>

            {/* Forgot Password Link */}
            <motion.div
              className="text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                {AUTH_MESSAGES.FORGOT_PASSWORD}
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
