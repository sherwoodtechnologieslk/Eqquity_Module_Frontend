import React from 'react';
import { PASSWORD_REQUIREMENTS } from '../../utils/passwordValidation';
import './PasswordRequirements.css';

const PasswordRequirements = ({ password }) => {
    return (
        <ul className="password-requirements" aria-label="Password requirements">
            {PASSWORD_REQUIREMENTS.map((rule) => {
                const met = password ? rule.test(password) : false;
                return (
                    <li key={rule.id} className={met ? 'password-requirements__item--met' : ''}>
                        {rule.message}
                    </li>
                );
            })}
        </ul>
    );
};

export default PasswordRequirements;
