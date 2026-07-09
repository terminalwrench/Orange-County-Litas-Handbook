import { FormEvent, useState } from "react";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { TextInput } from "../components/ui/inputs";
import { getSidebarLogo } from "../services/settingsService";

interface LoginProps {
  isCheckingSession: boolean;
  isConfigured: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function Login({ isCheckingSession, isConfigured, error, onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDisabled = isCheckingSession || isSubmitting || !isConfigured;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDisabled) return;

    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page" aria-label="Orange County Litas login">
      <section className="login-card">
        <img className="login-card__logo" src={getSidebarLogo()} alt="Orange County Litas" />
        <div className="login-card__heading">
          <span>Founder Access</span>
          <h1>Sign in to the Operations Center</h1>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <FormField label="Email" htmlFor="login-email">
            <TextInput
              id="login-email"
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isDisabled}
              required
            />
          </FormField>
          <FormField label="Password" htmlFor="login-password">
            <TextInput
              id="login-password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isDisabled}
              required
            />
          </FormField>
          {!isConfigured ? (
            <p className="form-status form-status--error">
              Supabase is not configured. Add the portal URL and anon key before signing in.
            </p>
          ) : null}
          {error ? <p className="form-status form-status--error">{error}</p> : null}
          {isCheckingSession ? <p className="form-note">Checking your session...</p> : null}
          <Button type="submit" variant="primary" disabled={isDisabled}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
