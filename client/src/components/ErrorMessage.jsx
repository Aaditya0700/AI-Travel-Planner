// Shows one message, plus the backend's per-field details when they exist.
// The backend only ever sends short sentences here, never a stack trace.
export default function ErrorMessage({ error, onDismiss }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const details = typeof error === 'string' ? [] : error.details || [];

  if (!message) return null;

  return (
    <div className="alert alert-error" role="alert">
      <div className="alert-body">
        <p>{message}</p>
        {details.length > 0 && (
          <ul className="alert-details">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="alert-close" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
