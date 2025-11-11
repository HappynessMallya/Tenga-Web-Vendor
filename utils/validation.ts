import * as yup from 'yup';

// Sign In validation schema
export const signInSchema = yup.object().shape({
  country: yup.object().shape({
    cca2: yup.string().required('Country is required'),
    name: yup.string().required('Country is required'),
    callingCode: yup.string().required('Country code is required'),
    flag: yup.string().required('Country flag is required'),
  }).required('Country is required'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .matches(/^[0-9]+$/, 'Phone number must contain only digits'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Sign Up validation schema
export const signUpSchema = yup.object().shape({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be at most 50 characters'),
  country: yup.object().shape({
    cca2: yup.string().required('Country is required'),
    name: yup.string().required('Country is required'),
    callingCode: yup.string().required('Country code is required'),
    flag: yup.string().required('Country flag is required'),
  }).required('Country is required'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .matches(/^[0-9]+$/, 'Phone number must contain only digits'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

// Default country (Tanzania)
export const defaultCountry = {
  cca2: 'TZ',
  name: 'Tanzania',
  callingCode: '+255',
  flag: '🇹🇿',
};
