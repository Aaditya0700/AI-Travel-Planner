import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Spinner from '../components/Spinner.jsx';

// The same minimum lengths the backend checks in
// server/src/validators/authValidators.js, so the user finds out sooner.
function validate(values) {
  const errors = {};

  if (values.name.trim().length < 2 || values.name.trim().length > 50) {
    errors.name = 'Name must be between 2 and 50 characters';
  }

  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError(null);

    const found = validate(form);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate('/trips', { replace: true });
    } catch (requestError) {
      setServerError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Start planning trips in a couple of minutes.</p>

        <ErrorMessage error={serverError} onDismiss={() => setServerError(null)} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={update('name')}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              required
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              required
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              required
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <Spinner label="Creating account..." /> : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
