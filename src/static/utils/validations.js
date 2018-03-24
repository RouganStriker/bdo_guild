export const required = value => (value ? undefined : 'This field is required')
export const maxLength = max => value => value && value.length > max ? `Must be ${max} characters or less` : undefined