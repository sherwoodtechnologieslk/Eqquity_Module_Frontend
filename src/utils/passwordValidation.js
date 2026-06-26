export const PASSWORD_REQUIREMENTS = [
    {
        id: 'length',
        test: (password) => password.length >= 8,
        message: 'At least 8 characters',
    },
    {
        id: 'uppercase',
        test: (password) => /[A-Z]/.test(password),
        message: 'At least one uppercase letter',
    },
    {
        id: 'lowercase',
        test: (password) => /[a-z]/.test(password),
        message: 'At least one lowercase letter',
    },
    {
        id: 'number',
        test: (password) => /\d/.test(password),
        message: 'At least one number',
    },
    {
        id: 'symbol',
        test: (password) => /[^A-Za-z0-9]/.test(password),
        message: 'At least one symbol',
    },
];

export function validatePasswordStrength(password) {
    if (!password) {
        return {
            valid: false,
            errors: PASSWORD_REQUIREMENTS.map((rule) => rule.message),
        };
    }

    const errors = PASSWORD_REQUIREMENTS.filter((rule) => !rule.test(password)).map(
        (rule) => rule.message
    );

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function passwordRequirementSummary() {
    return PASSWORD_REQUIREMENTS.map((rule) => rule.message).join(', ');
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    const data = error?.response?.data;
    if (!data) {
        return error?.message || fallback;
    }

    if (data.retry_after_seconds) {
        return `${data.message} (${data.retry_after_seconds}s)`;
    }

    if (data.attempts_remaining != null && data.code === 'OTP_INVALID') {
        return data.message;
    }

    return data.message || fallback;
}
