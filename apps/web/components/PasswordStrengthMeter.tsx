type PasswordStrengthMeterProps = {
  password: string;
};

function getPasswordStrength(password: string) {
  if (!password) {
    return 0;
  }

  let score = 0;
  if (password.length >= 8) {
    score += 1;
  }
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }
  if (/[0-9]/.test(password)) {
    score += 1;
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  }

  return score;
}

function getPasswordStrengthLabel(strength: number) {
  if (strength <= 1) {
    return 'Weak';
  }

  if (strength <= 2) {
    return 'Fair';
  }

  if (strength <= 3) {
    return 'Good';
  }

  return 'Strong';
}

function getPasswordStrengthTextClass(strength: number) {
  if (strength <= 1) {
    return 'text-danger';
  }

  if (strength <= 2) {
    return 'text-warning-strong';
  }

  if (strength <= 3) {
    return 'text-accent-strong';
  }

  return 'text-accent';
}

function getPasswordStrengthBarClass(strength: number) {
  if (strength <= 1) {
    return 'bg-danger';
  }

  if (strength <= 2) {
    return 'bg-warning';
  }

  if (strength <= 3) {
    return 'bg-accent-strong';
  }

  return 'bg-accent';
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 grid gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-strong/60">
        <div
          className={[
            'h-full rounded-full transition-all duration-200',
            getPasswordStrengthBarClass(strength),
          ].join(' ')}
          style={{ width: `${(strength / 4) * 100}%` }}
        />
      </div>
      <p
        className={[
          'text-[0.78rem] font-bold',
          getPasswordStrengthTextClass(strength),
        ].join(' ')}
      >
        Password strength: {getPasswordStrengthLabel(strength)}
      </p>
    </div>
  );
}
